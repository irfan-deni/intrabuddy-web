import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/supabase'

export const requireCoordinator = async (event: any) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const serviceRole = serverSupabaseServiceRole<Database>(event)
  const { data: actor } = await serviceRole
    .from('users')
    .select('role')
    .eq('id', getUserId(user))
    .single()

  if (!actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return user
}
