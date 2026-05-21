import { describe, it, expect } from 'vitest'
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  INTERNSHIP_STATUSES,
  LOGBOOK_STATUSES,
  NOTIFICATION_AUDIENCES
} from '../app/constants/domain'

describe('domain constants', () => {
  it('USER_ROLES should have student and coordinator', () => {
    expect(USER_ROLES).toContain('student')
    expect(USER_ROLES).toContain('coordinator')
  })

  it('APPLICATION_STATUSES should match UI usage', () => {
    expect(APPLICATION_STATUSES).toContain('Accepted')
    expect(APPLICATION_STATUSES).toContain('Pending')
    expect(APPLICATION_STATUSES).toContain('Interview')
    expect(APPLICATION_STATUSES).toContain('Rejected')
    expect(APPLICATION_STATUSES).toContain('Offer Declined')
  })

  it('INTERNSHIP_STATUSES should match placement values', () => {
    expect(INTERNSHIP_STATUSES).toContain('Searching')
    expect(INTERNSHIP_STATUSES).toContain('Pending')
    expect(INTERNSHIP_STATUSES).toContain('Accepted')
  })

  it('LOGBOOK_STATUSES should be correct', () => {
    expect(LOGBOOK_STATUSES).toContain('pending')
    expect(LOGBOOK_STATUSES).toContain('submitted')
    expect(LOGBOOK_STATUSES).toContain('overdue')
  })

  it('NOTIFICATION_AUDIENCES should be correct', () => {
    expect(NOTIFICATION_AUDIENCES).toContain('all_students')
    expect(NOTIFICATION_AUDIENCES).toContain('unplaced_students')
  })
})
