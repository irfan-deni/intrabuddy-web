import { describe, it, expect } from 'vitest'

/**
 * Tests the placement status logic extracted from server/api/students.get.ts
 */

function computePlacementStatus(applications: { status: string }[]): string {
  if (applications.some(app => app.status === 'Accepted')) {
    return 'Accepted'
  }
  if (applications.some(app => app.status === 'Interview')) {
    return 'Interview'
  }
  if (applications.length > 0 && applications[0]) {
    return applications[0].status || 'Pending'
  }
  return 'Searching'
}

describe('placement status computation', () => {
  it('returns Searching when no applications', () => {
    expect(computePlacementStatus([])).toBe('Searching')
  })

  it('returns Accepted when any application is accepted', () => {
    const apps = [
      { status: 'Pending' },
      { status: 'Accepted' }
    ]
    expect(computePlacementStatus(apps)).toBe('Accepted')
  })

  it('returns Interview when any application is interviewing', () => {
    const apps = [
      { status: 'Pending' },
      { status: 'Interview' }
    ]
    expect(computePlacementStatus(apps)).toBe('Interview')
  })

  it('returns first application status otherwise', () => {
    const apps = [{ status: 'Pending' }]
    expect(computePlacementStatus(apps)).toBe('Pending')
  })

  it('handles undefined status with fallback to Pending', () => {
    const apps = [{ status: undefined as unknown as string }]
    expect(computePlacementStatus(apps)).toBe('Pending')
  })

  it('Accepted takes priority over Interview', () => {
    const apps = [
      { status: 'Interview' },
      { status: 'Accepted' }
    ]
    expect(computePlacementStatus(apps)).toBe('Accepted')
  })
})
