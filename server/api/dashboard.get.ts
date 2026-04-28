import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

type TrendPoint = {
  label: string
  value: number
  height: number
}

const buildLastSixMonthLabels = () => {
  const labels: string[] = []
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    labels.push(date.toLocaleString('en-US', { month: 'short', year: '2-digit' }))
  }
  return labels
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await serverSupabaseClient(event)

  const { data: actor, error: actorError } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (actorError) {
    throw createError({ statusCode: 500, statusMessage: actorError.message })
  }

  if (actor.role !== 'coordinator') {
    throw createError({ statusCode: 403, statusMessage: 'Only coordinators can load dashboard data.' })
  }

  const [
    totalResult,
    placedResult,
    searchingResult,
    preparingResult,
    completedResult,
    placedStudentsRows
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('is_active', true),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('internship_status', 'placed')
      .eq('is_active', true),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('internship_status', 'searching')
      .eq('is_active', true),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('internship_status', 'preparing')
      .eq('is_active', true),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('internship_status', 'completed')
      .eq('is_active', true),
    supabase
      .from('users')
      .select('created_at')
      .eq('role', 'student')
      .eq('internship_status', 'placed')
      .eq('is_active', true)
  ])

  const queryErrors = [
    totalResult.error,
    placedResult.error,
    searchingResult.error,
    preparingResult.error,
    completedResult.error,
    placedStudentsRows.error
  ].filter(Boolean)

  if (queryErrors.length > 0) {
    throw createError({ statusCode: 500, statusMessage: queryErrors[0]?.message || 'Dashboard query failed.' })
  }

  const labels = buildLastSixMonthLabels()
  const monthlyCounts = new Map(labels.map((label) => [label, 0]))

  for (const student of placedStudentsRows.data || []) {
    const createdAt = student.created_at
    if (!createdAt) {
      continue
    }
    const label = new Date(createdAt).toLocaleString('en-US', {
      month: 'short',
      year: '2-digit'
    })
    if (monthlyCounts.has(label)) {
      monthlyCounts.set(label, (monthlyCounts.get(label) || 0) + 1)
    }
  }

  const maxCount = Math.max(...Array.from(monthlyCounts.values()), 1)
  const monthlyPlacedTrend: TrendPoint[] = labels.map((label) => {
    const value = monthlyCounts.get(label) || 0
    const scaledHeight = Math.max(Math.round((value / maxCount) * 180), value > 0 ? 20 : 4)
    return { label, value, height: scaledHeight }
  })

  return {
    totalStudents: totalResult.count || 0,
    placedStudents: placedResult.count || 0,
    searchingStudents: searchingResult.count || 0,
    actionRequired: preparingResult.count || 0,
    completedStudents: completedResult.count || 0,
    monthlyPlacedTrend
  }
})
