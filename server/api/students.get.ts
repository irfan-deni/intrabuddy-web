import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const supabase = await serverSupabaseClient<Database>(event)

    // Determine target cohort from query param
    const { cohort_id } = getQuery(event)
    let targetStudentIds: string[] | null = null

    if (cohort_id && cohort_id !== 'all') {
      // Filter by specific cohort
      const { data: studentCohorts } = await supabase
        .from('student_cohorts')
        .select('student_id')
        .eq('cohort_id', Number(cohort_id))

      if (!studentCohorts || studentCohorts.length === 0) {
        return { students: [], totalCount: 0 }
      }

      targetStudentIds = studentCohorts.map(sc => sc.student_id).filter(Boolean) as string[]
    } else if (!cohort_id) {
      // Default: filter by active cohort
      const { data: activeCohort } = await supabase
        .from('cohorts')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (!activeCohort) {
        return { students: [], totalCount: 0 }
      }

      const { data: studentCohorts } = await supabase
        .from('student_cohorts')
        .select('student_id')
        .eq('cohort_id', activeCohort.id)

      if (!studentCohorts || studentCohorts.length === 0) {
        return { students: [], totalCount: 0 }
      }

      targetStudentIds = studentCohorts.map(sc => sc.student_id).filter(Boolean) as string[]
    }
    // cohort_id === 'all' → targetStudentIds stays null → all students

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
