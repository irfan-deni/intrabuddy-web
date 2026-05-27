import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = getUserId(user)

  const runtimeConfig = useRuntimeConfig()
  const superEmails = (runtimeConfig.public?.superCoordinatorEmails as string || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
  const isSuper = user.email ? superEmails.includes(user.email.toLowerCase()) : false

  const broadcastId = getRouterParam(event, 'id')
  if (!broadcastId) {
    throw createError({ statusCode: 400, statusMessage: 'Broadcast ID is required' })
  }

  const id = Number(broadcastId)
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid broadcast ID' })
  }

  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const query = serviceRole
    .from('broadcast_messages')
    .delete()
    .eq('id', id)

  if (!isSuper) {
    query.eq('coordinator_id', userId)
  }

  const { error } = await query

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete broadcast: ${error.message}` })
  }

  return { success: true }
})
