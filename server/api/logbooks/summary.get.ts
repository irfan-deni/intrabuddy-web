import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  await requireCoordinator(event)
  try {
    const supabase = serverSupabaseClient<Database>(event)
    const { data: semester, error } = await supabase.from('semesters')
      .select('id').eq('is_active', true).maybeSingle()
    if (error) throw error
    if (!semester) return { total: 0, submitted: 0, late: 0, pending: 0 }

    // HEAD/count queries keep individual logbook rows out of both network hops.
    const countQuery = () => supabase.from('weekly_logbook_tracking')
      .select('id, users:student_id!inner(role)', { count: 'exact', head: true })
      .eq('semester_id', semester.id).eq('users.role', 'student')
    const today = new Date().toISOString().slice(0, 10)
    const [all, submitted, late] = await Promise.all([
      countQuery(),
      countQuery().eq('is_submitted', true),
      countQuery().not('is_submitted', 'is', true).lt('week_end_date', today)
    ])
    for (const result of [all, submitted, late]) {
      if (result.error) throw result.error
      if (result.count === null) throw new Error('Missing logbook count')
    }
    const total = all.count!
    return { total, submitted: submitted.count!, late: late.count!, pending: Math.max(0, total - submitted.count! - late.count!) }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to load logbook summary' })
  }
})
