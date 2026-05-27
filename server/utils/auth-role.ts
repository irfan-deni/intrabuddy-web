import { serverSupabaseServiceRole, serverSupabaseUser } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'
import type { H3Event } from 'h3'

export const requireCoordinator = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: actor } = await serverSupabaseServiceRole<Database>(event)
    .from('users')
    .select('role')
    .eq('id', user.id!)
    .single()

  if (!actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return user
}
