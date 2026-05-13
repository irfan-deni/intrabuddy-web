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

    if (actorError || actor.role !== 'coordinator') {
      throw createError({ statusCode: 403, statusMessage: 'Only coordinators can dispatch broadcasts.' })
    }

    // Map target roles to target audience values
    const targetAudience = body.target_roles?.[0] === 'student' ? 'all_students' : 'all_students'

    // 1. Insert into broadcast_notifications
    const { error: broadcastError } = await supabase
      .from('broadcast_notifications')
      .insert({
        title: body.title,
        message: body.body,
        target_audience: targetAudience,
        created_by: userId
      })

    if (broadcastError) {
      throw createError({ statusCode: 500, statusMessage: `Broadcast Insert Error: ${broadcastError.message}` })
    }

    return { success: true, queued: 1 }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: `Unexpected error: ${error.message || String(error)}` })
  }
})
