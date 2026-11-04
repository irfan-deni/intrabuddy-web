import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)
    const supabase = await serverSupabaseClient<Database>(event)
    const query = getQuery(event)

    const { data: semesters, error: semestersError } = await supabase
      .from('semesters')
      .select('id, name, is_active, start_date')
      .order('start_date', { ascending: false })

    if (semestersError) throw semestersError

    const requestedSemesterId = query.semester_id ? positiveId(query.semester_id, 'semester ID') : null
    const semester = requestedSemesterId
      ? semesters?.find(item => item.id === requestedSemesterId)
      : semesters?.find(item => item.is_active)

    if (requestedSemesterId && !semester) {
      throw createError({ statusCode: 404, statusMessage: 'Semester not found' })
    }

    if (!semester) {
      return { semesterId: null, templates: [], semesters: semesters || [] }
    }

    const { data: templates, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('semester_id', semester.id)
      .order('display_order', { ascending: true })

    if (error) throw error
    return { semesterId: semester.id, templates: templates || [], semesters: semesters || [] }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Checklists API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch checklist templates' })
  }
})
