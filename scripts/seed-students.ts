import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../app/types/supabase'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')

function loadEnv() {
  const content = readFileSync(envPath, 'utf-8')
  const vars: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

const env = loadEnv()
const supabaseUrl = env.SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const now = new Date().toISOString()
const DEFAULT_PASSWORD = 'Test123!'

// 11-digit UNIKL matric numbers
const STUDENTS = [
  { full_name: 'Ahmad bin Ismail', student_id: '52213224401', email: 'ahmad.ismail@example.com', phone_number: '012-3456789' },
  { full_name: 'Nurul Farhana bt Salleh', student_id: '52213224402', email: 'nurul.farhana@example.com', phone_number: '012-3456790' },
  { full_name: 'Muhammad Faiz bin Razak', student_id: '52213224403', email: 'faiz.razak@example.com', phone_number: '012-3456791' },
  { full_name: 'Siti Aisyah bt Abdullah', student_id: '52213224404', email: 'aisyah.abdullah@example.com', phone_number: '012-3456792' },
  { full_name: 'Lim Wei Jie', student_id: '52213224405', email: 'weijie.lim@example.com', phone_number: '012-3456793' },
  { full_name: 'Priya a/p Rajendran', student_id: '52213224406', email: 'priya.rajendran@example.com', phone_number: '012-3456794' },
  { full_name: 'Mohammad Khairul bin Azman', student_id: '52213224407', email: 'khairul.azman@example.com', phone_number: '012-3456795' },
  { full_name: 'Tan Sze Ying', student_id: '52213224408', email: 'szying.tan@example.com', phone_number: '012-3456796' },
  { full_name: 'Amirah bt Ruslan', student_id: '52213224409', email: 'amirah.ruslan@example.com', phone_number: '012-3456797' },
  { full_name: 'Ravi a/l Muthusamy', student_id: '52213224410', email: 'ravi.muthusamy@example.com', phone_number: '012-3456798' },
  { full_name: 'Nur Aliya bt Zainal', student_id: '52213224411', email: 'aliya.zainal@example.com', phone_number: '013-1234567' },
  { full_name: 'Farid bin Hassan', student_id: '52213224412', email: 'farid.hassan@example.com', phone_number: '013-1234568' },
  { full_name: 'Chan Kah Mun', student_id: '52213224413', email: 'kahmun.chan@example.com', phone_number: '013-1234569' },
  { full_name: 'Siti Zubaidah bt Mohd Nor', student_id: '52213224414', email: 'zubaidah.nor@example.com', phone_number: '013-1234570' },
  { full_name: 'Hafizul bin Kamaruddin', student_id: '52213224415', email: 'hafizul.kamaruddin@example.com', phone_number: '013-1234571' },
  { full_name: 'Dewi Sri a/p Subramaniam', student_id: '52213224416', email: 'dewi.subra@example.com', phone_number: '013-1234572' },
  { full_name: 'Arif bin Zakaria', student_id: '52213224417', email: 'arif.zakaria@example.com', phone_number: '013-1234573' },
  { full_name: 'Nur Izzati bt Ramli', student_id: '52213224418', email: 'izzati.ramli@example.com', phone_number: '013-1234574' },
  { full_name: 'Syafiq bin Mohd Yusof', student_id: '52213224419', email: 'syafiq.yusof@example.com', phone_number: '013-1234575' },
  { full_name: 'Wong Sing Yee', student_id: '52213224420', email: 'singyee.wong@example.com', phone_number: '013-1234576' }
]

const COMPANIES = [
  { name: 'Petronas', positions: ['Software Engineer Intern', 'Data Analyst Intern', 'IT Support Intern'] },
  { name: 'Tenaga Nasional Berhad', positions: ['Engineering Intern', 'Systems Analyst Intern'] },
  { name: 'CIMB Bank', positions: ['Software Developer Intern', 'Business Analyst Intern'] },
  { name: 'AirAsia', positions: ['Full Stack Developer Intern', 'DevOps Intern'] },
  { name: 'Maxis Berhad', positions: ['Network Engineering Intern', 'Mobile Dev Intern'] },
  { name: 'Top Glove', positions: ['Automation Intern', 'Supply Chain Intern'] },
  { name: 'Grab Malaysia', positions: ['Backend Engineer Intern', 'Product Management Intern'] },
  { name: 'Dell Technologies', positions: ['Software Engineering Intern', 'Cloud Intern'] }
]

async function main() {
  console.log('=== INTRA Buddy Seed Script ===\n')

  // 1. Ensure active semester exists
  console.log('[1/5] Checking active semester...')
  let { data: activeSemester } = await supabase
    .from('semesters')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  if (!activeSemester) {
    console.log('  No active semester found. Creating one...')
    const { data: newSemester, error: semesterErr } = await supabase
      .from('semesters')
      .insert({
        name: 'Julai 2026',
        start_date: '2026-07-01',
        end_date: '2026-09-30',
        is_active: true,
        created_at: now
      })
      .select()
      .single()

    if (semesterErr) {
      console.error('  Failed to create semester:', semesterErr.message)
      process.exit(1)
    }
    activeSemester = newSemester
    console.log(`  Created semester: "${activeSemester.name}" (ID: ${activeSemester.id})`)
  } else {
    console.log(`  Found active semester: "${activeSemester.name}" (ID: ${activeSemester.id})`)
  }

  // 2. Ensure checklist templates exist for the semester
  console.log('\n[2/5] Checking checklist templates...')
  let { data: templates } = await supabase
    .from('checklist_templates')
    .select('*')
    .eq('semester_id', activeSemester.id)

  if (!templates || templates.length === 0) {
    console.log('  No templates found. Creating default templates...')
    const defaultTemplates = [
      { title: 'Upload Resume/CV', description: 'Submit your updated resume', required: true, display_order: 1, due_offset_days: 14, semester_id: activeSemester.id },
      { title: 'Company Registration', description: 'Complete company registration form', required: true, display_order: 2, due_offset_days: 21, semester_id: activeSemester.id },
      { title: 'Offer Letter Upload', description: 'Upload signed offer letter', required: true, display_order: 3, due_offset_days: 30, semester_id: activeSemester.id },
      { title: 'Insurance Form', description: 'Submit insurance coverage form', required: false, display_order: 4, due_offset_days: 14, semester_id: activeSemester.id },
      { title: 'Emergency Contact', description: 'Provide emergency contact details', required: true, display_order: 5, due_offset_days: 7, semester_id: activeSemester.id },
      { title: 'Health Declaration', description: 'Complete health declaration form', required: false, display_order: 6, due_offset_days: 14, semester_id: activeSemester.id },
      { title: 'Academic Transcript', description: 'Upload latest academic transcript', required: true, display_order: 7, due_offset_days: 21, semester_id: activeSemester.id }
    ]

    const { data: newTemplates, error: tmplErr } = await supabase
      .from('checklist_templates')
      .insert(defaultTemplates)
      .select()

    if (tmplErr) {
      console.error('  Failed to create templates:', tmplErr.message)
      process.exit(1)
    }
    templates = newTemplates
    console.log(`  Created ${templates.length} default templates`)
  } else {
    console.log(`  Found ${templates.length} existing templates`)
  }

  // 3. Create auth users + insert/update public.users
  console.log('\n[3/5] Creating auth users and student profiles...')
  const insertedStudentIds: string[] = []

  // First, find which students already exist in public.users
  const emails = STUDENTS.map(s => s.email)
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, email')
    .in('email', emails)

  const existingByEmail = new Map(existingUsers?.map(u => [u.email, u.id]) || [])

  for (const s of STUDENTS) {
    const existingId = existingByEmail.get(s.email)

    if (existingId) {
      // User exists — just update their profile
      const { error: upsertErr } = await supabase
        .from('users')
        .update({
          full_name: s.full_name,
          student_id: s.student_id,
          phone_number: s.phone_number,
          updated_at: now
        })
        .eq('id', existingId)

      if (upsertErr) {
        console.error(`  FAILED: ${s.full_name} — ${upsertErr.message}`)
      } else {
        insertedStudentIds.push(existingId)
        console.log(`  UPDATED: ${s.full_name.padEnd(30)} ${s.student_id}`)
      }
      continue
    }

    // New student — create auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: s.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: s.full_name }
    })

    if (authErr) {
      console.error(`  FAILED: ${s.full_name} — ${authErr.message}`)
      continue
    }

    if (!authUser?.user) {
      console.error(`  FAILED: ${s.full_name} — no user returned`)
      continue
    }

    const uid = authUser.user.id

    // Insert into public.users (trigger may have created a stub record)
    const { error: upsertErr } = await supabase
      .from('users')
      .upsert({
        id: uid,
        role: 'student',
        full_name: s.full_name,
        student_id: s.student_id,
        email: s.email,
        phone_number: s.phone_number,
        created_at: now,
        updated_at: now
      }, { onConflict: 'id' })

    if (upsertErr) {
      console.error(`  FAILED: ${s.full_name} — ${upsertErr.message}`)
      continue
    }

    insertedStudentIds.push(uid)
    console.log(`  NEW: ${s.full_name.padEnd(30)} ${s.student_id}  ${s.email}`)
  }

  console.log(`\n  Successfully processed ${insertedStudentIds.length}/${STUDENTS.length} students`)

  if (insertedStudentIds.length === 0) {
    console.error('No students were processed. Aborting.')
    process.exit(1)
  }

  // 4. Enroll in semester + create checklist items
  console.log('\n[4/5] Enrolling students in semester and creating checklist items...')

  const semesterEntries = insertedStudentIds.map(sid => ({
    student_id: sid,
    semester_id: activeSemester.id,
    enrolled_at: now
  }))

  const { error: enrollErr } = await supabase
    .from('student_semesters')
    .insert(semesterEntries)

  if (enrollErr) {
    // If some already enrolled, that's okay
    if (enrollErr.message.includes('duplicate') || enrollErr.message.includes('unique')) {
      console.log('  Some students already enrolled (skipped duplicates)')
    } else {
      console.error('  Semester enrollment failed:', enrollErr.message)
    }
  } else {
    console.log(`  Enrolled ${insertedStudentIds.length} students in "${activeSemester.name}"`)
  }

  // Create checklist items for all students (randomized completion)
  // First clear existing ones so we get a fresh randomized distribution
  const { error: delClErr } = await supabase
    .from('student_checklists')
    .delete()
    .in('student_id', insertedStudentIds)

  if (delClErr) {
    console.error('  Failed to clear existing checklists:', delClErr.message)
  }

  const checklistInserts = insertedStudentIds.flatMap(sid =>
    templates.map(t => ({
      student_id: sid,
      checklist_item_id: t.id,
      is_completed: Math.random() > 0.4,  // ~60% completion rate
      completed_at: Math.random() > 0.4 ? now : null,
      due_date: new Date(Date.now() + (t.due_offset_days || 14) * 86400000).toISOString()
    }))
  )

  let insertedChecklists = 0
  if (checklistInserts.length > 0) {
    const batchSize = 50
    for (let i = 0; i < checklistInserts.length; i += batchSize) {
      const batch = checklistInserts.slice(i, i + batchSize)
      const { error: clErr } = await supabase
        .from('student_checklists')
        .insert(batch)
      if (clErr) {
        console.error(`  Checklist batch ${i / batchSize} failed:`, clErr.message)
      } else {
        insertedChecklists += batch.length
      }
    }
  }
  console.log(`  Created ${insertedChecklists} checklist items (~60% completion rate)`)

  // 5. Create job applications with varied placement statuses
  console.log('\n[5/6] Creating job applications with varied placement statuses...')

  // Check if 'Accepted' is a valid enum value
  const probeSid = insertedStudentIds[0]
  const { error: probeErr } = await supabase
    .from('job_applications')
    .insert({
      student_id: probeSid,
      company_name: '__PROBE__',
      position: '__PROBE__',
      status: 'Accepted'
    })

  const acceptedAvailable = !probeErr
  if (probeErr) {
    console.log('  NOTE: "Accepted" status not available in enum.')
    console.log('  Run this SQL in Supabase SQL Editor to add it:')
    console.log('    ALTER TYPE application_status ADD VALUE IF NOT EXISTS \'Accepted\';')
    console.log('  Falling back to "Interview" for placed students\n')
  } else {
    // Clean up probe record
    await supabase
      .from('job_applications')
      .delete()
      .eq('company_name', '__PROBE__')
    console.log('  "Accepted" status is available.\n')
  }

  const placedStatus = acceptedAvailable ? 'Accepted' : 'Interview'

  // Delete existing apps for our students to ensure a clean distribution
  const { error: delErr } = await supabase
    .from('job_applications')
    .delete()
    .in('student_id', insertedStudentIds)

  if (delErr) {
    console.error('  Failed to clear existing apps:', delErr.message)
  } else {
    console.log('  Cleared existing job applications')
  }

  interface AppConfig {
    startIdx: number
    count: number
    statuses: string[]
  }

  const configs: AppConfig[] = [
    { startIdx: 0, count: 4, statuses: [placedStatus] },
    { startIdx: 4, count: 4, statuses: ['Interview', 'Pending'] },
    { startIdx: 8, count: 4, statuses: ['Rejected', 'Pending', 'Interview'] }
  ]

  let appCount = 0
  for (const config of configs) {
    const studentSlice = insertedStudentIds.slice(config.startIdx, config.startIdx + config.count)
    for (const sid of studentSlice) {
      const numApps = 1 + Math.floor(Math.random() * 2)
      for (let a = 0; a < numApps; a++) {
        const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)]
        const position = company.positions[Math.floor(Math.random() * company.positions.length)]
        const status = config.statuses[Math.min(a, config.statuses.length - 1)]

        const appDate = new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000).toISOString()

        const { error: appErr } = await supabase
          .from('job_applications')
          .insert({
            student_id: sid,
            company_name: company.name,
            position,
            application_date: appDate,
            status,
            created_at: now,
            updated_at: now
          })

        if (!appErr) appCount++
      }
    }
  }

  console.log(`  Created ${appCount} job applications`)
  console.log('  Placement distribution:')
  console.log(`    Indices  0-3 → ${placedStatus} (placed)`)
  console.log('    Indices  4-7 → Interview / Pending')
  console.log('    Indices  8-11 → Rejected / Pending')
  console.log('    Indices 12-19 → No apps (Searching)')

  // 6. Create weekly logbook tracking data
  console.log('\n[6/6] Creating logbook tracking data...')

  const { error: delLogErr } = await supabase
    .from('weekly_logbook_tracking')
    .delete()
    .in('student_id', insertedStudentIds)

  if (delLogErr) {
    console.error('  Failed to clear existing logbooks:', delLogErr.message)
  }

  // Create 8 weeks of logbook entries per student
  const logbookEntries: Array<{
    student_id: string
    semester_id: number
    week_number: number
    week_end_date: string
    is_submitted: boolean
    submitted_at: string | null
    reminder_sent: boolean
  }> = []

  const semesterStart = new Date(activeSemester.start_date)
  for (const sid of insertedStudentIds) {
    for (let week = 1; week <= 8; week++) {
      const weekEnd = new Date(semesterStart)
      weekEnd.setDate(weekEnd.getDate() + week * 7)

      // First 4 weeks submitted, next 2 late, last 2 not submitted
      const isSubmitted = week <= 4
      const isLate = week === 5 || week === 6
      const isOverdue = week >= 7

      logbookEntries.push({
        student_id: sid,
        semester_id: activeSemester.id,
        week_number: week,
        week_end_date: weekEnd.toISOString().split('T')[0],
        is_submitted: isSubmitted,
        submitted_at: isSubmitted
          ? new Date(weekEnd.getTime() - 86400000).toISOString()
          : null,
        reminder_sent: isLate || isOverdue
      })
    }
  }

  const batchSize = 50
  let insertedLogbooks = 0
  for (let i = 0; i < logbookEntries.length; i += batchSize) {
    const batch = logbookEntries.slice(i, i + batchSize)
    const { error: lbErr } = await supabase
      .from('weekly_logbook_tracking')
      .insert(batch)
    if (lbErr) {
      console.error(`  Logbook batch ${i / batchSize} failed:`, lbErr.message)
    } else {
      insertedLogbooks += batch.length
    }
  }

  console.log(`  Created ${insertedLogbooks} logbook entries (${logbookEntries.length / insertedStudentIds.length} weeks × ${insertedStudentIds.length} students)`)

  // Summary
  console.log('\n=== Seed Complete! ===')
  console.log(`  Students:          ${insertedStudentIds.length}`)
  console.log(`  Active semester:     ${activeSemester.name} (ID: ${activeSemester.id})`)
  console.log(`  Checklist items:   ${insertedChecklists} total`)
  console.log(`  Job applications:  ${appCount}`)
  console.log(`  Logbook entries:   ${insertedLogbooks}`)
  console.log(`\n  All student passwords: ${DEFAULT_PASSWORD}`)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
