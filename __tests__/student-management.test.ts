import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ service: vi.fn(), actor: vi.fn(), super: vi.fn(), student: vi.fn(), rpc: vi.fn(), body: vi.fn() }))
vi.mock('../server/utils/supabase-server', () => ({ serverSupabaseServiceRole: mocks.service }))
vi.mock('../server/utils/auth-role', () => ({ requireCoordinator: mocks.actor, requireStudentTarget: mocks.student, isSuperCoordinator: mocks.super }))
import { assertManagementFields, managementReason, mutateStudentRecord } from '../server/utils/student-management'
import profileHandler from '../server/api/students/[id].put'

// defineEventHandler is injected by Nitro; hoisted module loading needs it early.
vi.hoisted(() => { (globalThis as any).defineEventHandler = (handler: unknown) => handler })

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireCoordinator', mocks.actor)
  vi.stubGlobal('requireSuperCoordinator', async () => {
    const actor = await mocks.actor()
    if (!mocks.super()) throw createError({ statusCode: 403, statusMessage: 'Super coordinator access required' })
    return actor
  })
  vi.stubGlobal('requireStudentTarget', mocks.student)
  vi.stubGlobal('isSuperCoordinator', mocks.super)
  vi.stubGlobal('getRouterParam', () => 'student')
  vi.stubGlobal('readBody', mocks.body)
  mocks.actor.mockResolvedValue({ id: 'actor', role: 'coordinator', email: 'coordinator@example.com' })
  mocks.student.mockResolvedValue({ id: 'student', role: 'student' })
  mocks.super.mockReturnValue(true)
  mocks.rpc.mockResolvedValue({ data: { success: true }, error: null })
  mocks.body.mockResolvedValue({ semester_id: 1, phone_number: '123', reason: 'Verified contact' })
  mocks.service.mockReturnValue({ rpc: mocks.rpc })
})

describe('Super Coordinator student mutation boundary', () => {
  it('allows audited contact updates using the live server identity', async () => {
    await expect(profileHandler({} as H3Event)).resolves.toEqual({ success: true })
    expect(mocks.rpc).toHaveBeenCalledWith('manage_student_record', expect.objectContaining({
      p_actor_id: 'actor', p_super: true, p_student_id: 'student', p_semester_id: 1,
      p_action: 'profile', p_payload: { phone_number: '123', reason: 'Verified contact' }
    }))
  })

  it.each(['role', 'p_super', 'actor_id'])('rejects restricted or forged %s fields before writing', async field => {
    mocks.body.mockResolvedValue({ semester_id: 1, phone_number: '123', reason: 'Verified', [field]: 'forged' })
    await expect(profileHandler({} as H3Event)).rejects.toMatchObject({ statusCode: 400 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejects regular coordinators without accessing the mutation RPC', async () => {
    mocks.super.mockReturnValue(false)
    await expect(profileHandler({} as H3Event)).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it.each([['42501', 403], ['P0002', 404], ['22023', 400], ['XX000', 500]])('maps transactional %s errors without leaking database internals', async (code, statusCode) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code, message: 'private database details' } })
    await expect(mutateStudentRecord({} as H3Event, { id: 'actor', role: 'coordinator' } as any, 'student', 1, 'profile', { reason: 'Verified' })).rejects.toMatchObject({ statusCode })
  })

  it('requires a nonempty, bounded audit reason', () => {
    for (const value of [undefined, '', ' ', 'x'.repeat(2001)]) expect(() => managementReason(value)).toThrow()
    expect(managementReason('  Verified  ')).toBe('Verified')
    expect(() => assertManagementFields([], ['reason'])).toThrow()
  })
})
