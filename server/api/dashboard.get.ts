import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: actor, error: actorError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (actorError) {
    throw createError({ statusCode: 500, statusMessage: actorError.message })
  }

  if (actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Only coordinators can load dashboard data.' })
  }

  // Find the active cohort
  const { data: activeCohort, error: cohortError } = await supabase
    .from('cohorts')
    .select('id, name')
    .eq('is_active', true)
    .single()

  if (cohortError) {
    // If no active cohort is found, it throws an error (PGRST116).
    // Let's just return 0s if no active cohort exists.
    if (cohortError.code === 'PGRST116') {
      return {
        cohortName: 'No Active Cohort',
        totalStudents: 0,
        placedStudents: 0,
        unplacedStudents: 0,
        placementPercentage: 0
      }
    }
    throw createError({ statusCode: 500, statusMessage: cohortError.message })
  }

  // Get all students enrolled in the active cohort
  const { data: enrolledStudents, error: enrolledError } = await supabase
    .from('student_cohorts')
    .select('student_id')
    .eq('cohort_id', activeCohort.id)

  if (enrolledError) {
    throw createError({ statusCode: 500, statusMessage: enrolledError.message })
  }

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

  const studentIds = enrolledStudents.map(s => s.student_id).filter(id => id !== null) as string[]

  // Fetch job applications for these students to determine placement status
  const { data: applications, error: appsError } = await supabase
    .from('job_applications')
    .select('student_id, status')
    .in('student_id', studentIds)
    .eq('status', 'Accepted')

  if (appsError) {
    throw createError({ statusCode: 500, statusMessage: appsError.message })
  }

  // Count unique students with at least one 'Accepted' application
  const placedStudentIds = new Set(applications?.map(app => app.student_id))
  const placedStudents = placedStudentIds.size
  const unplacedStudents = totalStudents - placedStudents
  const placementPercentage = Math.round((placedStudents / totalStudents) * 100)

  return {
    cohortName: activeCohort.name,
    totalStudents,
    placedStudents,
    unplacedStudents,
    placementPercentage
  }
})
