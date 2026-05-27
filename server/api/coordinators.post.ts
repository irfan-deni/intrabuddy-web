import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
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
    throw createError({ statusCode: 403, statusMessage: 'Only super coordinators can create coordinators' })
  }

  const body = await readBody(event)
  const { email, password, full_name } = body

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Full name is required' })
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 characters' })
  }

  const { data: authData, error: authError } = await serviceRole.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  })

  if (authError || !authData.user) {
    throw createError({ statusCode: 500, statusMessage: `Auth user creation failed: ${authError?.message}` })
  }

  const { error: userError } = await serviceRole
    .from('users')
    .upsert({
      id: authData.user.id,
      role: 'coordinator',
      full_name,
      email
    })

  if (userError) {
    await serviceRole.auth.admin.deleteUser(authData.user.id)
    throw createError({ statusCode: 500, statusMessage: `Profile creation failed: ${userError?.message}` })
  }

  return { success: true, id: authData.user.id, email, full_name }
})
