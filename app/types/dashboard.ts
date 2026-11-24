export type LogbookSummary = {
  weekStart: string | null
  weekEnd: string | null
  total: number
  submitted: number
  pending: number
}

export type LogbookTrendWeek = {
  weekEnd: string
  weekNumber?: number | null
  submitted: number
  overdue: number
  pending: number
}

export type DashboardResponse = {
  semesterName: string
  semester: {
    id: number
    startDate: string | null
    endDate: string | null
    registrationOpen: boolean
  } | null
  totalStudents: number
  placedStudents: number
  unplacedStudents: number
  placementPercentage: number | null
  studentsMissingChecklists: number
  overdueLogbooks: number
  reviewQueue?: { count: number | null }
  logbookSummary: LogbookSummary
  logbookTrend?: LogbookTrendWeek[]
}
