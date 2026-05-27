import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const supabase = await serverSupabaseClient<Database>(event)

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*, broadcast:broadcast_messages(title, body)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch notifications' })
    }

    return notifications || []
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch notifications' })
  }
})
