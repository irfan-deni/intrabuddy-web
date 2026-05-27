import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)

    const supabase = await serverSupabaseClient<Database>(event)
    
    // 1. Get Active Semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (!activeSemester) {
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
        reminder_sent,
        student_id,
        users:student_id (
          full_name,
          student_id
        )
      `)
      .eq('semester_id', activeSemester.id)
      .order('week_end_date', { ascending: false })

    if (logbooksError) {
      console.error('[Logbooks API Error]:', logbooksError)
      throw createError({ statusCode: 500, statusMessage: 'Logbook sync failed' })
    }

    const today = new Date().toISOString().split('T')[0] as string
    const staleThreshold = 7 // days past week_end_date before considered stale

    type LogbookEntry = {
      id: number
      week_number: number
      week_end_date: string
      is_submitted: boolean | null
      submitted_at: string | null
      reminder_sent: boolean | null
      student_id: string | null
      users: { full_name: string; student_id: string | null } | null
    }

    const results = (logbooks || []).map((entry: LogbookEntry) => {
      let statusLabel = 'Not Submitted'
      if (entry.is_submitted) {
        statusLabel = 'Submitted'
      } else if (entry.week_end_date < today) {
        statusLabel = 'Late'
      }

      const weekEnd = new Date(entry.week_end_date).getTime()
      const daysLate = Math.floor((Date.now() - weekEnd) / (1000 * 60 * 60 * 24))
      const isStale = !entry.is_submitted && daysLate > staleThreshold

      return {
        id: entry.id,
        studentId: entry.student_id,
        studentName: entry.users?.full_name || 'Unknown Student',
        studentMatric: entry.users?.student_id || '---',
        weekNumber: entry.week_number,
        weekEndDate: entry.week_end_date,
        isSubmitted: entry.is_submitted,
        submittedAt: entry.submitted_at,
        statusLabel,
        isStale,
        reminderSent: entry.reminder_sent || false
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
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to load logbook data' })
  }
})
