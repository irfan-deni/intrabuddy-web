import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createError, type H3Event } from 'h3'
import { positiveId } from '../server/utils/validation'

const mocks = vi.hoisted(() => ({ client: vi.fn(), service: vi.fn(), user: vi.fn() }))
vi.mock('../server/utils/supabase-server', () => ({
  serverSupabaseClient: mocks.client,
  serverSupabaseServiceRole: mocks.service,
  serverSupabaseUser: mocks.user
}))

let query: Record<string, string>
let requests: Array<{ url: URL; init?: RequestInit }>
let respond: (url: URL, init?: RequestInit) => Response

beforeEach(() => {
  query = {}
  requests = []
  respond = () => new Response('[]', { headers: { 'Content-Type': 'application/json' } })
  const client = createClient('https://database.example.test', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input))
        requests.push({ url, init })
        return respond(url, init)
      }
    }
  })
  mocks.client.mockReturnValue(client)
  mocks.service.mockReturnValue(client)
  mocks.service.mockClear()
  mocks.user.mockResolvedValue({ id: 'coordinator', email: 'ordinary@example.com' })
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal('requireCoordinator', vi.fn().mockResolvedValue({ id: 'coordinator' }))
  vi.stubGlobal('getQuery', () => query)
  vi.stubGlobal('positiveId', positiveId)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('useRuntimeConfig', () => ({ superCoordinatorEmails: 'admin@example.com' }))
})

afterEach(() => vi.unstubAllGlobals())

const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })

describe('joined student directory', () => {
  it.each([undefined, 'all', '7'])('loads profiles and their related data in one query for semester %s', async (semester) => {
    if (semester) query.semester_id = semester
    respond = () => json([
      { id: 'one', full_name: 'Student One', student_id: 'S1', email: 'one@example.com', phone_number: null,
        enrollment: [{ semester_id: 7 }],
        applications: [{ status: 'Rejected', semester_id: 7 }, { status: 'Interview', semester_id: 7 }, { status: 'Accepted', semester_id: 7 }],
        checklists: [{ is_completed: true }, { is_completed: false }], documents: [{ id: 1 }, { id: 2 }] },
      { id: 'two', full_name: 'Student Two', student_id: 'S2', email: 'two@example.com', phone_number: null,
        enrollment: [{ semester_id: 7 }],
        applications: [{ status: 'Rejected', semester_id: 7 }, { status: 'Interview', semester_id: 7 },
          ...(semester !== 'all' ? [{ status: 'Accepted', semester_id: 8 }] : [])], checklists: [], documents: [] },
      { id: 'three', full_name: 'Student Three', student_id: null, email: 'three@example.com', phone_number: null,
        applications: [], checklists: [], documents: [] }
    ])
    const { default: handler } = await import('../server/api/students.get')
    const result = await handler({} as H3Event)
    expect(result.totalCount).toBe(3)
    expect(result.students).toMatchObject([
      { id: 'one', placementStatus: 'Accepted', completionPercent: 50, documentCount: 2 },
      { id: 'two', placementStatus: 'Interview', completionPercent: 0, documentCount: 0 },
      { id: 'three', placementStatus: 'Searching', completionPercent: 0, documentCount: 0 }
    ])
    expect(result.students[0]).not.toHaveProperty('applications')
    expect(requests).toHaveLength(1)
    const params = requests[0]!.url.searchParams
    expect(params.get('role')).toBe('eq.student')
    if (!semester) expect(params.get('enrollment.semester.is_active')).toBe('eq.true')
    if (semester === '7') expect(params.get('enrollment.semester_id')).toBe('eq.7')
    if (semester === 'all') expect(params.get('select')).not.toContain('enrollment:')
  })

  it('returns an empty directory without follow-up requests', async () => {
    const { default: handler } = await import('../server/api/students.get')
    expect(await handler({} as H3Event)).toEqual({ students: [], totalCount: 0 })
    expect(requests).toHaveLength(1)
  })

  it('filters by missing required checklist items, including records never started', async () => {
    query.checklist = 'missing'
    respond = (url) => {
      if (url.pathname.endsWith('/checklist_templates')) {
        expect(url.searchParams.get('semester_id')).toBe('in.(7)')
        expect(url.searchParams.get('required')).toBe('eq.true')
        return json([{ id: 9, semester_id: 7 }])
      }
      return json([
        { id: 'started', enrollment: [{ semester_id: 7 }], checklists: [{ checklist_item_id: 9, is_completed: false }] },
        { id: 'not-started', enrollment: [{ semester_id: 7 }], checklists: [{ checklist_item_id: 8, is_completed: true }] },
        { id: 'finished', enrollment: [{ semester_id: 7 }], checklists: [{ checklist_item_id: 9, is_completed: true }] }
      ])
    }
    const { default: handler } = await import('../server/api/students.get')
    const result = await handler({} as H3Event)
    expect(result.students.map(student => student.id)).toEqual(['started', 'not-started'])
  })
})

describe('combined dashboard aggregate', () => {
  const summary = { semesterName: 'Active Semester', semester: { id: 7 }, totalStudents: 3, placedStudents: 2,
    unplacedStudents: 1, placementPercentage: 67, studentsMissingChecklists: 1, overdueLogbooks: 3,
    logbookSummary: { weekStart: '2026-05-09', weekEnd: '2026-05-15', total: 10, submitted: 4, pending: 6 } }

  it('loads placement statistics and logbook totals with one RPC', async () => {
    respond = () => json(summary)
    const { default: handler } = await import('../server/api/dashboard.get')
    expect(await handler({} as H3Event)).toEqual(summary)
    expect(requests).toHaveLength(1)
    expect(requests[0]!.url.pathname).toBe('/rest/v1/rpc/get_coordinator_dashboard')
    expect(mocks.service).not.toHaveBeenCalled()
  })

  it('only adds review counts for a Super Coordinator and counts submitted records without a review', async () => {
    mocks.user.mockResolvedValue({ id: 'coordinator', email: 'admin@example.com' })
    respond = (url, init) => {
      if (url.pathname.includes('/rpc/')) return json(summary)
      expect(init?.method).toBe('HEAD')
      expect(url.searchParams.get('semester_id')).toBe('eq.7')
      expect(url.searchParams.get('is_submitted')).toBe('eq.true')
      expect(url.searchParams.get('review')).toBe('is.null')
      return new Response(null, { headers: { 'Content-Range': '*/2' } })
    }
    const { default: handler } = await import('../server/api/dashboard.get')
    expect(await handler({} as H3Event)).toEqual({ ...summary, reviewQueue: { count: 2 } })
  })

  it('keeps the overview available when the review queue fails', async () => {
    mocks.user.mockResolvedValue({ id: 'coordinator', email: 'admin@example.com' })
    respond = (url) => url.pathname.includes('/rpc/') ? json(summary) : new Response(null, { status: 400 })
    const { default: handler } = await import('../server/api/dashboard.get')
    expect(await handler({} as H3Event)).toEqual({ ...summary, reviewQueue: { count: null } })
  })

  it('does not mistake an outdated dashboard RPC for an inactive semester', async () => {
    respond = () => json({ semesterName: 'Active Semester', totalStudents: 3 })
    const { default: handler } = await import('../server/api/dashboard.get')
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('reports RPC failures instead of displaying fabricated statistics', async () => {
    respond = () => new Response(JSON.stringify({ message: 'Database unavailable' }), { status: 500 })
    const { default: handler } = await import('../server/api/dashboard.get')
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 500 })
  })
})

describe('reporting week drill-down', () => {
  it('filters by the requested deadline before loading tracking records', async () => {
    query.week_end = '2026-05-15'
    respond = (url) => {
      if (url.pathname.endsWith('/semesters')) return json([{ id: 7 }])
      expect(url.searchParams.get('week_end_date')).toBe('eq.2026-05-15')
      expect(url.searchParams.get('semester_id')).toBe('eq.7')
      return json([])
    }
    const { default: handler } = await import('../server/api/logbooks.get')
    expect(await handler({} as H3Event)).toEqual([])
    expect(requests).toHaveLength(2)
  })

  it('rejects invalid dates before querying tracking records', async () => {
    query.week_end = '2026-02-31'
    const { default: handler } = await import('../server/api/logbooks.get')
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 400 })
    expect(requests).toHaveLength(0)
  })
})

describe('compact logbook summary', () => {
  it('uses database counts and includes nullable unsubmitted records in overdue filtering', async () => {
    respond = (url, init) => {
      if (url.pathname.endsWith('/semesters')) return json([{ id: 1 }])
      expect(init?.method).toBe('HEAD')
      expect(url.searchParams.get('users.role')).toBe('eq.student')
      expect(url.searchParams.get('semester_id')).toBe('eq.1')
      let count = 10
      if (url.searchParams.get('is_submitted') === 'eq.true') count = 4
      if (url.searchParams.has('week_end_date')) {
        expect(url.searchParams.get('is_submitted')).toBe('not.is.true')
        expect(url.searchParams.get('week_end_date')).toMatch(/^lt\.\d{4}-\d{2}-\d{2}$/)
        count = 3
      }
      return new Response(null, { headers: { 'Content-Range': `*/${count}` } })
    }
    const { default: handler } = await import('../server/api/logbooks/summary.get')
    expect(await handler({} as H3Event)).toEqual({ total: 10, submitted: 4, late: 3, pending: 3 })
    expect(requests).toHaveLength(4)
  })

  it('returns zero counts without logbook queries when no semester is active', async () => {
    const { default: handler } = await import('../server/api/logbooks/summary.get')
    expect(await handler({} as H3Event)).toEqual({ total: 0, submitted: 0, late: 0, pending: 0 })
    expect(requests).toHaveLength(1)
  })

  it('reports database failures instead of presenting zero counts as real data', async () => {
    respond = (url) => url.pathname.endsWith('/semesters') ? json([{ id: 1 }])
      : new Response(JSON.stringify({ message: 'Database unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    const { default: handler } = await import('../server/api/logbooks/summary.get')
    await expect(handler({} as H3Event)).rejects.toMatchObject({ statusCode: 500 })
  })
})
