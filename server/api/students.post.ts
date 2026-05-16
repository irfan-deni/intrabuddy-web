import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const session = await serverSupabaseSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  
  // Verify Coordinator role
  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!actor || actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const { full_name, student_id, email, id } = body

  if (!full_name || !email) {
    throw createError({ statusCode: 400, statusMessage: 'Full name and Email are required' })
  }

  // 1. Find active cohort
  const { data: activeCohort } = await supabase
    .from('cohorts')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!activeCohort) {
    throw createError({ statusCode: 400, statusMessage: 'No active cohort found' })
  }

  // 2. Insert into public.users (using provided ID or generating one)
  // Note: In production, you'd usually create an Auth user first.
  const userPayload = {
    id: id || crypto.randomUUID(), // Fallback if no ID provided
    role: 'student' as const,
    full_name,
    student_id: student_id || null,
    email: email
  }

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert(userPayload)
    .select('id')
    .single()

  if (userError || !newUser) {
    throw createError({ statusCode: 500, statusMessage: `User creation failed: ${userError?.message}` })
  }

  // 3. Enroll in active cohort via student_cohorts
  const { error: cohortError } = await supabase
    .from('student_cohorts')
    .insert({
      student_id: newUser.id,
      cohort_id: activeCohort.id
    })

  if (cohortError) {
    await supabase.from('users').delete().eq('id', newUser.id)
    throw createError({ statusCode: 500, statusMessage: 'Cohort enrollment failed' })
  }

  // 4. Initialize Checklist from templates
  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('id, required')
    .eq('cohort_id', activeCohort.id)

  if (templates && templates.length > 0) {
    const checklists = templates.map(t => ({
      student_id: newUser.id,
      checklist_item_id: t.id,
      is_completed: false
    }))

    await supabase.from('student_checklists').insert(checklists)
  }

  return { success: true, id: newUser.id }
})
