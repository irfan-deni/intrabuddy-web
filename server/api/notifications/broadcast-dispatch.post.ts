import { serverSupabaseClient } from '~~/server/utils/supabase-server'

type DispatchBody = {
  broadcastId?: string
}

type BroadcastRow = {
  id: string
  title: string
  message: string
  target_audience: 'all_students' | 'unplaced_students'
}

const isMissingRelationError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('relation') && normalized.includes('does not exist')
}

export default defineEventHandler(async (event) => {
  await requireSuperCoordinator(event)

  const body = await readBody<DispatchBody>(event)
  if (!body.broadcastId) {
    throw createError({ statusCode: 400, statusMessage: 'broadcastId is required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: broadcast, error: broadcastError } = await (supabase
    .from('broadcast_notifications') as any)
    .select('id, title, message, target_audience')
    .eq('id', body.broadcastId)
    .single()

  if (broadcastError || !broadcast) {
    throw createError({ statusCode: 404, statusMessage: 'Broadcast not found.' })
  }

  let studentsQuery = (supabase
    .from('users') as any)
    .select('id')
    .eq('role', 'student')

  if (broadcast.target_audience === 'unplaced_students') {
    studentsQuery = studentsQuery.in('internship_status', ['preparing', 'searching'])
  }

  const { data: students, error: studentsError } = await studentsQuery
  if (studentsError) {
    throw createError({ statusCode: 500, statusMessage: studentsError.message })
  }

  if (!students || students.length === 0) {
    return {
      ok: true,
      queued: 0,
      reason: 'No matching students found for this audience.'
    }
  }

  const queuedAt = new Date().toISOString()
  const outboxRows = students.map((student: { id: string }) => {
    return {
      broadcast_id: broadcast.id,
      user_id: student.id,
      status: 'queued',
      channel: 'mobile_push',
      queued_at: queuedAt,
      payload: {
        title: broadcast.title,
        message: broadcast.message,
        targetAudience: broadcast.target_audience
      }
    }
  })

  const { error: insertError } = await (supabase
    .from('mobile_notification_outbox') as any)
    .insert(outboxRows)

  if (insertError) {
    if (isMissingRelationError(insertError.message)) {
      return {
        ok: false,
        queued: 0,
        requiresSetup: true,
        message: 'mobile_notification_outbox table is missing. Apply docs/mobile-notifications-setup.sql first.'
      }
    }

    throw createError({ statusCode: 500, statusMessage: insertError.message })
  }

  return {
    ok: true,
    queued: outboxRows.length
  }
})
