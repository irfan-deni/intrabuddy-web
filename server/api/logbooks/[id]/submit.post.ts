import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Missing logbook entry ID' })
    }

    const { error: updateError } = await supabase
      .from('weekly_logbook_tracking')
      .update({
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(id))

    if (updateError) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to mark logbook as submitted' })
    }

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Override failed' })
  }
})
