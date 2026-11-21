import type { Database } from '~/types/supabase'
import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { positiveId } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requireSuperCoordinator(event)

  const semesterId = positiveId(getRouterParam(event, 'id'), 'semester ID')
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
    Object.keys(body).length !== 1 || typeof body.registration_open !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'registration_open must be a boolean' })
  }

  const { data, error } = await serverSupabaseServiceRole<Database>(event)
    .from('semesters')
    .update({ registration_open: body.registration_open })
    .eq('id', semesterId)
    .select('id, registration_open')
    .maybeSingle()

  if (error) {
    console.error('[Semester Registration Error]:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update semester registration' })
  }
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Semester not found' })
  return data
})
