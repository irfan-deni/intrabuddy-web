import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody<{ title: string; body: string; target_roles: string[] }>(event)
    if (!body.title || !body.body) {
      throw createError({ statusCode: 400, statusMessage: 'Title and body are required.' })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    
    const userId = session.user?.id || (session as any).sub || (session as any).user?.sub
    if (!userId) {
      throw createError({ statusCode: 500, statusMessage: 'Session has no user ID' })
    }

    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (actorError) {
      throw createError({ statusCode: 500, statusMessage: `Failed to fetch user: ${actorError.message}` })
    }

    if (!actor || actor.role !== 'coordinator') {
      throw createError({ statusCode: 403, statusMessage: 'Only coordinators can dispatch broadcasts.' })
    }

    // 1. Insert into broadcast_messages
    const { error: broadcastError, data } = await supabase
      .from('broadcast_messages')
      .insert({
        coordinator_id: userId,
        title: body.title,
        body: body.body,
        target_roles: body.target_roles || ['student'],
        sent_at: new Date().toISOString()
      })
      .select()

    if (broadcastError) {
      console.error('[Broadcasts API] Insert error:', broadcastError)
      throw createError({ 
        statusCode: 500, 
        statusMessage: `Broadcast Insert Error: ${broadcastError.message} (Code: ${broadcastError.code})` 
      })
    }

    return { success: true, queued: 1 }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: `Unexpected error: ${error.message || String(error)}` })
  }
})
