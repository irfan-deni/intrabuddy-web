import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const actor = await requireCoordinator(event)
  const query = serverSupabaseServiceRole<Database>(event)
    .from('broadcast_messages').select('*').order('sent_at', { ascending: false })
  if (!isSuperCoordinator(event, actor)) query.eq('coordinator_id', actor.id)

  const { data, error } = await query
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch broadcast history' })
  }
  return data || []
})
