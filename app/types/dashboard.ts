export type LogbookSummary = {
  total: number
  submitted: number
  late: number
  pending: number
}

export type DashboardResponse = {
  semesterName: string
  totalStudents: number
  placedStudents: number
  unplacedStudents: number
  placementPercentage: number
  logbookSummary: LogbookSummary
}
