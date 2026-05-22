import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: actor, error: actorError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (actorError || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const studentId = getRouterParam(event, 'id')
  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: 'Student ID is required' })
  }

  const serviceRole = serverSupabaseServiceRole(event)

  // Delete from public.users first, then auth.users
  const { error: deleteError } = await serviceRole
    .from('users')
    .delete()
    .eq('id', studentId)

  if (deleteError) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete student: ${deleteError.message}` })
  }

  const { error: authError } = await serviceRole.auth.admin.deleteUser(studentId)
  if (authError) {
    console.error('[Student Delete] Failed to delete auth user:', authError.message)
  }

  return { success: true }
})
