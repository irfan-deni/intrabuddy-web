import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'

type Audience = 'students_all' | 'students_unplaced' | 'students_placed' | 'students_late_logbooks' | 'coordinators_all'

const STUDENT_AUDIENCES: Audience[] = ['students_all', 'students_unplaced', 'students_placed', 'students_late_logbooks']

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ title: string; body: string; target_roles: Audience[] }>(event)
    if (!body.title || !body.body) {
      throw createError({ statusCode: 400, statusMessage: 'Title and body are required.' })
    }

    const audience = body.target_roles?.[0]
    if (!audience) {
      throw createError({ statusCode: 400, statusMessage: 'Target audience is required.' })
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
        target_roles: [audience],
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

    // 2. Resolve targeted user IDs
    let targetUserIds: string[] = []

    if (STUDENT_AUDIENCES.includes(audience)) {
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

        let candidateIds = enrolled?.map(e => e.student_id).filter(Boolean) as string[] || []

        if (audience === 'students_unplaced') {
          const { data: placed } = await supabase
            .from('job_applications')
            .select('student_id')
            .in('student_id', candidateIds)
            .eq('status', 'Accepted')

          const placedIds = new Set(placed?.map(p => p.student_id) || [])
          candidateIds = candidateIds.filter(id => !placedIds.has(id))
        } else if (audience === 'students_placed') {
          const { data: placed } = await supabase
            .from('job_applications')
            .select('student_id')
            .in('student_id', candidateIds)
            .eq('status', 'Accepted')

          const placedIds = new Set(placed?.map(p => p.student_id) || [])
          candidateIds = candidateIds.filter(id => placedIds.has(id))
        } else if (audience === 'students_late_logbooks') {
          const { data: late } = await supabase
            .from('weekly_logbook_tracking')
            .select('student_id')
            .in('student_id', candidateIds)
            .eq('is_submitted', false)

          candidateIds = late?.map(l => l.student_id).filter(Boolean) as string[] || []
        }

        targetUserIds = candidateIds
      }
    } else if (audience === 'coordinators_all') {
      const { data: coordinators } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'coordinator')

      targetUserIds = coordinators?.map(c => c.id).filter(Boolean) as string[] || []
    }

    // 3. Create in-app notifications for targeted users
    if (targetUserIds.length > 0) {
      const notificationRows = targetUserIds.map(userId => ({
        recipient_id: userId,
        title: body.title,
        body: body.body,
        type: 'broadcast'
      }))
      await supabase.from('notifications').insert(notificationRows)
    }

    return { success: true, queued: targetUserIds.length }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: `Unexpected error: ${error.message || String(error)}` })
  }
})
