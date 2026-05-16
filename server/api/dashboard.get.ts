import { serverSupabaseClient, serverSupabaseSession } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const session = await serverSupabaseSession(event)
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Session missing' })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    const userId = session.user?.id

    // 1. Verify User Role in public.users
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    // If user record doesn't exist in public.users yet, allow access if they are auth'd 
    // but ideally they should have a record.
    if (actorError && actorError.code !== 'PGRST116') {
       throw createError({ statusCode: 500, statusMessage: 'User profile lookup failed' })
    }

    // 2. Find the active cohort
    const { data: activeCohort } = await supabase
      .from('cohorts')
      .select('id, name')
      .eq('is_active', true)
      .maybeSingle()

    if (!activeCohort) {
      return {
        cohortName: 'No Active Cohort',
        totalStudents: 0,
        placedStudents: 0,
        unplacedStudents: 0,
        placementPercentage: 0
      }
    }

    // 3. Get all students enrolled in the active cohort
    const { data: enrolledStudents } = await supabase
      .from('student_cohorts')
      .select('student_id')
      .eq('cohort_id', activeCohort.id)

    const totalStudents = enrolledStudents ? enrolledStudents.length : 0
    if (totalStudents === 0) {
      return {
        cohortName: activeCohort.name,
        totalStudents: 0,
        placedStudents: 0,
        unplacedStudents: 0,
        placementPercentage: 0
      }
    }

    const studentIds = enrolledStudents.map(s => s.student_id).filter(Boolean) as string[]

    // 4. Fetch placement status
    const { data: applications } = await supabase
      .from('job_applications')
      .select('student_id, status')
      .in('student_id', studentIds)
      .eq('status', 'Accepted')

    const placedStudentIds = new Set(applications?.map(app => app.student_id))
    const placedStudents = placedStudentIds.size
    const unplacedStudents = totalStudents - placedStudents
    const placementPercentage = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0

    return {
      cohortName: activeCohort.name,
      totalStudents,
      placedStudents,
      unplacedStudents,
      placementPercentage
    }
  } catch (error: any) {
    console.error('[Dashboard API Error]:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Internal Server Error' })
  }
})
