const campusDateFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Kuala_Lumpur',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

export function campusDate(now = new Date()) {
  const parts = campusDateFormatter.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function registrationBlockReason(endDate: string | null | undefined, today = campusDate()) {
  if (!endDate) return 'End date not set'
  if (endDate < today) return 'Semester ended'
  return null
}
