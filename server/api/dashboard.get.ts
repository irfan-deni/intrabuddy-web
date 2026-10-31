import { serverSupabaseClient, serverSupabaseUser } from '~~/server/utils/supabase-server'
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
    return data as unknown as DashboardResponse
  } catch (error: any) {
    console.error('[Dashboard Exception]:', error.message)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to load dashboard data' })
  }
})
