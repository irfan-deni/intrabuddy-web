import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)
    const serviceRole = serverSupabaseServiceRole<Database>(event)
    const { data, error } = await serviceRole
      .from('notifications')
      .select('*, broadcast:broadcast_messages(title, body)')
      .eq('type', 'manual_alert')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error
    return data || []
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Alerts API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch individual alerts' })
  }
})
