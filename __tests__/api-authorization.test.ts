import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ user: vi.fn(), service: vi.fn(), single: vi.fn(), client: vi.fn() }))
vi.mock('../server/utils/supabase-server', () => ({
  serverSupabaseUser: mocks.user,
  serverSupabaseServiceRole: mocks.service,
  serverSupabaseClient: mocks.client
}))
import { requireCoordinator, requireSuperCoordinator } from '../server/utils/auth-role'

const endpoints = import.meta.glob<{ default: (event: H3Event) => Promise<unknown> }>('../server/api/**/*.ts')
const loadEndpoint = (name: string) => endpoints[`../server/api/${name}.ts`]!()

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireCoordinator', requireCoordinator)
  vi.stubGlobal('requireSuperCoordinator', requireSuperCoordinator)
  vi.stubGlobal('useRuntimeConfig', () => ({ superCoordinatorEmails: 'admin@example.com' }))
  mocks.user.mockResolvedValue({ id: 'actor', email: 'student@example.com' })
  mocks.single.mockResolvedValue({ data: { role: 'student' }, error: null })
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mocks.single }
  mocks.service.mockReturnValue({ from: vi.fn(() => query) })
})

const coordinatorEndpoints = [
  'students.get', 'logbooks.get', 'logbooks/summary.get', 'logbooks/remind-all.post',
  'logbooks/[id]/reminder.post', 'broadcasts.get', 'broadcasts.post',
   'broadcasts/[id].delete', 'notifications.get', 'notifications.post', 'alerts.get', 'faqs/embed.post',
    'students/[id]/management.get', 'students/[id]/checklists.get', 'checklists.get', 'semesters.get',
   'students/[id]/wallet/[entryId].get'
]
const superEndpoints = [
  'students.post', 'students/[id].delete',
  'coordinators.get', 'coordinators.post', 'coordinators/[id].delete',
  'logbooks/[id]/submit.post', 'notifications/broadcast-dispatch.post',
  'students/[id].put', 'students/[id]/checklists/[entryId].patch', 'students/[id]/applications/[entryId].patch',
  'students/[id]/logbooks/[entryId]/review.post', 'administration/configuration.post'
]

describe('API role enforcement before business operations', () => {
  it('rejects anonymous dashboard requests before querying the aggregate', async () => {
    mocks.user.mockResolvedValue(null)
    const { default: handler } = await loadEndpoint('dashboard.get')
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 401 })
    expect(mocks.client).not.toHaveBeenCalled()
  })

  it('returns 403 when the dashboard RPC rejects the live database role', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: '42501' } })
    mocks.client.mockReturnValue({ rpc })
    const { default: handler } = await loadEndpoint('dashboard.get')
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 403 })
    expect(rpc).toHaveBeenCalledWith('get_coordinator_dashboard')
    expect(mocks.service).not.toHaveBeenCalled()
  })

  it.each([...coordinatorEndpoints, ...superEndpoints])('rejects a student calling %s', async (endpoint) => {
    const { default: handler } = await loadEndpoint(endpoint)
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.single).toHaveBeenCalledTimes(1)
    expect(mocks.client).not.toHaveBeenCalled()
  })

  it.each(superEndpoints)('rejects an ordinary coordinator calling %s', async (endpoint) => {
    mocks.single.mockResolvedValue({ data: { role: 'coordinator' }, error: null })
    const { default: handler } = await loadEndpoint(endpoint)
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.single).toHaveBeenCalledTimes(1)
    expect(mocks.client).not.toHaveBeenCalled()
  })

  it.each([...coordinatorEndpoints, ...superEndpoints])('returns 401 for anonymous %s', async (endpoint) => {
    mocks.user.mockResolvedValue(null)
    const { default: handler } = await loadEndpoint(endpoint)
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 401 })
    expect(mocks.service).not.toHaveBeenCalled()
  })
})
