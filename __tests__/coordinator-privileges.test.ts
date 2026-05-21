import { describe, it, expect } from 'vitest'

/**
 * Tests the super coordinator email parsing logic.
 * This function is defined in both useCoordinatorPrivileges.ts and coordinators.post.ts
 */

const parseSuperCoordinatorEmails = (value: string | undefined) => {
  if (!value) return []
  return value.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

describe('parseSuperCoordinatorEmails', () => {
  it('returns empty array for undefined', () => {
    expect(parseSuperCoordinatorEmails(undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseSuperCoordinatorEmails('')).toEqual([])
  })

  it('parses single email', () => {
    expect(parseSuperCoordinatorEmails('admin@test.com')).toEqual(['admin@test.com'])
  })

  it('trims whitespace', () => {
    expect(parseSuperCoordinatorEmails('  Admin@Test.COM  ')).toEqual(['admin@test.com'])
  })

  it('parses comma-separated emails', () => {
    const result = parseSuperCoordinatorEmails('admin@test.com, user@test.com')
    expect(result).toEqual(['admin@test.com', 'user@test.com'])
  })

  it('filters out empty entries', () => {
    const result = parseSuperCoordinatorEmails('admin@test.com,, , user@test.com')
    expect(result).toEqual(['admin@test.com', 'user@test.com'])
  })

  it('handles mixed casing and whitespace', () => {
    const result = parseSuperCoordinatorEmails('  Admin@Test.COM ,  User@Example.Org  ')
    expect(result).toEqual(['admin@test.com', 'user@example.org'])
  })
})
