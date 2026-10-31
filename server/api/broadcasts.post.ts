import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'
import { cleanupBroadcastImages, readBroadcastRequest, uploadBroadcastImages } from '~~/server/utils/broadcast-media'

type Audience = 'students_all' | 'students_unplaced' | 'students_placed' | 'students_late_logbooks' | 'coordinators_all'

export default defineEventHandler(async (event) => {
  try {
    const actor = await requireCoordinator(event)
    const userId = actor.id
    const body = await readBroadcastRequest(event)
    if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 ||
      typeof body.body !== 'string' || !body.body.trim() || body.body.length > 20000) {
      throw createError({ statusCode: 400, statusMessage: 'Title and body are required.' })
    }

    const audience = Array.isArray(body.target_roles) ? body.target_roles[0] as Audience : undefined
    if (!Array.isArray(body.target_roles) || body.target_roles.length !== 1 ||
      !['students_all', 'students_unplaced', 'students_placed', 'students_late_logbooks', 'coordinators_all'].includes(audience || '')) {
      throw createError({ statusCode: 400, statusMessage: 'Target audience is required.' })
    }

    const serviceRole = serverSupabaseServiceRole<Database>(event)

    const media = body.images.length ? await uploadBroadcastImages(event, userId, body.images) : { paths: [], urls: [] }
    const storedBody = body.body
    if (storedBody.length > 20000) {
      await cleanupBroadcastImages(event, media.paths)
      throw createError({ statusCode: 400, statusMessage: 'Message and attachments exceed the announcement length limit.' })
    }
    const { error: broadcastError, data: broadcast } = await serviceRole.from('broadcast_messages').insert({
      coordinator_id: userId, title: body.title.trim(), body: storedBody, image_paths: media.paths, target_roles: [audience], sent_at: new Date().toISOString()
    }).select('id')
    if (broadcastError) {
      // A SQL validation/constraint/permission error proves the insert rolled
      // back. On timeouts or ambiguous responses, retain the images: the record
      // might already be committed, and deleting them would break a sent post.
      const rolledBack = /^(22|23|42)/.test(broadcastError.code || '')
      if (rolledBack) await cleanupBroadcastImages(event, media.paths)
      console.error('[Announcements] Save failed', { code: broadcastError.code })
      throw createError({ statusCode: 502, statusMessage: rolledBack
        ? 'The announcement was not saved. Your draft is unchanged; please try again.'
        : 'Sending could not be confirmed. Check announcement history before retrying to avoid a duplicate.' })
    }
    const broadcastId = broadcast?.[0]?.id
    if (!broadcastId) throw createError({ statusCode: 502, statusMessage: 'Sending could not be confirmed. Check announcement history before retrying.' })

    return { success: true, broadcastId }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Announcements] Unexpected send failure')
    throw createError({ statusCode: 502, statusMessage: 'Sending could not be confirmed. Check announcement history before retrying to avoid a duplicate.' })
  }
})
