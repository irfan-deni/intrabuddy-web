import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  await requireSuperCoordinator(event)
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const studentId = getRouterParam(event, 'id')
  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: 'Student ID is required' })
  }
  await requireStudentTarget(event, studentId)

  // Delete related records first to avoid FK constraint violations
  await serviceRole.from('student_semesters').delete().eq('student_id', studentId)
  await serviceRole.from('notifications').delete().eq('recipient_id', studentId)
  await serviceRole.from('job_applications').delete().eq('student_id', studentId)

  // Delete from public.users
  const { error: deleteError } = await serviceRole
    .from('users')
    .delete()
    .eq('id', studentId)
    .eq('role', 'student')

  if (deleteError) {
    throw createError({ statusCode: 500, statusMessage: `Failed to delete student: ${deleteError.message}` })
  }

  // Attempt to delete from auth.users
  const { error: authError } = await serviceRole.auth.admin.deleteUser(studentId)
  if (authError) {
    console.error('[Student Delete] Failed to delete auth user:', authError.message)
  }

  return { success: true }
})
