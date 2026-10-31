import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireSuperCoordinator(event)

    const supabase = await serverSupabaseClient<Database>(event)
    const id = positiveId(getRouterParam(event, 'id'), 'logbook ID')

    const { data, error: updateError } = await supabase
      .from('weekly_logbook_tracking')
      .update({
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id')

    if (updateError) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to mark logbook as submitted' })
    }
    if (!data?.length) {
      throw createError({ statusCode: 404, statusMessage: 'Logbook not found' })
    }

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Override failed' })
  }
})
