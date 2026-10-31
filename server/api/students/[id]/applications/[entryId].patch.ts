import { assertManagementFields, managementReason, mutateStudentRecord, resolveManagementSemester } from '~~/server/utils/student-management'

export default defineEventHandler(async (event) => {
  const actor = await requireSuperCoordinator(event)
  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Student ID is required' })
  const entryId = positiveId(getRouterParam(event, 'entryId'), 'application ID')
  const body = await readBody<{ status: string; reason: string; semester_id?: number }>(event)
  assertManagementFields(body, ['status', 'reason', 'semester_id'])
  if (!body || !['Pending', 'Interview', 'Accepted', 'Rejected', 'Offer Declined'].includes(body.status) ||
    typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'Valid status and override reason are required' })
  }
  const semesterId = await resolveManagementSemester(event, body.semester_id)
  await requireStudentTarget(event, studentId)
  return mutateStudentRecord(event, actor, studentId, semesterId, 'application', { status: body.status, reason: managementReason(body.reason) }, entryId)
})
