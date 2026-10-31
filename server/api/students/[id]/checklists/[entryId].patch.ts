import { assertManagementFields, managementReason, mutateStudentRecord, resolveManagementSemester } from '~~/server/utils/student-management'

export default defineEventHandler(async (event) => {
  const actor = await requireSuperCoordinator(event)
  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Student ID is required' })
  const entryId = positiveId(getRouterParam(event, 'entryId'), 'checklist ID')
  const body = await readBody<{ is_completed: boolean; reason: string; semester_id?: number }>(event)
  assertManagementFields(body, ['is_completed', 'reason', 'semester_id'])
  if (!body || typeof body.is_completed !== 'boolean' || typeof body.reason !== 'string' ||
    !body.reason.trim() || body.reason.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'Completion state and override reason are required' })
  }
  const semesterId = await resolveManagementSemester(event, body.semester_id)
  await requireStudentTarget(event, studentId)
  return mutateStudentRecord(event, actor, studentId, semesterId, 'checklist', { is_completed: body.is_completed, reason: managementReason(body.reason) }, entryId)
})
