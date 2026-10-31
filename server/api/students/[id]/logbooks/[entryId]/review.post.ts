import { assertManagementFields, managementReason, mutateStudentRecord, resolveManagementSemester } from '~~/server/utils/student-management'

export default defineEventHandler(async (event) => {
  const actor = await requireSuperCoordinator(event)
  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Student ID required' })
  const entryId = positiveId(getRouterParam(event, 'entryId'), 'logbook ID')
  const body = await readBody(event)
  assertManagementFields(body, ['status', 'reason', 'semester_id'])
  if (!['reviewed', 'corrections_requested'].includes(body.status)) throw createError({ statusCode: 400, statusMessage: 'Invalid review state' })
  const semesterId = await resolveManagementSemester(event, body.semester_id)
  await requireStudentTarget(event, studentId)
  return mutateStudentRecord(event, actor, studentId, semesterId, 'review', { status: body.status, reason: managementReason(body.reason) }, entryId)
})
