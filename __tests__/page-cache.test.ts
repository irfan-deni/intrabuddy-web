import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, toRaw } from 'vue'
import { usePageCache } from '../app/composables/usePageCache'

describe('session page cache', () => {
  let state: Map<string, ReturnType<typeof ref>>
  let fetcher: ReturnType<typeof vi.fn>

  beforeEach(() => {
    state = new Map()
    fetcher = vi.fn()
    const app = {}
    vi.stubGlobal('useNuxtApp', () => app)
    vi.stubGlobal('useState', (key: string, init: () => unknown) => {
      if (!state.has(key)) state.set(key, ref(init()))
      return state.get(key)
    })
    vi.stubGlobal('toRaw', toRaw)
    vi.stubGlobal('$fetch', fetcher)
    usePageCache()
    state.get('current-profile')!.value = { id: 'coordinator-1' }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('deduplicates simultaneous requests and isolates page-local mutations', async () => {
    fetcher.mockResolvedValue([{ id: 1, submitted: false }])
    const firstPage = usePageCache()
    const secondPage = usePageCache()
    const [first, second] = await Promise.all([
      firstPage.fetch<Array<{ id: number; submitted: boolean }>>('/api/logbooks'),
      secondPage.fetch<Array<{ id: number; submitted: boolean }>>('/api/logbooks')
    ])
    expect(fetcher).toHaveBeenCalledTimes(1)
    first[0]!.submitted = true
    expect(second[0]!.submitted).toBe(false)
    expect(secondPage.read('/api/logbooks')).toEqual([{ id: 1, submitted: false }])
  })

  it('does not expose a snapshot to another account', async () => {
    fetcher.mockResolvedValue({ students: ['private record'] })
    const cache = usePageCache()
    await cache.fetch('/api/students')
    state.get('current-profile')!.value = { id: 'coordinator-2' }
    expect(cache.read('/api/students')).toBeUndefined()
  })

  it('does not repopulate cleared data when an old request finishes', async () => {
    let resolve!: (data: unknown) => void
    fetcher.mockReturnValue(new Promise(done => { resolve = done }))
    const cache = usePageCache()
    const request = cache.fetch('/api/dashboard')
    cache.clear()
    resolve({ totalStudents: 21 })
    await request
    expect(cache.read('/api/dashboard')).toBeUndefined()
  })

  it('keeps snapshots available for the signed-in app session', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000)
    fetcher.mockResolvedValue({ totalStudents: 21 })
    const cache = usePageCache()
    await cache.fetch('/api/dashboard')
    expect(cache.read('/api/dashboard')).toEqual({ totalStudents: 21 })
    clock.mockReturnValue(3_600_001)
    expect(cache.read('/api/dashboard')).toEqual({ totalStudents: 21 })
  })

  it('reuses data younger than 10 seconds and refetches once it becomes stale', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000)
    fetcher.mockResolvedValueOnce({ totalStudents: 21 }).mockResolvedValueOnce({ totalStudents: 22 })
    const cache = usePageCache()
    await cache.fetch('/api/dashboard')
    clock.mockReturnValue(10_999)
    expect(await cache.fetch('/api/dashboard')).toEqual({ totalStudents: 21 })
    expect(fetcher).toHaveBeenCalledTimes(1)
    clock.mockReturnValue(11_000)
    expect(await cache.fetch('/api/dashboard')).toEqual({ totalStudents: 22 })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('manual refresh bypasses the fresh window and replaces the snapshot', async () => {
    fetcher.mockResolvedValueOnce({ totalStudents: 21 }).mockResolvedValueOnce({ totalStudents: 22 })
    const cache = usePageCache()
    await cache.fetch('/api/dashboard')
    expect(await cache.fetch('/api/dashboard', { force: true })).toEqual({ totalStudents: 22 })
    expect(cache.read('/api/dashboard')).toEqual({ totalStudents: 22 })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('mutations or logout invalidate even newly fetched data', async () => {
    fetcher.mockResolvedValueOnce({ totalStudents: 21 }).mockResolvedValueOnce({ totalStudents: 22 })
    const cache = usePageCache()
    await cache.fetch('/api/dashboard')
    cache.clear()
    expect(cache.read('/api/dashboard')).toBeUndefined()
    expect(await cache.fetch('/api/dashboard')).toEqual({ totalStudents: 22 })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('invalidates only the requested snapshot', async () => {
    fetcher.mockResolvedValueOnce({ totalStudents: 21 }).mockResolvedValueOnce([{ id: 1 }])
    const cache = usePageCache()
    await cache.fetch('/api/dashboard')
    await cache.fetch('/api/logbooks')

    cache.invalidate('/api/logbooks')

    expect(cache.read('/api/dashboard')).toEqual({ totalStudents: 21 })
    expect(cache.read('/api/logbooks')).toBeUndefined()
  })

  it('stores a locally loaded fallback snapshot', () => {
    const cache = usePageCache()
    cache.set('/api/checklists', { semesterId: 1, templates: [{ id: 1 }] })
    expect(cache.read('/api/checklists')).toEqual({ semesterId: 1, templates: [{ id: 1 }] })
  })
})
