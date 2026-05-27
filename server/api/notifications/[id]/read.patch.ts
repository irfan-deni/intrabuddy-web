import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = getUserId(user)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const notificationId = getRouterParam(event, 'id')
  if (!notificationId) {
    throw createError({ statusCode: 400, statusMessage: 'Notification ID is required' })
  }

  const id = Number(notificationId)
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid notification ID' })
  }

  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const { error } = await serviceRole
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('recipient_id', userId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to mark notification as read: ${error.message}` })
  }

  return { success: true }
})
