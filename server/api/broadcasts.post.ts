import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ title: string; body: string; target_roles: string[] }>(event)
  if (!body.title || !body.body) {
    throw createError({ statusCode: 400, statusMessage: 'Title and body are required.' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: actor, error: actorError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (actorError || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Only coordinators can dispatch broadcasts.' })
  }

  // 1. Insert into broadcast_messages
  const { data: broadcast, error: broadcastError } = await supabase
    .from('broadcast_messages')
    .insert({
      coordinator_id: user.id,
      title: body.title,
      body: body.body,
      target_roles: body.target_roles || ['student'],
      sent_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (broadcastError) {
    throw createError({ statusCode: 500, statusMessage: broadcastError.message })
  }

  // 2. Fetch recipients matching target_roles
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id')
    .in('role', body.target_roles || ['student'])

  if (studentsError) {
    throw createError({ statusCode: 500, statusMessage: studentsError.message })
  }

  // 3. Insert individual notification records
  if (students && students.length > 0) {
    const notificationsToInsert = students.map(student => ({
      recipient_id: student.id,
      title: body.title,
      body: body.body,
      type: 'broadcast',
      is_read: false,
      created_at: new Date().toISOString()
    }))

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert)

    if (notifError) {
      console.error('Failed to create individual notifications', notifError)
    }

    // 4. Send payload to Push Notification Service (Mock)
    console.log(`[Push Notification Service] Sent broadcast to ${students.length} recipients.`)
  }

  return { success: true, queued: students?.length || 0 }
})
