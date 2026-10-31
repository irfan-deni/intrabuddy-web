// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ service: vi.fn(), cleanup: vi.fn(), actor: vi.fn(), isSuper: vi.fn() }))
vi.hoisted(() => { (globalThis as any).defineEventHandler = (handler: unknown) => handler })
vi.mock('../server/utils/supabase-server', () => ({ serverSupabaseServiceRole: mocks.service }))
vi.mock('../server/utils/broadcast-media', () => ({ cleanupBroadcastImages: mocks.cleanup }))
import handler from '../server/api/broadcasts/[id].delete'

const event = {} as H3Event
const path = 'broadcast-images/owner/12345678-1234-1234-1234-123456789abc.png'
let result: { data: unknown[] | null; error: unknown }
let eq: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireCoordinator', mocks.actor)
  vi.stubGlobal('isSuperCoordinator', mocks.isSuper)
  vi.stubGlobal('getRouterParam', () => '42')
  vi.stubGlobal('positiveId', () => 42)
  mocks.actor.mockResolvedValue({ id: 'owner' })
  result = { data: [{ id: 42, coordinator_id: 'owner', image_paths: [path, 'broadcast-images/other/12345678-1234-1234-1234-123456789abc.png'] }], error: null }
  const query: any = { delete: () => query, eq: (...args: unknown[]) => { eq(...args); return query }, select: () => Promise.resolve(result) }
  eq = vi.fn()
  mocks.service.mockReturnValue({ from: () => query })
})

describe('Broadcast deletion', () => {
  it('cleans only generated paths owned by the deleted broadcast coordinator', async () => {
    await expect(handler(event)).resolves.toEqual({ success: true })
    expect(eq).toHaveBeenCalledWith('coordinator_id', 'owner')
    expect(mocks.cleanup).toHaveBeenCalledWith(event, [path])
  })

  it('does not clean storage when no authorized broadcast was deleted', async () => {
    result = { data: [], error: null }
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.cleanup).not.toHaveBeenCalled()
  })
})
