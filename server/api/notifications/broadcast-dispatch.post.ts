import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

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

const parseSuperCoordinatorEmails = (value: string | undefined) => {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<DispatchBody>(event)
  if (!body.broadcastId) {
    throw createError({ statusCode: 400, statusMessage: 'broadcastId is required' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: actorProfile, error: actorError } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (actorError) {
    throw createError({ statusCode: 500, statusMessage: actorError.message })
  }

  if (actorProfile.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Only coordinators can dispatch broadcasts.' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const allowedEmails = parseSuperCoordinatorEmails(runtimeConfig.public.superCoordinatorEmails)
  const actorEmail = user.email?.trim().toLowerCase() || ''

  if (!allowedEmails.includes(actorEmail)) {
    throw createError({ statusCode: 403, statusMessage: 'Only super coordinators can dispatch broadcasts.' })
  }

  const { data: broadcast, error: broadcastError } = await supabase
    .from('broadcast_notifications')
    .select('id, title, message, target_audience')
    .eq('id', body.broadcastId)
    .single<BroadcastRow>()

  if (broadcastError || !broadcast) {
    throw createError({ statusCode: 404, statusMessage: 'Broadcast not found.' })
  }

  let studentsQuery = supabase
    .from('users')
    .select('id')
    .eq('role', 'student')
    .eq('is_active', true)

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
  const outboxRows = students.map((student) => {
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

  const { error: insertError } = await supabase
    .from('mobile_notification_outbox')
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