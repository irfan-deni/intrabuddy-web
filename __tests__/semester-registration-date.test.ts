import { describe, expect, it } from 'vitest'
import { campusDate, registrationBlockReason } from '../shared/utils/semester-registration'

describe('semester registration eligibility', () => {
  it('allows opening for future semesters and through the end date in Malaysia', () => {
    const today = campusDate(new Date('2026-06-30T15:59:59Z'))
    expect(today).toBe('2026-06-30')
    expect(registrationBlockReason('2026-06-30', today)).toBeNull()
    expect(registrationBlockReason('2026-12-31', today)).toBeNull()
  })

  it('closes at midnight in Malaysia, not UTC', () => {
    const today = campusDate(new Date('2026-06-30T16:00:00Z'))
    expect(today).toBe('2026-07-01')
    expect(registrationBlockReason('2026-06-30', today)).toBe('Semester ended')
  })

  it('does not allow opening when there is no end date', () => {
    expect(registrationBlockReason(null, '2026-07-01')).toBe('End date not set')
  })
})
