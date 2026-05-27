import { serverSupabaseServiceRole, serverSupabaseUser } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = getUserId(user)
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const { data: actor, error: actorError } = await serviceRole
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (actorError || !actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data: coordinators, error } = await serviceRole
    .from('users')
    .select('id, full_name, email, created_at')
    .eq('role', 'coordinator')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch coordinators' })
  }

  return { coordinators: coordinators || [] }
})
