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
  const statusFilter = typeof query.status === 'string' ? query.status : 'all'

  // 1. Get Active Cohort
  const { data: activeCohort } = await supabase
    .from('cohorts')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeCohort) {
    return []
  }

  // 2. Fetch Weekly Logbook Tracking records for this cohort
  const { data: logbooks, error: logbooksError } = await supabase
    .from('weekly_logbook_tracking')
    .select(`
      id,
      week_number,
      week_end_date,
      is_submitted,
      submitted_at,
      updated_at,
      student_id,
      users!weekly_logbook_tracking_student_id_fkey(full_name, student_id)
    `)
    .eq('cohort_id', activeCohort.id)

  if (logbooksError || !logbooks) {
    throw createError({ statusCode: 500, statusMessage: 'Error fetching logbooks' })
  }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const yesterdayTime = new Date().getTime() - (24 * 60 * 60 * 1000)

  let results = logbooks.map((entry: any) => {
    let statusLabel = 'Not Submitted'
    if (entry.is_submitted) {
      statusLabel = 'Submitted'
    } else if (entry.week_end_date < today) {
      statusLabel = 'Late'
    }

    const isStale = new Date(entry.updated_at).getTime() < yesterdayTime

    return {
      id: entry.id,
      studentId: entry.student_id,
      studentName: entry.users?.full_name || 'Unknown',
      studentMatric: entry.users?.student_id || '',
      weekNumber: entry.week_number,
      weekEndDate: entry.week_end_date,
      isSubmitted: entry.is_submitted,
      submittedAt: entry.submitted_at,
      statusLabel,
      isStale
    }
  })

  // Apply filter
  if (statusFilter !== 'all') {
    results = results.filter(r => r.statusLabel.toLowerCase() === statusFilter.toLowerCase())
  }

  // Sort by week_end_date desc, then studentName
  results.sort((a, b) => {
    if (a.weekEndDate !== b.weekEndDate) {
      return b.weekEndDate.localeCompare(a.weekEndDate)
    }
    return a.studentName.localeCompare(b.studentName)
  })

  return results
})
