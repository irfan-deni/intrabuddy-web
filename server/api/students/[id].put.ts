import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
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

  const body = await readBody(event)
  const { full_name, student_id, email } = body

  if (!full_name) {
    throw createError({ statusCode: 400, statusMessage: 'Full name is required' })
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name,
      student_id: student_id || null,
      email: email || null
    })
    .eq('id', studentId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to update student: ${error.message}` })
  }

  return { success: true }
})
