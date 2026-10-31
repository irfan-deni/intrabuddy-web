import { serverSupabaseClient } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    await requireCoordinator(event)
    const supabase = await serverSupabaseClient<Database>(event)
    const { data: semester, error: semesterError } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (semesterError) throw semesterError
    if (!semester) return { semesterId: null, templates: [] }

    const { data: templates, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('semester_id', semester.id)
      .order('display_order', { ascending: true })

    if (error) throw error
    return { semesterId: semester.id, templates: templates || [] }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Checklists API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch checklist templates' })
  }
})
