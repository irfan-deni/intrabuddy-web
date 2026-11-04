import type { Database, Json } from '~/types/supabase'
import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { assertManagementFields, managementError } from '~~/server/utils/student-management'
import { getSemesterCounts, getSemesterDeletionRule, type SemesterCounts } from '~~/server/utils/semester-management'
import { positiveId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requireSuperCoordinator(event)
  const body = await readBody(event)
  assertManagementFields(body, ['action', 'payload'])
  const fields: Record<string, string[]> = {
    'semester.save': ['id', 'name', 'start_date', 'end_date'], 'semester.activate': ['id'], 'semester.delete': ['id'],
    'template.save': ['id', 'title', 'description', 'required', 'display_order', 'phase', 'due_date', 'semester_id'],
    'template.delete': ['id'], 'template.import': ['semester_id'], 'template.reorder': ['semester_id', 'ids']
  }
  if (typeof body.action !== 'string' || !Object.hasOwn(fields, body.action)) throw createError({ statusCode: 400, statusMessage: 'Invalid configuration action' })
  assertManagementFields(body.payload, fields[body.action]!)
  if (JSON.stringify(body.payload).length > 100000) throw createError({ statusCode: 400, statusMessage: 'Configuration payload too large' })

  const db = serverSupabaseServiceRole<Database>(event)

  if (body.action === 'semester.delete') {
    const semesterId = positiveId(body.payload.id, 'semester ID')
    const { data: semester, error } = await db
      .from('semesters')
      .select('id, name, is_active')
      .eq('id', semesterId)
      .maybeSingle()

    if (error) throw managementError(error)
    if (!semester) throw createError({ statusCode: 404, statusMessage: 'Semester not found' })

    let counts: SemesterCounts
    try {
      counts = await getSemesterCounts(db, semesterId)
    } catch (error: any) {
      throw managementError(error)
    }

    const rule = getSemesterDeletionRule(semester, counts)
    if (!rule.allowed) {
      throw createError({ statusCode: 409, statusMessage: rule.message || 'Semester cannot be deleted' })
    }
  }

  const { data, error } = await db.rpc('manage_portal_configuration', { p_action: body.action, p_payload: body.payload as Json })
  if (error) throw managementError(error)
  return data
})

