import { serverSupabaseServiceRole, serverSupabaseUser } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'
import type { H3Event } from 'h3'
import { createError } from 'h3'
import { parseSuperCoordinatorEmails } from './super-coordinator'

export const requireActor = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: actor, error } = await serverSupabaseServiceRole<Database>(event)
    .from('users')
    .select('role')
    .eq('id', user.id!)
    .single()

  if (error || !actor || !['coordinator', 'student'].includes(actor.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return { ...user, role: actor.role }
}

export const requireCoordinator = async (event: H3Event) => {
  const actor = await requireActor(event)
  if (actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Coordinator access required' })
  }
  return actor
}

export const isSuperCoordinator = (event: H3Event, actor: { role: string; email?: string }) => {
  return actor.role === 'coordinator' && parseSuperCoordinatorEmails(useRuntimeConfig(event).superCoordinatorEmails)
    .includes(actor.email?.trim().toLowerCase() || '')
}

export const requireSuperCoordinator = async (event: H3Event) => {
  const actor = await requireCoordinator(event)
  if (!isSuperCoordinator(event, actor)) {
    throw createError({ statusCode: 403, statusMessage: 'Super coordinator access required' })
  }
  return actor
}

export const requireStudentTarget = async (event: H3Event, id: string) => {
  const { data, error } = await serverSupabaseServiceRole<Database>(event)
    .from('users').select('id, role').eq('id', id).maybeSingle()
  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to verify student' })
  }
  if (!data || data.role !== 'student') {
    throw createError({ statusCode: 404, statusMessage: 'Student not found' })
  }
  return data
}
