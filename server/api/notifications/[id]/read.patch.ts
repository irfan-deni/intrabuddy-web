import { serverSupabaseServiceRole, serverSupabaseUser } from '~~/server/utils/supabase-server'
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

  const id = positiveId(getRouterParam(event, 'id'), 'notification ID')

  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const { data, error } = await serviceRole
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('recipient_id', userId)
    .select('id')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to mark notification as read: ${error.message}` })
  }
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Notification not found' })

  return { success: true }
})
