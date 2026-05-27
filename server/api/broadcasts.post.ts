import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

type Audience = 'students_all' | 'students_unplaced' | 'students_placed' | 'students_late_logbooks' | 'coordinators_all'

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

    const serviceRole = serverSupabaseServiceRole<Database>(event)
    const authUser = await serverSupabaseUser(event)
    const userId = getUserId(authUser)

    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const { data: actor, error: actorError } = await serviceRole
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
    const { error: broadcastError, data: broadcast } = await serviceRole
      .from('broadcast_messages')
      .insert({
        coordinator_id: userId,
        title: body.title,
        body: body.body,
        target_roles: [audience],
        sent_at: new Date().toISOString()
      })
      .select('id')

    if (broadcastError) {
      console.error('[Broadcasts API] Insert error:', broadcastError)
      throw createError({
        statusCode: 500,
        statusMessage: `Broadcast Insert Error: ${broadcastError.message} (Code: ${broadcastError.code})`
      })
    }

    const broadcastId = broadcast?.[0]?.id

    // 2. Resolve targeted user IDs
    let targetUserIds: string[] = []

    if (audience === 'students_all' || audience === 'students_unplaced' || audience === 'students_placed' || audience === 'students_late_logbooks') {
      const { data: activeSemester } = await serviceRole
        .from('semesters')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (activeSemester) {
        const { data: enrolled } = await serviceRole
          .from('student_semesters')
          .select('student_id')
          .eq('semester_id', activeSemester.id)

        let ids = enrolled?.map(e => e.student_id).filter(Boolean) as string[] || []

        if (audience === 'students_unplaced') {
          const { data: placed } = await (serviceRole.from('users') as any)
            .select('id')
            .in('id', ids)
            .in('internship_status', ['placed', 'completed'])

          const placedIds = new Set(placed?.map((p: any) => p.id) || [])
          ids = ids.filter(id => !placedIds.has(id))
        } else if (audience === 'students_placed') {
          const { data: placed } = await (serviceRole.from('users') as any)
            .select('id')
            .in('id', ids)
            .in('internship_status', ['placed', 'completed'])

          ids = placed?.map((p: any) => p.id) || []
        } else if (audience === 'students_late_logbooks') {
          const lateSubmissionDate = new Date()
          lateSubmissionDate.setDate(lateSubmissionDate.getDate() - 7)
          const { data: lateStudents } = await (serviceRole.from('weekly_logbook_tracking') as any)
            .select('student_id')
            .in('student_id', ids)
            .eq('is_submitted', false)
            .lt('week_end_date', lateSubmissionDate.toISOString().split('T')[0])

          ids = [...new Set<string>(lateStudents?.map((s: any) => s.student_id) || [])]
        }

        targetUserIds = ids
      }
    } else if (audience === 'coordinators_all') {
      const { data: coordinators } = await serviceRole
        .from('users')
        .select('id')
        .eq('role', 'coordinator')
        .neq('id', userId)

      targetUserIds = coordinators?.map(c => c.id).filter(Boolean) as string[] || []
    }

    // 3. Create in-app notifications for targeted users
    if (targetUserIds.length > 0 && broadcastId) {
      const notificationRows = targetUserIds.map(id => ({
        recipient_id: id,
        broadcast_id: broadcastId,
        title: body.title,
        body: body.body,
        type: 'broadcast' as const
      }))
      await serviceRole.from('notifications').insert(notificationRows)
    }

    return { success: true, queued: targetUserIds.length }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: `Unexpected error: ${error.message || String(error)}` })
  }
})
