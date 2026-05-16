import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    
    // 1. Get Active Cohort
    const { data: activeCohort } = await supabase
      .from('cohorts')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (!activeCohort) {
      return { students: [], totalCount: 0 }
    }

    // 2. Get students in active cohort
    const { data: studentCohorts } = await supabase
      .from('student_cohorts')
      .select('student_id')
      .eq('cohort_id', activeCohort.id)

    if (!studentCohorts || studentCohorts.length === 0) {
      return { students: [], totalCount: 0 }
    }

    const activeStudentIds = studentCohorts.map(sc => sc.student_id).filter(Boolean) as string[]

    // 3. Fetch student profiles
    const { data: studentsData, error: studentsError } = await supabase
      .from('users')
      .select('id, full_name, student_id, email')
      .eq('role', 'student')
      .in('id', activeStudentIds)

    if (studentsError) throw studentsError

    // 4. Fetch related data in parallel for efficiency
    const [appsRes, checklistRes, walletRes] = await Promise.all([
      supabase.from('job_applications').select('student_id, status').in('student_id', activeStudentIds),
      supabase.from('student_checklists').select('student_id, is_completed').in('student_id', activeStudentIds),
      supabase.from('digital_wallet_items').select('student_id').in('student_id', activeStudentIds)
    ])

    // Process and merge data
    const results = (studentsData || []).map(student => {
      // Placement Status Logic
      const studentApps = appsRes.data?.filter(app => app.student_id === student.id) || []
      let placementStatus = 'Searching'
      if (studentApps.some(app => app.status === 'Accepted')) {
        placementStatus = 'Accepted'
      } else if (studentApps.length > 0) {
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
