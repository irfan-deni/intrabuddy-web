import { describe, it, expect } from 'vitest'

/**
 * Tests for logbook status logic extracted from server/api/logbooks.get.ts
 * This tests the status label and staleness computation in isolation.
 */

function computeLogbookStatus(
  isSubmitted: boolean,
  weekEndDate: string,
  staleThresholdDays = 7
): { statusLabel: string; isStale: boolean } {
  const today = new Date().toISOString().split('T')[0]
  let statusLabel = 'Not Submitted'
  if (isSubmitted) {
    statusLabel = 'Submitted'
  } else if (weekEndDate < today) {
    statusLabel = 'Late'
  }

  const weekEnd = new Date(weekEndDate).getTime()
  const daysLate = Math.floor((Date.now() - weekEnd) / (1000 * 60 * 60 * 24))
  const isStale = !isSubmitted && daysLate > staleThresholdDays

  return { statusLabel, isStale }
}

describe('logbook status computation', () => {
  it('marks submitted entries as Submitted', () => {
    const result = computeLogbookStatus(true, '2026-05-20')
    expect(result.statusLabel).toBe('Submitted')
    expect(result.isStale).toBe(false)
  })

  it('marks past-due unsubmitted entries as Late', () => {
    const result = computeLogbookStatus(false, '2026-05-01')
    expect(result.statusLabel).toBe('Late')
  })

  it('marks future unsubmitted entries as Not Submitted', () => {
    const result = computeLogbookStatus(false, '2099-12-31')
    expect(result.statusLabel).toBe('Not Submitted')
  })

  it('does not mark as stale when within threshold', () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 3)
    const result = computeLogbookStatus(false, recentDate.toISOString().split('T')[0])
    expect(result.statusLabel).toBe('Late')
    expect(result.isStale).toBe(false)
  })

  it('marks as stale when past threshold', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 14)
    const result = computeLogbookStatus(false, oldDate.toISOString().split('T')[0])
    expect(result.isStale).toBe(true)
  })

  it('does not mark submitted entries as stale', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)
    const result = computeLogbookStatus(true, oldDate.toISOString().split('T')[0])
    expect(result.statusLabel).toBe('Submitted')
    expect(result.isStale).toBe(false)
  })
})
