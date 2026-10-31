import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { Database, Json } from '~/types/supabase'
import { serverSupabaseServiceRole } from './supabase-server'
import { isSuperCoordinator } from './auth-role'
import { positiveId } from './validation'

export const managementError = (error: { code?: string }) => {
  const statusCode = error.code === '42501' ? 403 : error.code === 'P0002' ? 404
    : ['22023', '22007', '22008', '22P02', '23502', '23503', '23514'].includes(error.code || '') ? 400 : 500
  return createError({ statusCode, statusMessage: statusCode === 403 ? 'You cannot manage this student or record in this semester'
    : statusCode === 404 ? 'Student, semester, or record not found'
      : statusCode === 400 ? 'Invalid management request' : 'Student management failed; no changes were saved' })
}

export const resolveManagementSemester = async (event: H3Event, value?: unknown) => {
  if (value !== undefined && value !== null && value !== '') return positiveId(value, 'semester ID')
  const { data, error } = await serverSupabaseServiceRole<Database>(event).from('semesters').select('id').eq('is_active', true).maybeSingle()
  if (error) throw managementError(error)
  if (!data) throw createError({ statusCode: 400, statusMessage: 'Select a semester first' })
  return data.id
}

export const managementReason = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'A reason of 1–2000 characters is required' })
  }
  return value.trim()
}

export const assertManagementFields = (body: unknown, fields: string[]) => {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !fields.includes(key))) {
    throw createError({ statusCode: 400, statusMessage: 'Unexpected management fields' })
  }
}

export const mutateStudentRecord = async (event: H3Event, actor: { id: string; role: string; email?: string }, studentId: string,
  semesterId: number, action: string, payload: Json, entryId?: number) => {
  // The service-only RPC checks super coordinator access again before writing.
  const { data, error } = await serverSupabaseServiceRole<Database>(event).rpc('manage_student_record', {
    p_actor_id: actor.id, p_super: isSuperCoordinator(event, actor), p_student_id: studentId,
    p_semester_id: semesterId, p_action: action, p_payload: payload, ...(entryId === undefined ? {} : { p_entry_id: entryId })
  })
  if (error) throw managementError(error)
  return data
}
