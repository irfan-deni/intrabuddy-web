import { describe, expect, it } from 'vitest'
import { positiveId } from '../server/utils/validation'

describe('positive resource IDs', () => {
  it.each([undefined, null, '', '0', '-1', '1.5', '1e2', ' 1', '01', 'NaN', '9007199254740992', [], {}])('rejects malformed ID %j', (id) => {
    expect(() => positiveId(id)).toThrow()
  })
  it('accepts safe positive integer IDs', () => {
    expect(positiveId('42')).toBe(42)
    expect(positiveId(42)).toBe(42)
  })
})
