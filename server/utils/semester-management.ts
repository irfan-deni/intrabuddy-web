import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

type SemesterDb = SupabaseClient<Database>
type SemesterRecord = Pick<Database['public']['Tables']['semesters']['Row'], 'id' | 'name' | 'is_active'>

export type SemesterCounts = {
  students: number
  templates: number
  logbooks: number
  applications: number
  audits: number
}

export type SemesterDeletionRule = {
  allowed: boolean
  message: string | null
}

const countFor = async (
  db: SemesterDb,
  table: 'student_semesters' | 'checklist_templates' | 'weekly_logbook_tracking' | 'job_applications' | 'student_management_audit',
  semesterId: number
) => {
  const { count, error } = await db
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('semester_id', semesterId)

  if (error) throw error
  return count || 0
}

export const getSemesterCounts = async (db: SemesterDb, semesterId: number): Promise<SemesterCounts> => {
  const [students, templates, logbooks, applications, audits] = await Promise.all([
    countFor(db, 'student_semesters', semesterId),
    countFor(db, 'checklist_templates', semesterId),
    countFor(db, 'weekly_logbook_tracking', semesterId),
    countFor(db, 'job_applications', semesterId),
    countFor(db, 'student_management_audit', semesterId)
  ])

  return { students, templates, logbooks, applications, audits }
}

const listSentence = (items: string[]) => {
  if (items.length <= 1) return items[0] || ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`

export const getSemesterDeletionRule = (semester: SemesterRecord, counts: SemesterCounts): SemesterDeletionRule => {
  if (semester.is_active) {
    return { allowed: false, message: 'Active semester cannot be deleted. Activate another semester first.' }
  }

  const history = [
    counts.students ? plural(counts.students, 'student') : '',
    counts.logbooks ? plural(counts.logbooks, 'logbook entry', 'logbook entries') : '',
    counts.applications ? plural(counts.applications, 'application') : ''
  ].filter(Boolean)

  if (history.length) {
    return {
      allowed: false,
      message: `This semester has ${listSentence(history)}. Set it inactive to preserve its history.`
    }
  }

  if (counts.audits) {
    return {
      allowed: false,
      message: 'This semester has historical management records. Set it inactive to preserve its history.'
    }
  }

  return { allowed: true, message: null }
}
