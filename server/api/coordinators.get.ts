import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = user.id || (user as any).sub
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const { data: actor, error: actorError } = await serviceRole
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  console.log(`[Coordinators API] Actor lookup: ID=${userId}, Role=${actor?.role}`)

  if (actorError || !actor || actor.role !== 'coordinator') {
    console.error('[Coordinators API] Actor lookup error or unauthorized:', actorError)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { data: coordinators, error } = await serviceRole
    .from('users')
    .select('id, full_name, email, created_at')
    .eq('role', 'coordinator')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Coordinators API] Fetch error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch coordinators' })
  }

  console.log(`[Coordinators API] Found ${coordinators?.length || 0} coordinators`)

  return { coordinators: coordinators || [] }
})
