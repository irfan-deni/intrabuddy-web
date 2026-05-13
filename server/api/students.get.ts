import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const session = await serverSupabaseSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  
  const userId = session.user?.id || (session as any).sub || (session as any).user?.sub
  if (!userId) {
    throw createError({ statusCode: 500, statusMessage: 'Session has no user ID' })
  }

  const { data: actor, error: actorError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (actorError || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim().toLowerCase() : ''
  const statusFilter = typeof query.status === 'string' ? query.status : 'all'

  // 1. Get Active Cohort
  const { data: activeCohort } = await supabase
    .from('cohorts')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeCohort) {
    return { students: [], totalCount: 0 }
  }

  // 2. Get students in active cohort
  const { data: studentCohorts, error: scError } = await supabase
    .from('student_cohorts')
    .select('student_id')
    .eq('cohort_id', activeCohort.id)

  if (scError || !studentCohorts || studentCohorts.length === 0) {
    return { students: [], totalCount: 0 }
  }

  const activeStudentIds = studentCohorts.map(sc => sc.student_id).filter(Boolean) as string[]

  // 3. Fetch all active students
  const { data: studentsData, error: studentsError } = await supabase
    .from('users')
    .select('id, full_name, student_id')
    .eq('role', 'student')
    .in('id', activeStudentIds)

  if (studentsError || !studentsData) {
    throw createError({ statusCode: 500, statusMessage: 'Error fetching students' })
  }

  // 4. Fetch Job Applications to determine status
  const { data: appsData } = await supabase
    .from('job_applications')
    .select('student_id, status, application_date')
    .in('student_id', activeStudentIds)
    .order('application_date', { ascending: false }) // latest first

  // 5. Fetch Checklists to calculate progress
  const { data: checklistData } = await supabase
    .from('student_checklists')
    .select('student_id, is_completed')
    .in('student_id', activeStudentIds)

  // 6. Fetch Wallet items to show document count
  const { data: walletData } = await supabase
    .from('digital_wallet_items')
    .select('student_id')
    .in('student_id', activeStudentIds)

  // Process data
  let results = studentsData.map(student => {
    // Determine latest application status
    const studentApps = appsData?.filter(app => app.student_id === student.id) || []
    let placementStatus = 'Searching'
    if (studentApps.length > 0) {
      // Find if any is accepted
      const accepted = studentApps.find(app => app.status === 'Accepted')
      if (accepted) {
        placementStatus = 'Accepted'
      } else {
        // Fallback to the latest application status
        placementStatus = studentApps[0].status || 'Pending'
      }
    }

    // Calculate checklist completion
    const studentChecklists = checklistData?.filter(c => c.student_id === student.id) || []
    const totalChecklists = studentChecklists.length
    const completedChecklists = studentChecklists.filter(c => c.is_completed).length
    const completionPercent = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0

    // Count wallet items
    const documentCount = walletData?.filter(w => w.student_id === student.id).length || 0

    return {
      id: student.id,
      full_name: student.full_name,
      student_id: student.student_id,
      placementStatus,
      completionPercent,
      documentCount
    }
  })

  // Apply Search Filter
  if (search) {
    results = results.filter(s => 
      s.full_name.toLowerCase().includes(search) || 
      (s.student_id && s.student_id.toLowerCase().includes(search))
    )
  }

  // Apply Status Filter
  if (statusFilter !== 'all') {
    results = results.filter(s => s.placementStatus.toLowerCase() === statusFilter.toLowerCase())
  }

  // Sort alphabetically
  results.sort((a, b) => a.full_name.localeCompare(b.full_name))

  return {
    students: results,
    totalCount: results.length
  }
})
