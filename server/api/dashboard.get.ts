import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '~~/server/utils/supabase-server'
import { isSuperCoordinator } from '~~/server/utils/auth-role'
import { logbookReviewQueue } from '~~/server/utils/logbook-review-queue'
import type { Database } from '~/types/supabase'
import type { DashboardResponse } from '~/types/dashboard'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const supabase = serverSupabaseClient<Database>(event)
    // The RPC checks the caller's live coordinator role before aggregating.
    // No separate service-role profile lookup is needed for this endpoint.
    const { data, error } = await supabase.rpc('get_coordinator_dashboard')
    if (error?.code === '42501') {
      throw createError({ statusCode: 403, statusMessage: 'Coordinator access required' })
    }
    if (error) throw error
    if (!data) throw new Error('Missing dashboard summary')
    const dashboard = data as unknown as DashboardResponse
    if (dashboard.semester === undefined) throw new Error('Dashboard overview migration is not applied')
    // The RPC has already verified the user's live coordinator role. Review
    // data is queried separately so its student-only RLS policy stays intact.
    if (dashboard.semester && isSuperCoordinator(event, { ...user, role: 'coordinator' })) {
      try {
        const { count, error } = await logbookReviewQueue(serverSupabaseServiceRole<Database>(event), dashboard.semester.id, true)
        if (error) throw error
        return { ...dashboard, reviewQueue: { count } }
      } catch (error) {
        console.error('[Dashboard review queue]', error)
        return { ...dashboard, reviewQueue: { count: null } }
      }
    }
    return dashboard
  } catch (error: any) {
    console.error('[Dashboard Exception]:', error.message)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to load dashboard data' })
  }
})
