import { serverSupabaseClient, serverSupabaseUser } from '~~/server/utils/supabase-server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Session missing' })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    const userId = user.id!

    // 1. Permissive Profile Lookup
    // We try to get the role, but we won't crash if it's missing or blocked by RLS.
    const { data: actor } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    // 2. Find the active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id, name')
      .eq('is_active', true)
      .maybeSingle()

    if (!activeSemester) {
      return {
        semesterName: 'No Active Semester Set',
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
      .from('student_semesters')
      .select('student_id')
      .eq('semester_id', activeSemester.id)

    const totalStudents = enrolledStudents ? enrolledStudents.length : 0
    const studentIds = enrolledStudents?.map(s => s.student_id).filter(Boolean) as string[] || []

    let placedStudents = 0
    if (studentIds.length > 0) {
      const { data: applications } = await supabase
        .from('job_applications')
        .select('student_id')
        .in('student_id', studentIds)
        .in('status', ['Accepted', 'Interview'])
      
      placedStudents = new Set(applications?.map(app => app.student_id)).size
    }

    const unplacedStudents = totalStudents - placedStudents
    const placementPercentage = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0

    return {
      semesterName: activeSemester.name,
      totalStudents,
      placedStudents,
      unplacedStudents,
      placementPercentage
    }
  } catch (error: any) {
    console.error('[Dashboard Exception]:', error.message)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to load dashboard data' })
  }
})
