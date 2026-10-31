import type { Database, Json } from '~/types/supabase'
import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { assertManagementFields, managementError } from '~~/server/utils/student-management'

export default defineEventHandler(async (event) => {
  await requireSuperCoordinator(event)
  const body = await readBody(event)
  assertManagementFields(body, ['action', 'payload'])
  const fields: Record<string, string[]> = {
    'semester.save': ['id', 'name', 'start_date', 'end_date'], 'semester.activate': ['id'], 'semester.delete': ['id'],
    'template.save': ['id', 'title', 'description', 'required', 'display_order', 'semester_id'],
    'template.delete': ['id'], 'template.import': ['semester_id'], 'template.reorder': ['semester_id', 'ids']
  }
  if (typeof body.action !== 'string' || !Object.hasOwn(fields, body.action)) throw createError({ statusCode: 400, statusMessage: 'Invalid configuration action' })
  assertManagementFields(body.payload, fields[body.action]!)
  if (JSON.stringify(body.payload).length > 100000) throw createError({ statusCode: 400, statusMessage: 'Configuration payload too large' })
  const { data, error } = await serverSupabaseServiceRole<Database>(event).rpc('manage_portal_configuration', { p_action: body.action, p_payload: body.payload as Json })
  if (error) throw managementError(error)
  return data
})
