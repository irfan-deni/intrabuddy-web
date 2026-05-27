import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)

    const supabase = await serverSupabaseClient<Database>(event)

    // Determine target semester from query param
    const { semester_id } = getQuery(event)
    let targetStudentIds: string[] | null = null

    if (semester_id && semester_id !== 'all') {
      // Filter by specific semester
      const { data: studentSemesters } = await supabase
        .from('student_semesters')
        .select('student_id')
        .eq('semester_id', Number(semester_id))

      if (!studentSemesters || studentSemesters.length === 0) {
        return { students: [], totalCount: 0 }
      }

      targetStudentIds = studentSemesters.map(sc => sc.student_id).filter(Boolean) as string[]
    } else if (!semester_id) {
      // Default: filter by active semester
      const { data: activeSemester } = await supabase
        .from('semesters')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (!activeSemester) {
        return { students: [], totalCount: 0 }
      }

      const { data: studentSemesters } = await supabase
        .from('student_semesters')
        .select('student_id')
        .eq('semester_id', activeSemester.id)

      if (!studentSemesters || studentSemesters.length === 0) {
        return { students: [], totalCount: 0 }
      }

      targetStudentIds = studentSemesters.map(sc => sc.student_id).filter(Boolean) as string[]
    }
    // semester_id === 'all' → targetStudentIds stays null → all students

    // 3. Build student profile query
    let profileQuery = supabase
      .from('users')
      .select('id, full_name, student_id, email, phone_number')
      .eq('role', 'student')

    if (targetStudentIds) {
      profileQuery = profileQuery.in('id', targetStudentIds)
    }

    const { data: studentsData, error: studentsError } = await profileQuery

    if (studentsError) throw studentsError

    const allStudentIds = (studentsData || []).map(s => s.id)

    // 4. Fetch related data in parallel for efficiency
    const [appsRes, checklistRes, walletRes] = await Promise.all([
      supabase.from('job_applications').select('student_id, status').in('student_id', allStudentIds),
      supabase.from('student_checklists').select('student_id, is_completed').in('student_id', allStudentIds),
      supabase.from('digital_wallet_items').select('student_id').in('student_id', allStudentIds)
    ])

    // Process and merge data
    const results = (studentsData || []).map(student => {
      // Placement Status Logic
      const studentApps = appsRes.data?.filter(app => app.student_id === student.id) || []
      let placementStatus = 'Searching'
      if (studentApps.some(app => app.status === 'Accepted')) {
        placementStatus = 'Accepted'
      } else if (studentApps.some(app => app.status === 'Interview')) {
        placementStatus = 'Interview'
      } else if (studentApps.length > 0 && studentApps[0]) {
        placementStatus = studentApps[0].status || 'Pending'
      }

      // Checklist Progress Logic
      const studentChecklists = checklistRes.data?.filter(c => c.student_id === student.id) || []
      const totalItems = studentChecklists.length
      const doneItems = studentChecklists.filter(c => c.is_completed).length
      const completionPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

      // Document Count
      const documentCount = walletRes.data?.filter(w => w.student_id === student.id).length || 0

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
    console.error('[Students API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch student directory' })
  }
})
