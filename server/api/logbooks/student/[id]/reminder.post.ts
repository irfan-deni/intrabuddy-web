import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  await requireCoordinator(event)

  const studentId = getRouterParam(event, 'id')
  if (!studentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid student ID' })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  const { data: semester, error: semesterError } = await supabase
    .from('semesters').select('id').eq('is_active', true).maybeSingle()
  if (semesterError) throw createError({ statusCode: 500, statusMessage: 'Failed to find active semester' })
  if (!semester) throw createError({ statusCode: 400, statusMessage: 'No active semester found' })

  const { data: entries, error: entriesError } = await supabase
    .from('weekly_logbook_tracking')
    .select('id, week_number')
    .eq('semester_id', semester.id)
    .eq('student_id', studentId)
    .eq('is_submitted', false)
  if (entriesError) throw createError({ statusCode: 500, statusMessage: 'Failed to find outstanding logbooks' })
  if (!entries?.length) throw createError({ statusCode: 404, statusMessage: 'No outstanding logbooks found for this student' })

  const weeks = entries.map(entry => entry.week_number).sort((a, b) => a - b)
  const { error: notificationError } = await supabase.from('notifications').insert({
    recipient_id: studentId,
    title: 'Logbook Reminder',
    body: `Please submit your outstanding weekly logbooks (weeks ${weeks.join(', ')}). This is a reminder from your coordinator.`,
    type: 'logbook_reminder'
  })
  if (notificationError) throw createError({ statusCode: 500, statusMessage: 'Failed to send reminder' })

  const { error: updateError } = await supabase.from('weekly_logbook_tracking')
    .update({ reminder_sent: true, updated_at: new Date().toISOString() })
    .in('id', entries.map(entry => entry.id))
    .eq('is_submitted', false)
  if (updateError) throw createError({ statusCode: 500, statusMessage: 'Reminder sent, but reminder statuses could not be updated' })

  return { success: true, entryIds: entries.map(entry => entry.id) }
})
