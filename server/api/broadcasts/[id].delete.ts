import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const session = await serverSupabaseSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  let userId = session.user?.id || (session as any).sub || (session as any).user?.sub
  if (!userId && session.access_token) {
    try {
      const payload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64').toString())
      userId = payload.sub
    } catch (e) {
      // ignore
    }
  }

  if (!userId) {
    throw createError({ statusCode: 500, statusMessage: 'Session has no user ID' })
  }

  const { data: actor, error: actorError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (actorError || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const broadcastId = getRouterParam(event, 'id')
  if (!broadcastId) {
    throw createError({ statusCode: 400, statusMessage: 'Broadcast ID is required' })
  }

  const id = Number(broadcastId)
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid broadcast ID' })
  }

  const { error } = await supabase
    .from('broadcast_messages')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete broadcast: ${error.message}` })
  }

  return { success: true }
})
