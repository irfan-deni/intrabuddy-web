import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ title: string; body: string; target_roles: string[] }>(event)
    if (!body.title || !body.body) {
      throw createError({ statusCode: 400, statusMessage: 'Title and body are required.' })
    }

    const supabase = await serverSupabaseClient<Database>(event)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (userError) {
      throw createError({ statusCode: 500, statusMessage: `Failed to read auth user: ${userError.message}` })
    }

    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
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

    // 2. Create in-app notifications for targeted students
    const shouldNotifyStudents = body.target_roles?.includes('student') ?? true
    if (shouldNotifyStudents) {
      const { data: activeCohort } = await supabase
        .from('cohorts')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (activeCohort) {
        const { data: enrolled } = await supabase
          .from('student_cohorts')
          .select('student_id')
          .eq('cohort_id', activeCohort.id)

        const studentIds = enrolled?.map(e => e.student_id).filter(Boolean) as string[]
        if (studentIds.length > 0) {
          const notificationRows = studentIds.map(studentId => ({
            recipient_id: studentId,
            title: body.title,
            body: body.body,
            type: 'broadcast'
          }))
          await supabase.from('notifications').insert(notificationRows)
        }
      }
    }

    return { success: true, queued: 1 }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: `Unexpected error: ${error.message || String(error)}` })
  }
})
