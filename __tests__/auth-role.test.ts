import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ user: vi.fn(), service: vi.fn(), single: vi.fn() }))
vi.mock('../server/utils/supabase-server', () => ({
  serverSupabaseUser: mocks.user,
  serverSupabaseServiceRole: mocks.service
}))
import { requireCoordinator, requireSuperCoordinator, requireStudentTarget } from '../server/utils/auth-role'

const event = {} as H3Event

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('useRuntimeConfig', () => ({ superCoordinatorEmails: 'admin@example.com' }))
  mocks.user.mockResolvedValue({ id: 'actor', email: 'admin@example.com' })
  mocks.single.mockResolvedValue({ data: { role: 'coordinator' }, error: null })
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mocks.single, maybeSingle: mocks.single }
  mocks.service.mockReturnValue({ from: vi.fn(() => query) })
})

describe('server authorization', () => {
  it('rejects anonymous requests before creating a privileged client', async () => {
    mocks.user.mockResolvedValue(null)
    await expect(requireCoordinator(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(mocks.service).not.toHaveBeenCalled()
  })

  it('rejects students even when their Auth email is on the admin allowlist', async () => {
    mocks.single.mockResolvedValue({ data: { role: 'student' }, error: null })
    await expect(requireSuperCoordinator(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('ignores self-editable user_metadata role claims', async () => {
    mocks.user.mockResolvedValue({ id: 'actor', email: 'admin@example.com', user_metadata: { role: 'coordinator' } })
    mocks.single.mockResolvedValue({ data: { role: 'student' }, error: null })
    await expect(requireCoordinator(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('fails closed for missing or unreadable profiles', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: 'unavailable' } })
    await expect(requireCoordinator(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('permits coordinators but denies elevated actions to ordinary coordinators', async () => {
    mocks.user.mockResolvedValue({ id: 'actor', email: 'staff@example.com' })
    await expect(requireCoordinator(event)).resolves.toMatchObject({ id: 'actor', role: 'coordinator' })
    await expect(requireSuperCoordinator(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('normalizes the verified Auth email for super-coordinator authorization', async () => {
    mocks.user.mockResolvedValue({ id: 'actor', email: ' ADMIN@Example.com ' })
    await expect(requireSuperCoordinator(event)).resolves.toMatchObject({ id: 'actor' })
  })

  it('denies elevated actions when the private allowlist is empty', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ superCoordinatorEmails: '' }))
    await expect(requireSuperCoordinator(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('prevents student endpoints from targeting coordinator accounts', async () => {
    await expect(requireStudentTarget(event, 'coordinator-id')).rejects.toMatchObject({ statusCode: 404 })
  })
})
