import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Missing logbook entry ID' })
    }

    const { data: entry, error: fetchError } = await supabase
      .from('weekly_logbook_tracking')
      .select('id, student_id, reminder_sent')
      .eq('id', Number(id))
      .single()

    if (fetchError || !entry) {
      throw createError({ statusCode: 404, statusMessage: 'Logbook entry not found' })
    }

    const { error: updateError } = await supabase
      .from('weekly_logbook_tracking')
      .update({ reminder_sent: true, updated_at: new Date().toISOString() })
      .eq('id', Number(id))

    if (updateError) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to update reminder status' })
    }

    if (entry.student_id) {
      await supabase.from('notifications').insert({
        recipient_id: entry.student_id,
        title: 'Logbook Reminder',
        body: 'Please submit your weekly logbook entry. This is a reminder from your coordinator.',
        type: 'logbook_reminder'
      })
    }

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Reminder dispatch failed' })
  }
})
