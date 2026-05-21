import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

const parseSuperCoordinatorEmails = (value: string | undefined) => {
  if (!value) return []
  return value.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!actor || actor.role !== 'coordinator') {
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

  if (!email || !password || !full_name) {
    throw createError({ statusCode: 400, statusMessage: 'Email, password, and full name are required' })
  }

  const serviceRole = serverSupabaseServiceRole(event)

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
