export const USER_ROLES = ['student', 'coordinator'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const INTERNSHIP_STATUSES = [
  'preparing',
  'searching',
  'placed',
  'completed'
] as const
export type InternshipStatus = (typeof INTERNSHIP_STATUSES)[number]

export const APPLICATION_STATUSES = [
  'pending',
  'interviewing',
  'rejected',
  'offer_accepted'
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const LOGBOOK_STATUSES = ['pending', 'submitted', 'overdue'] as const
export type LogbookStatus = (typeof LOGBOOK_STATUSES)[number]

export const NOTIFICATION_AUDIENCES = [
  'all_students',
  'unplaced_students'
] as const
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number]
