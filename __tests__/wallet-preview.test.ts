import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ actor: vi.fn(), student: vi.fn(), service: vi.fn(), lookup: vi.fn(), download: vi.fn(), headers: vi.fn() }))
vi.hoisted(() => { (globalThis as any).defineEventHandler = (handler: unknown) => handler })
vi.mock('../server/utils/supabase-server', () => ({ serverSupabaseServiceRole: mocks.service }))
import handler from '../server/api/students/[id]/wallet/[entryId].get'

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireCoordinator', mocks.actor)
  vi.stubGlobal('requireStudentTarget', mocks.student)
  vi.stubGlobal('positiveId', (value: string) => Number(value))
  vi.stubGlobal('getRouterParam', (_event: unknown, name: string) => name === 'id' ? 'student-1' : '1')
  vi.stubGlobal('setResponseHeaders', mocks.headers)
  mocks.actor.mockResolvedValue({ id: 'coordinator', role: 'coordinator' })
  mocks.student.mockResolvedValue({ id: 'student-1', role: 'student' })
  mocks.lookup.mockResolvedValue({ data: { file_path: 'student-1/resume.pdf', file_type: 'pdf' }, error: null })
  mocks.download.mockResolvedValue({ data: new Blob(['pdf']), error: null })
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: mocks.lookup }
  mocks.service.mockReturnValue({ from: () => query, storage: { from: () => ({ download: mocks.download }) } })
})

describe('wallet preview endpoint', () => {
  it('allows an unassigned coordinator to view a document without a semester', async () => {
    const event = {} as H3Event
    expect(await handler(event)).toEqual(new Uint8Array([112, 100, 102]))
    expect(mocks.actor).toHaveBeenCalledWith(event)
    expect(mocks.student).toHaveBeenCalledWith(event, 'student-1')
    expect(mocks.download).toHaveBeenCalledWith('student-1/resume.pdf')
    expect(mocks.headers).toHaveBeenCalledWith(event, expect.objectContaining({ 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store' }))
  })

  it.each([401, 403])('rejects a caller denied by coordinator authentication (%i)', async statusCode => {
    mocks.actor.mockRejectedValue(createError({ statusCode }))
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode })
    expect(mocks.student).not.toHaveBeenCalled()
    expect(mocks.lookup).not.toHaveBeenCalled()
    expect(mocks.download).not.toHaveBeenCalled()
  })

  it('rejects a nonexistent or non-student target before retrieving the document', async () => {
    mocks.student.mockRejectedValue(createError({ statusCode: 404 }))
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.lookup).not.toHaveBeenCalled()
  })

  it('rejects a missing or mismatched document path', async () => {
    mocks.lookup.mockResolvedValue({ data: { file_path: 'other/resume.pdf', file_type: 'pdf' }, error: null })
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 404 })
    expect(mocks.download).not.toHaveBeenCalled()
  })

  it('rejects unsafe file types', async () => {
    mocks.lookup.mockResolvedValue({ data: { file_path: 'student-1/document.svg', file_type: 'image/svg+xml' }, error: null })
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 415 })
    expect(mocks.download).not.toHaveBeenCalled()
  })
})
