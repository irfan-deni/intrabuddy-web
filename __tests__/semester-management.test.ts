import { describe, expect, it, vi } from 'vitest'
import { getSemesterCounts, getSemesterDeletionRule, type SemesterCounts } from '../server/utils/semester-management'

const counts = (overrides: Partial<SemesterCounts> = {}): SemesterCounts => ({
  students: 0,
  templates: 0,
  logbooks: 0,
  applications: 0,
  audits: 0,
  ...overrides
})

const semester = (isActive = false) => ({ id: 1, name: 'Test Semester', is_active: isActive })

describe('semester deletion rule', () => {
  it('blocks the active semester', () => {
    expect(getSemesterDeletionRule(semester(true), counts({ students: 5 }))).toEqual({
      allowed: false,
      message: 'Active semester cannot be deleted. Activate another semester first.'
    })
  })

  it('blocks a semester with enrolled students', () => {
    const rule = getSemesterDeletionRule(semester(), counts({ students: 2 }))
    expect(rule.allowed).toBe(false)
    expect(rule.message).toContain('2 students')
  })

  it('blocks a semester with logbook entries', () => {
    const rule = getSemesterDeletionRule(semester(), counts({ logbooks: 1 }))
    expect(rule.allowed).toBe(false)
    expect(rule.message).toContain('1 logbook entry')
  })

  it('blocks a semester with applications', () => {
    const rule = getSemesterDeletionRule(semester(), counts({ applications: 3 }))
    expect(rule.allowed).toBe(false)
    expect(rule.message).toContain('3 applications')
  })

  it('combines multiple history counts into one message', () => {
    const rule = getSemesterDeletionRule(semester(), counts({ students: 2, logbooks: 5, applications: 1 }))
    expect(rule.allowed).toBe(false)
    expect(rule.message).toContain('2 students, 5 logbook entries and 1 application')
  })

  it('blocks a semester with audit history', () => {
    expect(getSemesterDeletionRule(semester(), counts({ audits: 1 })).allowed).toBe(false)
    expect(getSemesterDeletionRule(semester(), counts({ audits: 1 })).message).toContain('historical management records')
  })

  it('allows an empty semester', () => {
    expect(getSemesterDeletionRule(semester(), counts())).toEqual({ allowed: true, message: null })
  })

  it('allows a semester that only has checklist templates', () => {
    expect(getSemesterDeletionRule(semester(), counts({ templates: 4 }))).toEqual({ allowed: true, message: null })
  })
})

describe('semester counts', () => {
  it('counts every related table for the requested semester', async () => {
    const eq = vi.fn().mockResolvedValue({ count: 0, error: null })
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    const db = { from } as unknown as Parameters<typeof getSemesterCounts>[0]

    const result = await getSemesterCounts(db, 7)

    expect(from).toHaveBeenCalledTimes(5)
    expect(from.mock.calls.map(([table]) => table)).toEqual([
      'student_semesters',
      'checklist_templates',
      'weekly_logbook_tracking',
      'job_applications',
      'student_management_audit'
    ])
    expect(eq).toHaveBeenCalledTimes(5)
    expect(eq).toHaveBeenCalledWith('semester_id', 7)
    expect(result).toEqual(counts())
  })

  it('propagates database errors', async () => {
    const error = { code: 'XX000', message: 'count failed' }
    const eq = vi.fn().mockResolvedValue({ count: null, error })
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq })) }))
    const db = { from } as unknown as Parameters<typeof getSemesterCounts>[0]

    await expect(getSemesterCounts(db, 7)).rejects.toMatchObject(error)
  })
})
