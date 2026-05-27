import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const userId = getUserId(user)

    const client = await serverSupabaseClient<Database>(event)
    const { data: actor } = await client
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (!actor || actor.role !== 'coordinator') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readBody<{
      recipient_id: string
      title: string
      body: string
      type?: string
    }>(event)

    if (!body.recipient_id || !body.title || !body.body) {
      throw createError({ statusCode: 400, statusMessage: 'recipient_id, title, and body are required' })
    }

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
