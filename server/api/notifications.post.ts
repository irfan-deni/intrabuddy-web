import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)

    const body = await readBody<{
      recipient_id: string
      title: string
      body: string
      type?: string
    }>(event)

    if (!body || typeof body.recipient_id !== 'string' || !body.recipient_id ||
      typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 ||
      typeof body.body !== 'string' || !body.body.trim() || body.body.length > 20000 ||
      (body.type !== undefined && body.type !== 'manual_alert')) {
      throw createError({ statusCode: 400, statusMessage: 'recipient_id, title, and body are required' })
    }
    await requireStudentTarget(event, body.recipient_id)

    const serviceRole = serverSupabaseServiceRole<Database>(event)
    const { data, error } = await serviceRole
      .from('notifications')
      .insert({
        recipient_id: body.recipient_id,
        title: body.title,
        body: body.body,
        type: body.type || 'manual_alert'
      })
      .select()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Notification creation failed' })
    }

    return { success: true, notification: data?.[0] }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to send notification' })
  }
})
