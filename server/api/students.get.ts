import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)

    const supabase = await serverSupabaseClient<Database>(event)

    // Determine target semester from query param
    const { semester_id } = getQuery(event)
    // Inner joins apply semester filtering within the profile query rather than
    // waiting for semester and enrollment ID requests before loading profiles.
    const studentFields = 'id, full_name, student_id, email, phone_number, applications:job_applications!job_applications_student_id_fkey(status), checklists:student_checklists!student_checklists_student_id_fkey(is_completed), documents:digital_wallet_items!digital_wallet_items_student_id_fkey(id)' as const
    const profiles = supabase.from('users')
    const profileQuery = semester_id === 'all'
      ? profiles.select(studentFields).eq('role', 'student')
      : semester_id
        ? profiles.select(`${studentFields}, enrollment:student_semesters!inner(semester_id)`)
          .eq('role', 'student').eq('enrollment.semester_id', positiveId(semester_id, 'semester ID'))
        : profiles.select(`${studentFields}, enrollment:student_semesters!inner(semester:semesters!inner(is_active))`)
          .eq('role', 'student').eq('enrollment.semester.is_active', true)

    const { data: studentsData, error: studentsError } = await profileQuery

    if (studentsError) throw studentsError

    // Related rows arrive grouped by the database, so each is inspected only
    // for its owning student rather than rescanning whole tables per student.
    const results = (studentsData || []).map(student => {
      const apps = student.applications || []
      const placementStatus = apps.some(app => app.status === 'Accepted') ? 'Accepted'
        : apps.some(app => app.status === 'Interview') ? 'Interview'
          : apps.length > 0 ? apps[0]?.status || 'Pending' : 'Searching'
      const checklists = student.checklists || []
      const doneItems = checklists.filter(item => item.is_completed).length
      const completionPercent = checklists.length > 0 ? Math.round((doneItems / checklists.length) * 100) : 0
      const documentCount = student.documents?.length || 0

      return {
        id: student.id,
        full_name: student.full_name,
        student_id: student.student_id,
        email: student.email,
        phone_number: student.phone_number,
        placementStatus,
        completionPercent,
        documentCount
      }
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
