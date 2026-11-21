import type { Database } from '~/types/supabase'
import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { getSemesterCounts, getSemesterDeletionRule } from '~~/server/utils/semester-management'

export default defineEventHandler(async (event) => {
  await requireCoordinator(event)

  try {
    const db = serverSupabaseServiceRole<Database>(event)
    const { data: semesters, error } = await db
      .from('semesters')
      .select('id, name, start_date, end_date, is_active, registration_open, created_at')
      .order('start_date', { ascending: false })

    if (error) throw error

    const overview = await Promise.all((semesters || []).map(async semester => {
      const counts = await getSemesterCounts(db, semester.id)
      return {
        ...semester,
        counts,
        deletion: getSemesterDeletionRule(semester, counts)
      }
    }))

    return { semesters: overview }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Semesters API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load semesters' })
  }
})
