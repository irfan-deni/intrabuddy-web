import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)

    const supabase = await serverSupabaseClient<Database>(event)

    // Determine target semester from query param
    const { semester_id, checklist } = getQuery(event)
    const allSemesters = semester_id === 'all'
    const semesterId = semester_id && !allSemesters ? positiveId(semester_id, 'semester ID') : null
    const missingChecklist = checklist === 'missing' && !allSemesters
    // Inner joins apply semester filtering within the profile query rather than
    // waiting for semester and enrollment ID requests before loading profiles.
    const studentFields = 'id, full_name, student_id, email, phone_number, applications:job_applications!job_applications_student_id_fkey(status, semester_id), checklists:student_checklists!student_checklists_student_id_fkey(is_completed, checklist_item_id), documents:digital_wallet_items!digital_wallet_items_student_id_fkey(id)' as const
    const profiles = supabase.from('users')
    const profileQuery = allSemesters
      ? profiles.select(studentFields).eq('role', 'student')
      : semesterId
        ? profiles.select(`${studentFields}, enrollment:student_semesters!inner(semester_id)`)
          .eq('role', 'student').eq('enrollment.semester_id', semesterId)
        : profiles.select(`${studentFields}, enrollment:student_semesters!inner(semester_id, semester:semesters!inner(is_active))`)
          .eq('role', 'student').eq('enrollment.semester.is_active', true)

    const { data: studentsData, error: studentsError } = await profileQuery

    if (studentsError) throw studentsError
    const requiredBySemester = new Map<number, number[]>()
    if (missingChecklist && studentsData?.length) {
      const semesterIds = [...new Set(studentsData.flatMap(student =>
        ('enrollment' in student ? student.enrollment : []).flatMap(row => row.semester_id == null ? [] : [row.semester_id])
      ))]
      if (semesterIds.length) {
        const { data: templates, error } = await supabase.from('checklist_templates')
          .select('id, semester_id').eq('required', true).in('semester_id', semesterIds)
        if (error) throw error
        for (const template of templates || []) {
          if (template.semester_id == null) continue
          const ids = requiredBySemester.get(template.semester_id) || []
          ids.push(template.id)
          requiredBySemester.set(template.semester_id, ids)
        }
      }
    }

    // Related rows arrive grouped by the database, so each is inspected only
    // for its owning student rather than rescanning whole tables per student.
    const results = (studentsData || []).flatMap(student => {
      const studentSemesterId = semesterId ?? ('enrollment' in student ? student.enrollment[0]?.semester_id : undefined)
      const apps = (student.applications || []).filter(app => allSemesters || app.semester_id === studentSemesterId)
      const placementStatus = apps.some(app => app.status === 'Accepted') ? 'Accepted'
        : apps.some(app => app.status === 'Interview') ? 'Interview'
          : apps.length > 0 ? apps[0]?.status || 'Pending' : 'Searching'
      const checklists = student.checklists || []
      if (missingChecklist) {
        const completed = new Set(checklists.filter(item => item.is_completed).map(item => item.checklist_item_id))
        if (studentSemesterId == null || !requiredBySemester.get(studentSemesterId)?.some(id => !completed.has(id))) return []
      }
      const doneItems = checklists.filter(item => item.is_completed).length
      const completionPercent = checklists.length > 0 ? Math.round((doneItems / checklists.length) * 100) : 0
      const documentCount = student.documents?.length || 0

      return [{
        id: student.id,
        full_name: student.full_name,
        student_id: student.student_id,
        email: student.email,
        phone_number: student.phone_number,
        placementStatus,
        completionPercent,
        documentCount
      }]
    })

    return {
      students: results,
      totalCount: results.length
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Students API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch student directory' })
  }
})
