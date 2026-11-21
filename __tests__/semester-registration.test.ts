import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ coordinator: vi.fn(), service: vi.fn(), param: vi.fn(), body: vi.fn(), result: vi.fn() }))
vi.mock('../server/utils/supabase-server', () => ({ serverSupabaseServiceRole: mocks.service }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireSuperCoordinator', mocks.coordinator)
  vi.stubGlobal('getRouterParam', mocks.param)
  vi.stubGlobal('readBody', mocks.body)
  mocks.coordinator.mockResolvedValue({ id: 'coordinator' })
  mocks.param.mockReturnValue('7')
  mocks.body.mockResolvedValue({ registration_open: true })
  mocks.result.mockResolvedValue({ data: { id: 7, registration_open: true }, error: null })
})

const handler = async () => (await import('../server/api/semesters/[id]/registration.patch')).default({} as H3Event)

describe('semester registration update', () => {
  it('updates only the requested semester after Super Coordinator authorization', async () => {
    const maybeSingle = mocks.result
    const select = vi.fn(() => ({ maybeSingle }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    mocks.service.mockReturnValue({ from })

    await expect(handler()).resolves.toEqual({ id: 7, registration_open: true })
    expect(mocks.coordinator).toHaveBeenCalledOnce()
    expect(from).toHaveBeenCalledWith('semesters')
    expect(update).toHaveBeenCalledWith({ registration_open: true })
    expect(eq).toHaveBeenCalledWith('id', 7)
    expect(select).toHaveBeenCalledWith('id, registration_open')
  })

  it('rejects unauthorized users before reading or writing', async () => {
    mocks.coordinator.mockRejectedValue(createError({ statusCode: 403 }))
    await expect(handler()).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.body).not.toHaveBeenCalled()
    expect(mocks.service).not.toHaveBeenCalled()
  })

  it.each([{}, { registration_open: 'true' }, { registration_open: null }, { registration_open: false, is_active: true }, null])(
    'rejects invalid payload %j', async (body) => {
      mocks.body.mockResolvedValue(body)
      await expect(handler()).rejects.toMatchObject({ statusCode: 400 })
      expect(mocks.service).not.toHaveBeenCalled()
    }
  )

  it('returns 404 when the semester does not exist', async () => {
    mocks.result.mockResolvedValue({ data: null, error: null })
    mocks.service.mockReturnValue({ from: () => ({ update: () => ({ eq: () => ({ select: () => ({ maybeSingle: mocks.result }) }) }) }) })
    await expect(handler()).rejects.toMatchObject({ statusCode: 404 })
  })
})
