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
      return []
    }

    // 2. Fetch Weekly Logbook Tracking records
    // We join with the 'users' table to get student names
    const { data: logbooks, error: logbooksError } = await supabase
      .from('weekly_logbook_tracking')
      .select(`
        id,
        week_number,
        week_end_date,
        is_submitted,
        submitted_at,
        student_id,
        users:student_id (
          full_name,
          student_id
        )
      `)
      .eq('cohort_id', activeCohort.id)
      .order('week_end_date', { ascending: false })

    if (logbooksError) {
      console.error('[Logbooks API Error]:', logbooksError)
      throw createError({ statusCode: 500, statusMessage: 'Logbook sync failed' })
    }

    const today = new Date().toISOString().split('T')[0]

    const results = (logbooks || []).map((entry: any) => {
      let statusLabel = 'Not Submitted'
      if (entry.is_submitted) {
        statusLabel = 'Submitted'
      } else if (entry.week_end_date < today) {
        statusLabel = 'Late'
      }

      return {
        id: entry.id,
        studentId: entry.student_id,
        studentName: entry.users?.full_name || 'Unknown Student',
        studentMatric: entry.users?.student_id || '---',
        weekNumber: entry.week_number,
        weekEndDate: entry.week_end_date,
        isSubmitted: entry.is_submitted,
        submittedAt: entry.submitted_at,
        statusLabel
      }
    })

    const query = getQuery(event)
    const statusFilter = typeof query.status === 'string' ? query.status : 'all'

    if (statusFilter !== 'all') {
      return results.filter(r => r.statusLabel.toLowerCase() === statusFilter.toLowerCase())
    }

    return results
  } catch (error: any) {
    console.error('[Logbooks API Exception]:', error)
    return [] // Return empty list on failure to avoid crashing dashboard
  }
})
