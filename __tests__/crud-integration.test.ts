import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../app/types/supabase'

const supabaseUrl = process.env.SUPABASE_URL || 'https://yyqoleelprtldlvvizdk.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_KEY!

// Service role client bypasses RLS for admin operations
const admin = createClient<Database>(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Anon client (simulates what the app uses)
const anon = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

describe('Supabase CRUD Integration', () => {
  let testCohortId: number | null = null
  let testStudentUserId: string | null = null
  let testBroadcastId: number | null = null
  let testNotificationId: number | null = null

  // ── READ ──────────────────────────────────────

  it('should read cohorts', async () => {
    const { data, error } = await admin.from('cohorts').select('*')
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(Array)
    expect(data!.length).toBeGreaterThanOrEqual(1)
    testCohortId = data![0].id
  })

  it('should read users (students and coordinators)', async () => {
    const { data, error } = await admin.from('users').select('*')
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(Array)
  })

  it('should read active cohort', async () => {
    const { data, error } = await admin.from('cohorts').select('*').eq('is_active', true).maybeSingle()
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.is_active).toBe(true)
  })

  // ── CREATE ────────────────────────────────────

  it('should create a cohort', async () => {
    const { data, error } = await admin.from('cohorts').insert({
      name: `TEST Cohort ${Date.now()}`,
      start_date: '2026-01-01',
      end_date: '2026-06-30',
      is_active: false
    }).select('id').single()
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    testCohortId = data!.id
  })

  it('should create a student user (via auth + public.users)', async () => {
    // Must create auth user first due to FK constraint users.id -> auth.users
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: `test-student-${Date.now()}@test.com`,
      password: 'Test123456!',
      email_confirm: true,
      user_metadata: { full_name: 'Test Student' }
    })
    expect(authError).toBeNull()
    expect(authData?.user?.id).toBeDefined()
    const authId = authData!.user!.id!

    const { data, error } = await admin.from('users').upsert({
      id: authId,
      role: 'student',
      full_name: 'Test Student',
      student_id: `TS${Date.now()}`
    }).select('id').single()
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    testStudentUserId = data!.id
  })

  it('should enroll student in cohort', async () => {
    expect(testStudentUserId).not.toBeNull()
    expect(testCohortId).not.toBeNull()
    const { error } = await admin.from('student_cohorts').insert({
      student_id: testStudentUserId!,
      cohort_id: testCohortId!
    })
    expect(error).toBeNull()
  })

  it('should create a broadcast message', async () => {
    const { data, error } = await admin.from('broadcast_messages').insert({
      coordinator_id: testStudentUserId!,
      title: 'Test Broadcast',
      body: 'This is a test broadcast',
      target_roles: ['student'],
      sent_at: new Date().toISOString()
    }).select('id').single()
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    testBroadcastId = data!.id
  })

  it('should create a notification', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { data, error } = await admin.from('notifications').insert({
      recipient_id: testStudentUserId!,
      title: 'Test Notification',
      body: 'This is a test notification',
      type: 'manual_alert'
    }).select('id').single()
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    testNotificationId = data!.id
  })

  it('should create job application', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { error } = await admin.from('job_applications').insert({
      student_id: testStudentUserId!,
      company_name: 'Test Corp',
      position: 'Intern',
      status: 'Pending',
      application_date: new Date().toISOString().split('T')[0]
    })
    expect(error).toBeNull()
  })

  it('should initialize checklist items', async () => {
    expect(testStudentUserId).not.toBeNull()
    expect(testCohortId).not.toBeNull()
    // First create a template
    const { data: tpl } = await admin.from('checklist_templates').insert({
      title: 'Test Checklist Item',
      cohort_id: testCohortId!,
      required: true,
      display_order: 1
    }).select('id').single()
    expect(tpl).not.toBeNull()

    const { error } = await admin.from('student_checklists').insert({
      student_id: testStudentUserId!,
      checklist_item_id: tpl!.id,
      is_completed: false
    })
    expect(error).toBeNull()
  })

  // ── UPDATE ────────────────────────────────────

  it('should update student profile', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { error } = await admin.from('users').update({
      full_name: 'Updated Test Student'
    }).eq('id', testStudentUserId!)
    expect(error).toBeNull()

    const { data } = await admin.from('users').select('full_name').eq('id', testStudentUserId!).single()
    expect(data!.full_name).toBe('Updated Test Student')
  })

  it('should mark checklist item as completed', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { data: items } = await admin.from('student_checklists').select('id').eq('student_id', testStudentUserId!).limit(1)
    if (items && items.length > 0) {
      const { error } = await admin.from('student_checklists').update({
        is_completed: true,
        completed_at: new Date().toISOString()
      }).eq('id', items[0].id)
      expect(error).toBeNull()
    }
  })

  it('should mark logbook as submitted', async () => {
    // Check if any logbook entries exist; create one if not
    expect(testStudentUserId).not.toBeNull()
    expect(testCohortId).not.toBeNull()
    const { data: existing } = await admin.from('weekly_logbook_tracking').select('id').eq('student_id', testStudentUserId!).limit(1)
    if (existing && existing.length > 0) {
      const { error } = await admin.from('weekly_logbook_tracking').update({
        is_submitted: true,
        submitted_at: new Date().toISOString()
      }).eq('id', existing[0].id)
      expect(error).toBeNull()
    } else {
      const { data: entry } = await admin.from('weekly_logbook_tracking').insert({
        student_id: testStudentUserId!,
        cohort_id: testCohortId!,
        week_number: 1,
        week_end_date: '2026-01-12',
        is_submitted: true,
        submitted_at: new Date().toISOString()
      }).select('id').single()
      expect(entry).not.toBeNull()
    }
  })

  it('should mark notification as read', async () => {
    expect(testNotificationId).not.toBeNull()
    const { error } = await admin.from('notifications').update({
      is_read: true
    }).eq('id', testNotificationId!)
    expect(error).toBeNull()
  })

  // ── DELETE ────────────────────────────────────

  it('should delete job applications', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { error } = await admin.from('job_applications').delete().eq('student_id', testStudentUserId!)
    expect(error).toBeNull()
  })

  it('should delete broadcast message', async () => {
    expect(testBroadcastId).not.toBeNull()
    const { error } = await admin.from('broadcast_messages').delete().eq('id', testBroadcastId!)
    expect(error).toBeNull()
  })

  it('should delete notification', async () => {
    expect(testNotificationId).not.toBeNull()
    const { error } = await admin.from('notifications').delete().eq('id', testNotificationId!)
    expect(error).toBeNull()
  })

  it('should delete student cohort enrollment', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { error } = await admin.from('student_cohorts').delete().eq('student_id', testStudentUserId!)
    expect(error).toBeNull()
  })

  it('should delete student checklists', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { error } = await admin.from('student_checklists').delete().eq('student_id', testStudentUserId!)
    expect(error).toBeNull()
  })

  it('should delete weekly logbook entries', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { error } = await admin.from('weekly_logbook_tracking').delete().eq('student_id', testStudentUserId!)
    expect(error).toBeNull()
  })

  it('should delete the student user (public.users + auth.users)', async () => {
    expect(testStudentUserId).not.toBeNull()
    const { error: dbError } = await admin.from('users').delete().eq('id', testStudentUserId!)
    expect(dbError).toBeNull()
    const { error: authError } = await admin.auth.admin.deleteUser(testStudentUserId!)
    expect(authError).toBeNull()
  })

  it('should delete the test cohort', async () => {
    if (testCohortId) {
      // Clean up any checklist templates tied to this cohort
      await admin.from('checklist_templates').delete().eq('cohort_id', testCohortId)
      const { error } = await admin.from('cohorts').delete().eq('id', testCohortId)
      expect(error).toBeNull()
    }
  })

  // ── RLS / Auth ────────────────────────────────

  it('should reject unauthenticated anon write to users', async () => {
    const { error } = await anon.from('users').insert({
      role: 'student',
      full_name: 'Should Fail'
    })
    // RLS should block this — anon client cannot insert into users
    expect(error).not.toBeNull()
  })
})
