import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = getUserId(user)
  const serviceRole = serverSupabaseServiceRole<Database>(event)

  // Verify Coordinator role
  const { data: actor } = await serviceRole
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

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

  // 1. Find active semester
  const { data: activeSemester } = await serviceRole
    .from('semesters')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeSemester) {
    throw createError({ statusCode: 400, statusMessage: 'No active semester found' })
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

  // 4. Enroll in active semester via student_semesters
  const { error: semesterError } = await serviceRole
    .from('student_semesters')
    .insert({
      student_id: newUser.id,
      semester_id: activeSemester.id
    })

  if (semesterError) {
    await serviceRole.from('users').delete().eq('id', newUser.id)
    await serviceRole.auth.admin.deleteUser(authId).catch(() => {})
    throw createError({ statusCode: 500, statusMessage: 'Semester enrollment failed' })
  }

  // 5. Initialize Checklist from templates
  const { data: templates } = await serviceRole
    .from('checklist_templates')
    .select('id, required')
    .eq('semester_id', activeSemester.id)

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
