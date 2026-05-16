import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const session = await serverSupabaseSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  let userId = session.user?.id || (session as any).sub || (session as any).user?.sub
  if (!userId && session.access_token) {
    try {
      const payload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64').toString())
      userId = payload.sub
    } catch (e) {
      // ignore
    }
  }

  if (!userId) {
    throw createError({ statusCode: 500, statusMessage: 'Session has no user ID' })
  }

  const { data: actor, error: actorError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (actorError || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { full_name, student_id, email } = body

  if (!full_name) {
    throw createError({ statusCode: 400, statusMessage: 'Full name is required' })
  }

  // Find active cohort
  const { data: activeCohort } = await supabase
    .from('cohorts')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeCohort) {
    throw createError({ statusCode: 400, statusMessage: 'No active cohort found' })
  }

  // Insert into public.users
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      role: 'student',
      full_name,
      student_id: student_id || null,
      email: email || null
    })
    .select('id')
    .single()

  if (userError || !newUser) {
    throw createError({ statusCode: 500, statusMessage: `Failed to create user: ${userError?.message}` })
  }

  // Enroll in active cohort
  const { error: cohortError } = await supabase
    .from('student_cohorts')
    .insert({
      student_id: newUser.id,
      cohort_id: activeCohort.id
    })

  if (cohortError) {
    // Attempt rollback (delete user) since we're not in a strong transaction
    await supabase.from('users').delete().eq('id', newUser.id)
    throw createError({ statusCode: 500, statusMessage: `Failed to enroll student: ${cohortError.message}` })
  }

  return { success: true, id: newUser.id }
})
