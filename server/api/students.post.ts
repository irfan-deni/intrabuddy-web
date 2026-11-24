import { serverSupabaseServiceRole } from '~~/server/utils/supabase-server'
import { campusDate } from '~~/shared/utils/semester-registration'
import type { Database } from '~/types/supabase'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(crypto.getRandomValues(new Uint32Array(1))[0]! % chars.length)
  }
  return password
}

export default defineEventHandler(async (event) => {
  await requireSuperCoordinator(event)
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  const body = await readBody(event)
  const { full_name, student_id, email, phone_number } = body

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Full name is required' })
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })
  }

  if (student_id && typeof student_id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid student ID' })
  }

  // 1. Match Auth signup: choose the newest semester accepting registration.
  const { data: registrationSemester, error: semesterLookupError } = await serviceRole
    .from('semesters')
    .select('id')
    .eq('registration_open', true)
    .gte('end_date', campusDate())
    .order('start_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (semesterLookupError) {
    console.error('[Student Registration Semester]', semesterLookupError)
    throw createError({ statusCode: 500, statusMessage: 'Unable to check semester registration' })
  }
  if (!registrationSemester) {
    throw createError({ statusCode: 409, statusMessage: 'No semester is open for registration' })
  }

  // 2. Create auth user first (required for FK constraint users.id -> auth.users)
  const tempPassword = generateTempPassword()

  const { data: authData, error: authError } = await serviceRole.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name, role: 'student' }
  })

  if (authError || !authData?.user) {
    throw createError({ statusCode: 500, statusMessage: `Auth user creation failed: ${authError?.message}` })
  }

  const authId = authData.user.id

  // 3. Upsert into public.users (trigger may already have created the row)
  const { data: newUser, error: userError } = await serviceRole
    .from('users')
    .upsert({
      id: authId,
      role: 'student' as const,
      full_name,
      student_id: student_id || null,
      email,
      phone_number: phone_number || null
    })
    .select('id')
    .single()

  if (userError || !newUser) {
    await serviceRole.auth.admin.deleteUser(authId).catch(() => {})
    throw createError({ statusCode: 500, statusMessage: `Profile creation failed: ${userError?.message}` })
  }

  // 4. The Auth trigger may already have enrolled this user.
  const { data: existingEnrollment, error: lookupError } = await serviceRole
    .from('student_semesters')
    .select('semester_id')
    .eq('student_id', newUser.id)
    .limit(1)
    .maybeSingle()
  const semesterId = existingEnrollment?.semester_id ?? registrationSemester.id
  const semesterError = lookupError ?? (existingEnrollment?.semester_id != null ? null : (await serviceRole
    .from('student_semesters')
    .insert({ student_id: newUser.id, semester_id: semesterId })).error)

  if (semesterError) {
    await serviceRole.from('users').delete().eq('id', newUser.id)
    await serviceRole.auth.admin.deleteUser(authId).catch(() => {})
    if (semesterError.code === 'P0409') {
      throw createError({ statusCode: 409, statusMessage: 'Registration is closed for this semester' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Semester enrollment failed' })
  }

  // 5. Initialize Checklist from templates
  const { data: templates } = await serviceRole
    .from('checklist_templates')
    .select('id, required')
    .eq('semester_id', semesterId)

  if (templates && templates.length > 0) {
    const checklists = templates.map(t => ({
      student_id: newUser.id,
      checklist_item_id: t.id,
      is_completed: false
    }))

    await serviceRole.from('student_checklists').insert(checklists)
  }

  return { success: true, id: newUser.id }
})
