import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  await requireSuperCoordinator(event)
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const { data: coordinators, error } = await serviceRole
    .from('users')
    .select('id, full_name, email, role, created_at')
    .eq('role', 'coordinator')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch coordinators' })
  }

  return { coordinators: (coordinators || []).map(coordinator => ({
    ...coordinator,
    isSuperCoordinator: isSuperCoordinator(event, coordinator)
  })) }
})
