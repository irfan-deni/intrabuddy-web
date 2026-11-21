import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

export const logbookReviewQueue = (db: SupabaseClient<Database>, semesterId: number, countOnly = false) =>
  db.from('weekly_logbook_tracking')
    .select('id, week_number, week_end_date, is_submitted, submitted_at, reminder_sent, student_id, users:student_id!inner(full_name, student_id), review:logbook_reviews()',
      countOnly ? { count: 'exact', head: true } : undefined)
    .eq('semester_id', semesterId)
    .eq('users.role', 'student')
    .eq('is_submitted', true)
    .is('review', null)
