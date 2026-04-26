import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

type UserProfile = {
  id: string
  role: 'student' | 'coordinator'
  internship_status: 'preparing' | 'searching' | 'placed' | 'completed'
  is_active: boolean
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)
  const since = typeof query.since === 'string' && query.since.trim() ? query.since.trim() : null

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role, internship_status, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .single<UserProfile>()

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: profileError.message })
  }

  if (profile.role !== 'student') {
    throw createError({ statusCode: 403, statusMessage: 'Only students can use mobile sync.' })
  }

  let logbookQuery = supabase
    .from('logbook_compliance')
    .select('id, week_number, submission_status, self_reported_at')
    .eq('student_id', user.id)
    .order('week_number', { ascending: true })

  if (since) {
    logbookQuery = logbookQuery.gte('self_reported_at', since)
  }

  let broadcastQuery = supabase
    .from('broadcast_notifications')
    .select('id, title, message, target_audience, created_at')
    .order('created_at', { ascending: false })

  const audiences = ['all_students']
  if (profile.internship_status === 'preparing' || profile.internship_status === 'searching') {
    audiences.push('unplaced_students')
  }

  broadcastQuery = broadcastQuery.in('target_audience', audiences)

  if (since) {
    broadcastQuery = broadcastQuery.gte('created_at', since)
  }

  const [logbookResult, broadcastsResult] = await Promise.all([logbookQuery, broadcastQuery])

  const errors = [logbookResult.error, broadcastsResult.error].filter(Boolean)
  if (errors.length > 0) {
    throw createError({ statusCode: 500, statusMessage: errors[0]?.message || 'Sync failed.' })
  }

  return {
    ok: true,
    serverTime: new Date().toISOString(),
    syncCursor: new Date().toISOString(),
    data: {
      profile: {
        internship_status: profile.internship_status
      },
      logbookCompliance: logbookResult.data || [],
      broadcasts: broadcastsResult.data || []
    }
  }
})