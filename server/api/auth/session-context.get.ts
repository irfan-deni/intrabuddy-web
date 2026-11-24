import { setResponseHeader } from 'h3'
import { isSuperCoordinator } from '../../utils/auth-role'
import { serverSupabaseClient, serverSupabaseUser } from '../../utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // Use the caller's session and RLS, and only read the verified user's row.
  const { data: profile, error } = await serverSupabaseClient<Database>(event)
    .from('users')
    .select('id, email, full_name, role, student_id, phone_number, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load profile' })
  return {
    profile,
    isSuperCoordinator: profile ? isSuperCoordinator(event, { role: profile.role, email: user.email }) : false
  }
})
