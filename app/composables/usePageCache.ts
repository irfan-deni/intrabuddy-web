// Each Nuxt app owns its in-flight requests; nothing is shared across SSR users.
const pendingRequests = new WeakMap<object, Map<string, Promise<unknown>>>()

export function usePageCache() {
  const app = useNuxtApp()
  const profile = useState<{ id: string } | null>('current-profile', () => null)
  const entries = useState<Record<string, { data: unknown; savedAt: number }>>('page-cache', () => ({}))
  const generation = useState('page-cache-generation', () => 0)
  const revisions = useState<Record<string, number>>('page-cache-revisions', () => ({}))

  const cacheKey = (url: string) => `${profile.value?.id || 'anonymous'}:${url}`

  const read = <T>(url: string): T | undefined => {
    const entry = entries.value[cacheKey(url)]
    // Snapshots remain available for this signed-in app session while a newer
    // response is fetched in the background.
    if (!entry) return undefined
    return structuredClone(toRaw(entry.data)) as T
  }

  const fetch = async <T>(url: string, options: { force?: boolean } = {}): Promise<T> => {
    const key = cacheKey(url)
    const entry = entries.value[key]
    if (!options.force && entry && Date.now() - entry.savedAt < 10_000) {
      return structuredClone(toRaw(entry.data)) as T
    }
    const version = generation.value
    const revision = revisions.value[key] ?? 0
    let requests = pendingRequests.get(app)
    if (!requests) {
      requests = new Map()
      pendingRequests.set(app, requests)
    }
    const requestKey = `${version}:${key}`
    let request = requests.get(requestKey) as Promise<T> | undefined
    if (!request) {
      request = $fetch<T>(url, { timeout: 10_000 }).then((data) => {
        if (generation.value === version && (revisions.value[key] ?? 0) === revision && cacheKey(url) === key) {
          entries.value[key] = { data, savedAt: Date.now() }
        }
        return data
      }).finally(() => requests!.delete(requestKey))
      requests.set(requestKey, request)
    }
    // Page-local flags and optimistic updates must not mutate cached snapshots.
    return structuredClone(await request)
  }

  const clear = () => {
    entries.value = {}
    revisions.value = {}
    generation.value++
  }

  const set = <T>(url: string, data: T) => {
    entries.value[cacheKey(url)] = { data: structuredClone(toRaw(data)), savedAt: Date.now() }
  }

  const invalidate = (urls: string | string[]) => {
    const nextEntries = { ...entries.value }
    for (const url of Array.isArray(urls) ? urls : [urls]) {
      const key = cacheKey(url)
      delete nextEntries[key]
      revisions.value[key] = (revisions.value[key] || 0) + 1
    }
    entries.value = nextEntries
  }

  return { read, fetch, set, clear, invalidate }
}
