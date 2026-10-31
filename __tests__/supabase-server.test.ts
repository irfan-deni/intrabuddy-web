import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ create: vi.fn(), getUser: vi.fn(), header: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.create, parseCookieHeader: () => [] }))
vi.mock('h3', async (importOriginal) => ({ ...await importOriginal<typeof import('h3')>(), getHeader: mocks.header }))
import { serverSupabaseClient, serverSupabaseUser } from '../server/utils/supabase-server'

const event = () => ({ context: {} }) as H3Event

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { supabase: { url: 'https://test.invalid', key: 'test-key' } } }))
  mocks.create.mockReturnValue({ auth: { getUser: mocks.getUser } })
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'student' } }, error: null })
})

describe('Supabase request authentication', () => {
  it('verifies a mobile bearer token with Auth and passes it to data queries', async () => {
    mocks.header.mockImplementation((_event, name) => name === 'authorization' ? 'Bearer mobile-token' : undefined)
    const request = event()
    await expect(serverSupabaseUser(request)).resolves.toEqual({ id: 'student' })
    expect(mocks.getUser).toHaveBeenCalledWith('mobile-token')
    expect(mocks.create).toHaveBeenCalledWith('https://test.invalid', 'test-key', expect.objectContaining({
      global: { headers: { Authorization: 'Bearer mobile-token' } }
    }))
    serverSupabaseClient(request)
    expect(mocks.create).toHaveBeenCalledTimes(1)
  })

  it('uses cookie authentication when no bearer header is provided', async () => {
    await serverSupabaseUser(event())
    expect(mocks.getUser).toHaveBeenCalledWith(undefined)
    expect(mocks.create.mock.calls[0]?.[2]).not.toHaveProperty('global')
  })

  it('returns 401 for invalid or expired credentials', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } })
    await expect(serverSupabaseUser(event())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects malformed authorization headers instead of falling back to cookies', async () => {
    mocks.header.mockImplementation((_event, name) => name === 'authorization' ? 'Basic invalid' : undefined)
    await expect(serverSupabaseUser(event())).rejects.toMatchObject({ statusCode: 401 })
    expect(mocks.getUser).not.toHaveBeenCalled()
  })
})
