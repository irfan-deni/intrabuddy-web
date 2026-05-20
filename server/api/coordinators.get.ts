import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.sub)
    .single()

  if (!actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data: coordinators, error } = await supabase
    .from('users')
    .select('id, full_name, email, created_at')
    .eq('role', 'coordinator')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch coordinators' })
  }

  return { coordinators: coordinators || [] }
})
