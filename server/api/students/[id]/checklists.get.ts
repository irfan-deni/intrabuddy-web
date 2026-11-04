import type { Database } from '~/types/supabase'
import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { isSuperCoordinator } from '~~/server/utils/auth-role'
import { managementError, resolveManagementSemester } from '~~/server/utils/student-management'

export default defineEventHandler(async (event) => {
  const actor = await requireCoordinator(event)
  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Student ID required' })
  await requireStudentTarget(event, studentId)

  const db = serverSupabaseServiceRole<Database>(event)
  const query = getQuery(event)
  const semesterId = await resolveManagementSemester(event, query.semester_id)

  const [semesterResult, studentResult, templatesResult] = await Promise.all([
    db.from('semesters').select('id, name, is_active').eq('id', semesterId).maybeSingle(),
    db.from('users').select('id, full_name, student_id, email').eq('id', studentId).maybeSingle(),
    db.from('checklist_templates').select('*').eq('semester_id', semesterId).order('display_order', { ascending: true })
  ])

  const error = semesterResult.error || studentResult.error || templatesResult.error
  if (error) throw managementError(error)
  if (!semesterResult.data) throw createError({ statusCode: 404, statusMessage: 'Semester not found' })
  if (!studentResult.data) throw createError({ statusCode: 404, statusMessage: 'Student not found' })

  const templates = templatesResult.data || []
  const templateIds = templates.map(template => template.id)

  const entriesResult = templateIds.length
    ? await db.from('student_checklists')
      .select('id, checklist_item_id, is_completed, completed_at, due_date, override_reason, updated_by_admin')
      .eq('student_id', studentId)
      .in('checklist_item_id', templateIds)
    : { data: [], error: null }

  if (entriesResult.error) throw managementError(entriesResult.error)

  const entries = new Map((entriesResult.data || []).map(entry => [entry.checklist_item_id, entry]))

  return {
    semesterId,
    semester: semesterResult.data,
    student: studentResult.data,
    capabilities: { correctRecords: isSuperCoordinator(event, actor) },
    items: templates.map(template => {
      const entry = entries.get(template.id)
      return {
        entryId: entry?.id ?? null,
        templateId: template.id,
        title: template.title,
        description: template.description,
        required: template.required ?? false,
        displayOrder: template.display_order,
        phase: template.phase,
        dueDate: entry?.due_date ?? template.due_date,
        isCompleted: entry?.is_completed ?? false,
        completedAt: entry?.completed_at ?? null,
        overrideReason: entry?.override_reason ?? null,
        hasEntry: !!entry
      }
    })
  }
})
