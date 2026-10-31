import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)

    const supabase = await serverSupabaseClient<Database>(event)
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, student_id')
      .eq('role', 'student')
      .order('full_name')

    if (error) throw error
    return data || []
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Student Lookup API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch student lookup' })
  }
})
