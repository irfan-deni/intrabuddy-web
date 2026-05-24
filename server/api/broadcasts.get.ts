import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const runtimeConfig = useRuntimeConfig()
    const superEmails = (runtimeConfig.public?.superCoordinatorEmails as string || '')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
    const isSuper = user.email ? superEmails.includes(user.email.toLowerCase()) : false

    if (isSuper) {
      const serviceRole = serverSupabaseServiceRole<Database>(event)
      const { data: broadcasts, error } = await serviceRole
        .from('broadcast_messages')
        .select('*')
        .order('sent_at', { ascending: false })

      if (error) {
        console.error('[Broadcasts GET API Error]:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to fetch broadcast history' })
      }

      return broadcasts || []
    }

    const userId = user.id || (user as any).sub

    const supabase = await serverSupabaseClient<Database>(event)

    const { data: broadcasts, error } = await supabase
      .from('broadcast_messages')
      .select('*')
      .eq('coordinator_id', userId)
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
