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

    // 1. Permissive Profile Lookup
    // We try to get the role, but we won't crash if it's missing or blocked by RLS.
    const { data: actor } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    // 2. Find the active cohort
    const { data: activeCohort } = await supabase
      .from('cohorts')
      .select('id, name')
      .eq('is_active', true)
      .maybeSingle()

    if (!activeCohort) {
      return {
        cohortName: 'No Active Cohort Set',
        totalStudents: 0,
        placedStudents: 0,
        unplacedStudents: 0,
        placementPercentage: 0
      }
    }

    // 3. Get student stats
    // We fetch enrolled students directly. 
    // Note: If RLS is also on these tables, they might still return empty.
    const { data: enrolledStudents } = await supabase
      .from('student_cohorts')
      .select('student_id')
      .eq('cohort_id', activeCohort.id)

    const totalStudents = enrolledStudents ? enrolledStudents.length : 0
    const studentIds = enrolledStudents?.map(s => s.student_id).filter(Boolean) as string[] || []

    let placedStudents = 0
    if (studentIds.length > 0) {
      const { data: applications } = await supabase
        .from('job_applications')
        .select('student_id')
        .in('student_id', studentIds)
        .eq('status', 'Accepted')
      
      placedStudents = new Set(applications?.map(app => app.student_id)).size
    }

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
    console.error('[Dashboard Exception]:', error.message)
    // Return empty state instead of error to keep the UI alive
    return {
      cohortName: 'System Error',
      totalStudents: 0,
      placedStudents: 0,
      unplacedStudents: 0,
      placementPercentage: 0
    }
  }
})
