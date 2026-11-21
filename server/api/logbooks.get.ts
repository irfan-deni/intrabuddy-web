import { serverSupabaseClient, serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { logbookReviewQueue } from '~~/server/utils/logbook-review-queue'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const awaitingReview = query.review === 'awaiting'
    if (awaitingReview) await requireSuperCoordinator(event)
    else await requireCoordinator(event)

    const weekEnd = query.week_end
    if (weekEnd !== undefined) {
      if (typeof weekEnd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(weekEnd)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid reporting week' })
      }
      const date = new Date(`${weekEnd}T00:00:00Z`)
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== weekEnd || weekEnd.startsWith('0000-')) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid reporting week' })
      }
    }

    const supabase = await serverSupabaseClient<Database>(event)
    
    // 1. Get Active Semester
    const { data: activeSemester, error: semesterError } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (semesterError) throw semesterError
    if (!activeSemester) {
      return []
    }

    // 2. Fetch Weekly Logbook Tracking records
    // We join with the 'users' table to get student names
    const logbookQuery = awaitingReview
      ? logbookReviewQueue(serverSupabaseServiceRole<Database>(event), activeSemester.id)
      : supabase
      .from('weekly_logbook_tracking')
      .select(`
        id,
        week_number,
        week_end_date,
        is_submitted,
        submitted_at,
        reminder_sent,
        student_id,
        users:student_id!inner (
          full_name,
          student_id
        )
      `)
      .eq('semester_id', activeSemester.id)
      .eq('users.role', 'student')
    // Filter before PostgREST applies its row limit, so earlier weeks do not
    // disappear behind newer records when opened from the dashboard.
    if (weekEnd) logbookQuery.eq('week_end_date', weekEnd)
    const { data: logbooks, error: logbooksError } = await logbookQuery.order('week_end_date', { ascending: awaitingReview }).order('id')

    if (logbooksError) {
      console.error('[Logbooks API Error]:', logbooksError)
      throw createError({ statusCode: 500, statusMessage: 'Logbook sync failed' })
    }

    const filteredLogbooks = logbooks || []

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

    const results = filteredLogbooks.map((entry: LogbookEntry) => {
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
