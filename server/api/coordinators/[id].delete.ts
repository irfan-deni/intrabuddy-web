import { serverSupabaseServiceRole, serverSupabaseUser } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = getUserId(user)
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  // Use service role for actor check to bypass RLS
  const { data: actor, error: actorError } = await serviceRole
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (actorError || !actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const allowedEmails = parseSuperCoordinatorEmails(runtimeConfig.public.superCoordinatorEmails)
  const actorEmail = user.email?.trim().toLowerCase() || ''
  if (!allowedEmails.includes(actorEmail)) {
    throw createError({ statusCode: 403, statusMessage: 'Only super coordinators can delete coordinators' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Coordinator ID is required' })
  }

  const { data: target } = await serviceRole
    .from('users')
    .select('id, role')
    .eq('id', id)
    .single()

  if (!target || target.role !== 'coordinator') {
    throw createError({ statusCode: 404, statusMessage: 'Coordinator not found' })
  }

  const { error: deleteUserError } = await serviceRole
    .from('users')
    .delete()
    .eq('id', id)

  if (deleteUserError) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete coordinator profile: ${deleteUserError?.message}` })
  }

  const { error: authDeleteError } = await serviceRole.auth.admin.deleteUser(id)

  if (authDeleteError) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete auth user: ${authDeleteError?.message}` })
  }

  return { success: true, id }
})
