import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const actor = await requireSuperCoordinator(event)
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Coordinator ID is required' })
  }
  if (id === actor.id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own coordinator account' })
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
    if (deleteUserError.code === '23503') {
      throw createError({ statusCode: 409, statusMessage: 'Reassign this coordinator’s students before deleting the account' })
    }
    throw createError({ statusCode: 500, statusMessage: `Failed to delete coordinator profile: ${deleteUserError?.message}` })
  }

  const { error: authDeleteError } = await serviceRole.auth.admin.deleteUser(id)

  if (authDeleteError) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete auth user: ${authDeleteError?.message}` })
  }

  return { success: true, id }
})
