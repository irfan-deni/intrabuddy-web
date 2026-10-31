import type { Database } from '~/types/supabase'
import type { StudentManagement } from '~/types/student-management'
import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { managementError } from '~~/server/utils/student-management'

export default defineEventHandler(async (event): Promise<StudentManagement> => {
  const actor = await requireCoordinator(event)
  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Student ID required' })
  await requireStudentTarget(event, studentId)
  const db = serverSupabaseServiceRole<Database>(event)
  const { data: semesters, error } = await db.from('semesters').select('id, name, is_active').order('start_date', { ascending: false })
  if (error) throw managementError(error)
  const query = getQuery(event)
  const semesterId = query.semester_id ? positiveId(query.semester_id, 'semester ID') : semesters?.find(s => s.is_active)?.id ?? null
  const superAccess = isSuperCoordinator(event, actor)
  if (semesterId && !semesters?.some(s => s.id === semesterId)) throw createError({ statusCode: 404, statusMessage: 'Semester not found' })
  const [logbooks, profile] = await Promise.all([
    semesterId ? db.from('weekly_logbook_tracking').select('id, week_number, week_end_date, is_submitted').eq('student_id', studentId).eq('semester_id', semesterId).order('week_number') : { data: [], error: null },
    db.from('users').select('phone_number').eq('id', studentId).single()
  ])
  for (const result of [logbooks, profile]) if (result.error) throw managementError(result.error)
  const ids = logbooks.data?.map(l => l.id) || []
  const [reviews, history] = await Promise.all([
    ids.length ? db.from('logbook_reviews').select('logbook_id, status, feedback, reviewed_at').in('logbook_id', ids) : { data: [], error: null },
    superAccess && semesterId ? db.from('student_management_audit').select('id, actor_id, action, target_id, reason, before_value, after_value, created_at')
      .eq('student_id', studentId).eq('semester_id', semesterId!).order('id', { ascending: false }).limit(100) : { data: [], error: null }
  ])
  if (reviews.error || history.error) throw managementError(reviews.error || history.error!)
  return {
    semesterId, semesters: semesters || [],
    capabilities: { editContact: superAccess && !!semesterId,
      correctRecords: superAccess && !!semesterId, reviewLogbooks: superAccess && !!semesterId },
    phoneNumber: profile.data?.phone_number || null, logbooks: logbooks.data || [],
    reviews: reviews.data || [], history: history.data || []
  }
})
