import { describe, it, expect } from 'vitest'

import { parseSuperCoordinatorEmails } from '../server/utils/super-coordinator'

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
