import { serverSupabaseServiceRole, serverSupabaseUser } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const { data: activeSemester } = await serviceRole
    .from('semesters')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  if (!activeSemester) {
    throw createError({ statusCode: 400, statusMessage: 'No active semester found' })
  }

  const { data: entries } = await serviceRole
    .from('weekly_logbook_tracking')
    .select('id, student_id')
    .eq('semester_id', activeSemester.id)
    .eq('is_submitted', false)

  if (!entries || entries.length === 0) {
    return { success: true, reminded: 0 }
  }

  const ids = entries.map(e => e.id)

  const { error: updateError } = await serviceRole
    .from('weekly_logbook_tracking')
    .update({ reminder_sent: true, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update reminders' })
  }

  const notificationRows = entries
    .filter(e => e.student_id)
    .map(e => ({
      recipient_id: e.student_id,
      title: 'Logbook Reminder',
      body: 'Please submit your weekly logbook entry. This is a reminder from your coordinator.',
      type: 'logbook_reminder' as const
    }))

  if (notificationRows.length > 0) {
    await serviceRole.from('notifications').insert(notificationRows)
  }

  return { success: true, reminded: notificationRows.length }
})
