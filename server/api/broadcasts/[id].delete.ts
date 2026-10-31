import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'
import { cleanupBroadcastImages } from '~~/server/utils/broadcast-media'

export default defineEventHandler(async (event) => {
  const actor = await requireCoordinator(event)
  const id = positiveId(getRouterParam(event, 'id'), 'broadcast ID')

  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const query = serviceRole
    .from('broadcast_messages')
    .delete()
    .eq('id', id)

  if (!isSuperCoordinator(event, actor)) {
    query.eq('coordinator_id', actor.id)
  }

  const { data, error } = await query.select('id, coordinator_id, image_paths')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete broadcast: ${error.message}` })
  }
  if (!data?.length) {
    throw createError({ statusCode: 404, statusMessage: 'Broadcast not found' })
  }

  const broadcast = data[0]!
  // Only delete generated objects under this broadcast owner's folder.
  const prefix = `broadcast-images/${broadcast.coordinator_id}/`
  const paths = (broadcast.image_paths || []).filter(path =>
    broadcast.coordinator_id && path.startsWith(prefix) && /^[0-9a-f-]{36}\.(png|jpg|gif|webp)$/i.test(path.slice(prefix.length))
  )
  await cleanupBroadcastImages(event, paths)
  return { success: true }
})
