import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const supabase = await serverSupabaseClient<Database>(event)

    const { data: broadcasts, error } = await supabase
      .from('broadcast_messages')
      .select('*')
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('[Broadcasts GET API Error]:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch broadcast history' })
    }

    return broadcasts || []
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Broadcasts GET Exception]:', error)
    return []
  }
})
