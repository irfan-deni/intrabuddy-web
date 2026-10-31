// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

const mocks = vi.hoisted(() => ({ service: vi.fn(), upload: vi.fn(), remove: vi.fn(), publicUrl: vi.fn(), request: vi.fn(), actor: vi.fn() }))
vi.hoisted(() => { (globalThis as any).defineEventHandler = (handler: unknown) => handler })
vi.mock('../server/utils/supabase-server', () => ({ serverSupabaseServiceRole: mocks.service }))
vi.mock('../server/utils/broadcast-media', async importOriginal => ({
  ...await importOriginal<typeof import('../server/utils/broadcast-media')>(), readBroadcastRequest: mocks.request
}))
import { parseBroadcastForm, readLimitedBroadcastBody, uploadBroadcastImages } from '../server/utils/broadcast-media'
import handler from '../server/api/broadcasts.post'

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const event = {} as H3Event
let results: Record<string, { data?: unknown; error: unknown }>
let inserts: Record<string, unknown>
let insertTables: string[]

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('requireCoordinator', mocks.actor)
  mocks.actor.mockResolvedValue({ id: 'actor' })
  mocks.request.mockResolvedValue({ title: 'Meeting', body: 'Plain message', target_roles: ['students_all'], images: [{ type: 'image/png', data: png }] })
  mocks.upload.mockResolvedValue({ error: null })
  mocks.remove.mockResolvedValue({ error: null })
  mocks.publicUrl.mockImplementation((path: string) => ({ data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/broadcast-media/${path}` } }))
  results = { broadcast_messages: { data: [{ id: 42 }], error: null } }
  inserts = {}
  insertTables = []
  mocks.service.mockReturnValue({
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove, getPublicUrl: mocks.publicUrl }) },
    from: (table: string) => {
      const query: any = {
        select: () => query, eq: () => query, maybeSingle: () => query,
        insert: (payload: unknown) => { insertTables.push(table); inserts[table] = payload; return query },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(results[table]))
      }
      return query
    }
  })
})

const form = () => {
  const data = new FormData()
  data.set('title', 'Meeting')
  data.set('body', 'Plain message')
  data.set('target_roles', '["students_all"]')
  return data
}

describe('Server image validation and request limits', () => {
  it('reads actual multipart and legacy JSON HTTP request bodies', async () => {
    const { readBroadcastRequest } = await vi.importActual<typeof import('../server/utils/broadcast-media')>('../server/utils/broadcast-media')
    const data = form()
    data.append('images', new Blob([png], { type: 'image/png' }), 'image.png')
    const request = new Request('https://portal.example/api/broadcasts', { method: 'POST', body: data })
    const requestEvent = { method: 'POST', web: { request }, node: { req: { headers: Object.fromEntries(request.headers) } } } as unknown as H3Event
    await expect(readBroadcastRequest(requestEvent)).resolves.toMatchObject({ title: 'Meeting', body: 'Plain message', images: [{ type: 'image/png', data: png }] })
    const json = new Request('https://portal.example/api/broadcasts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Legacy', body: 'Plain', target_roles: ['students_all'] }) })
    const jsonEvent = { method: 'POST', web: { request: json }, node: { req: { headers: Object.fromEntries(json.headers) } } } as unknown as H3Event
    await expect(readBroadcastRequest(jsonEvent)).resolves.toMatchObject({ title: 'Legacy', images: [] })
  })

  it('parses supported image attachments without trusting their filenames', async () => {
    const data = form()
    data.append('images', new Blob([png], { type: 'image/png' }), 'untrusted.html')
    const result = await parseBroadcastForm(data)
    expect(result.body).toBe('Plain message')
    expect(result.images[0]).toEqual({ type: 'image/png', data: png })
  })

  it('rejects excessive files, fake MIME types, duplicate fields and SVG', async () => {
    const count = form()
    for (let i = 0; i < 4; i++) count.append('images', new Blob([png], { type: 'image/png' }), `${i}.png`)
    await expect(parseBroadcastForm(count)).rejects.toMatchObject({ statusCode: 400 })
    const fake = form()
    fake.append('images', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'fake.png')
    await expect(parseBroadcastForm(fake)).rejects.toMatchObject({ statusCode: 400 })
    const duplicate = form()
    duplicate.append('body', 'second body')
    await expect(parseBroadcastForm(duplicate)).rejects.toMatchObject({ statusCode: 400 })
    const svg = form()
    svg.append('images', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'image.svg')
    await expect(parseBroadcastForm(svg)).rejects.toMatchObject({ statusCode: 400 })
    expect(mocks.upload).not.toHaveBeenCalled()
  })

  it('stops reading oversized streamed bodies even without content-length', async () => {
    const cancel = vi.fn()
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(12)) }, cancel })
    await expect(readLimitedBroadcastBody(stream, 10)).rejects.toMatchObject({ statusCode: 413 })
    expect(cancel).toHaveBeenCalled()
  })
})

describe('Attachment lifecycle during announcement sending', () => {
  it('cleans only its own new uploads after a partial upload failure', async () => {
    mocks.upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error('Unavailable') })
    await expect(uploadBroadcastImages(event, 'actor', [{ type: 'image/png', data: png }, { type: 'image/png', data: png }])).rejects.toMatchObject({ statusCode: 502 })
    const paths = mocks.remove.mock.calls[0]![0] as string[]
    expect(paths).toHaveLength(2)
    expect(paths.every(path => /^broadcast-images\/actor\/[a-f0-9-]+\.png$/.test(path))).toBe(true)
  })

  it('stores image paths separately from the message and preserves sent media', async () => {
    await expect(handler(event)).resolves.toEqual({ success: true, broadcastId: 42 })
    expect((inserts.broadcast_messages as any).body).toBe('Plain message')
    expect((inserts.broadcast_messages as any).image_paths).toEqual([expect.stringMatching(/^broadcast-images\/actor\/[a-f0-9-]+\.png$/)])
    expect(insertTables).toEqual(['broadcast_messages'])
    expect((inserts.broadcast_messages as any).target_roles).toEqual(['students_all'])
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('cleans new files when a SQL constraint proves the insert failed', async () => {
    results.broadcast_messages = { error: { code: '23514' } }
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 502 })
    expect(mocks.remove).toHaveBeenCalledTimes(1)
  })

  it('never deletes potentially sent images after an ambiguous insert timeout', async () => {
    results.broadcast_messages = { error: { code: 'TIMEOUT' } }
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 502 })
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('retains legacy text-only JSON requests', async () => {
    mocks.request.mockResolvedValue({ title: 'Meeting', body: 'Plain message', target_roles: ['students_all'], images: [] })
    await expect(handler(event)).resolves.toMatchObject({ success: true })
    expect((inserts.broadcast_messages as any).body).toBe('Plain message')
    expect((inserts.broadcast_messages as any).image_paths).toEqual([])
    expect(mocks.upload).not.toHaveBeenCalled()
  })
})
