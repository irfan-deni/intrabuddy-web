import { assertManagementFields, managementReason, mutateStudentRecord, resolveManagementSemester } from '~~/server/utils/student-management'

export default defineEventHandler(async (event) => {
  const actor = await requireSuperCoordinator(event)

  const studentId = getRouterParam(event, 'id')
  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: 'Student ID is required' })
  }
  const body = await readBody(event)
  const fields = ['full_name', 'student_id', 'email', 'phone_number']
  assertManagementFields(body, [...fields, 'reason', 'semester_id'])
  const semesterId = await resolveManagementSemester(event, body.semester_id)
  await requireStudentTarget(event, studentId)
  const payload: Record<string, string | null> = { reason: managementReason(body.reason) }
  for (const field of fields) {
    if (!(field in body)) continue
    if (body[field] !== null && (typeof body[field] !== 'string' || body[field].length > (field === 'phone_number' ? 50 : 200))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid profile field' })
    }
    payload[field] = body[field]
  }
  if (Object.keys(payload).length === 1) throw createError({ statusCode: 400, statusMessage: 'No profile fields supplied' })
  return mutateStudentRecord(event, actor, studentId, semesterId, 'profile', payload)
})
