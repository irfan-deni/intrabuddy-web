<template>
  <div class="app-surface-ui space-y-5 md:space-y-6">
    <PortalPageHeader v-if="!embedded" title="Notification Center" icon="pi-bell" description="Review notification history and send individual alerts." />
    <section>
      <div class="portal-composer rounded-card bg-surface">
        <PortalSectionHeading title="Send an alert" icon="pi-bell" description="Send a message to one student." />
        <form @submit.prevent="sendAlert" class="space-y-5">
          <div class="space-y-2 relative">
            <label for="alert-recipient" class="portal-field-label">Recipient</label>
            <div class="relative">
              <input
                id="alert-recipient"
                ref="searchInputRef"
                v-model="studentSearch"
                type="text"
                placeholder="Search for a student..."
                required
                class="portal-field pr-12"
                @focus="isDropdownOpen = true"
                @input="isDropdownOpen = true"
              />
              <button
                v-if="studentSearch"
                type="button"
                aria-label="Clear recipient"
                class="rounded-control absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-slate-800 transition-colors"
                @click="clearSelection"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
            <ul
              v-if="isDropdownOpen"
              class="absolute z-10 w-full mt-1 bg-surface border border-surface-control rounded-control shadow-lg max-h-60 overflow-y-auto"
            >
              <li
                v-for="s in filteredStudents"
                :key="s.id"
              >
                <button type="button" class="w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-sky-50" @click="selectStudent(s)">
                  {{ s.full_name }} ({{ s.student_id || 'N/A' }})
                </button>
              </li>
              <li v-if="filteredStudents.length === 0" class="px-4 py-3 text-sm text-text-muted">
                No matches
              </li>
            </ul>
          </div>
          <div class="space-y-2">
            <label for="alert-title" class="portal-field-label">Title</label>
            <input id="alert-title" v-model="alertForm.title" type="text" required placeholder="e.g., Urgent reminder" class="portal-field">
          </div>
          <div class="space-y-2">
            <label for="alert-message" class="portal-field-label">Message</label>
            <textarea id="alert-message" v-model="alertForm.body" rows="5" required placeholder="Write your alert..." class="portal-field resize-y leading-relaxed"></textarea>
          </div>
          <div class="flex justify-end pt-1">
            <button type="submit" :disabled="isSending" class="portal-primary-action w-full sm:w-auto">
              <i aria-hidden="true" class="pi pi-send"></i>
              {{ isSending ? 'Sending...' : 'Send Alert' }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <PortalSectionHeading :title="embedded ? 'Individual Alert History' : 'Notification History'" icon="pi-history" tone="violet" />
        <span class="text-sm font-medium text-text-muted tabular-nums">{{ notifications.length }} record{{ notifications.length === 1 ? '' : 's' }}</span>
      </div>

      <div class="rounded-card overflow-hidden bg-surface border border-surface-border">
        <div v-if="isLoading" class="py-12 md:py-16 text-center text-text-muted">
          <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
          <span class="text-sm font-medium">Loading alerts...</span>
        </div>

        <div v-else-if="notifications.length === 0" class="py-12 md:py-20 text-center text-sm font-medium text-text-muted">No notifications recorded</div>

        <template v-else>
          <div class="block md:hidden space-y-3 p-4">
            <div v-for="n in notifications" :key="n.id" class="rounded-card border border-surface-border p-4 transition-all" :class="n.is_read ? 'bg-surface' : 'bg-amber-50/40'">
              <div class="flex items-start justify-between mb-2">
                <div class="min-w-0 break-words text-sm font-semibold text-slate-800">{{ n.recipient_name || 'Unknown' }}</div>
                <div class="flex items-center gap-1.5 ml-2">
                  <button
                    v-if="!embedded && !n.is_read"
                    class="h-6 w-6 flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white rounded-control transition-all"
                    title="Mark as read"
                    @click="markAsRead(n)"
                  >
                    <i class="pi pi-check text-[9px]"></i>
                  </button>
                  <span class="whitespace-nowrap rounded-badge px-2 py-0.5 text-xs font-semibold" :class="n.is_read ? 'bg-teal-100 text-teal-900' : 'bg-amber-100 text-amber-900'">{{ n.is_read ? 'Read' : 'Unread' }}</span>
                  <button
                    v-if="!embedded"
                    class="h-6 w-6 flex items-center justify-center border border-red-300 text-red-700 hover:bg-red-700 hover:text-white rounded-control transition-all"
                    title="Delete"
                    @click="deleteNotification(n.id)"
                  >
                    <i class="pi pi-trash text-[8px]"></i>
                  </button>
                </div>
              </div>
              <div class="mb-1 break-words text-sm font-semibold text-slate-800">{{ displayTitle(n) }}</div>
              <AnnouncementBody :body="displayBody(n)" compact class="mb-2" />
              <div class="flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-2">
                <span class="rounded-badge bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">{{ n.type || 'general' }}</span>
                <span class="text-xs font-medium tabular-nums text-text-muted">{{ n.created_at ? new Date(n.created_at).toLocaleString() : '---' }}</span>
              </div>
            </div>
          </div>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="app-table-header">
                  <th class="px-8 py-6">Recipient</th>
                  <th class="px-8 py-6">Title</th>
                  <th class="px-8 py-6">Type</th>
                  <th class="px-8 py-6 text-right">Read</th>
                  <th class="px-8 py-6 text-right">Sent At</th>
                </tr>
              </thead>
              <tbody class="text-xs divide-y divide-surface-border">
                <tr v-for="n in notifications" :key="n.id" class="transition-all group" :class="n.is_read ? 'bg-surface' : 'bg-amber-50/40'">
                  <td class="px-8 py-6 text-sm font-semibold text-slate-800">{{ n.recipient_name || 'Unknown' }}</td>
                  <td class="px-8 py-6">
                    <div class="break-words text-sm font-semibold text-slate-800">{{ displayTitle(n) }}</div>
                    <AnnouncementBody :body="displayBody(n)" compact class="mt-1" />
                  </td>
                  <td class="px-8 py-6">
                    <span class="rounded-badge bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">{{ n.type || 'general' }}</span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        v-if="!embedded && !n.is_read"
                        class="h-7 w-7 flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white rounded-control transition-all"
                        title="Mark as read"
                        @click="markAsRead(n)"
                      >
                        <i class="pi pi-check text-[10px]"></i>
                      </button>
                      <span class="rounded-badge px-2 py-0.5 text-xs font-semibold" :class="n.is_read ? 'bg-teal-100 text-teal-900' : 'bg-amber-100 text-amber-900'">{{ n.is_read ? 'Read' : 'Unread' }}</span>
                      <button
                        v-if="!embedded"
                        class="h-7 w-7 flex items-center justify-center border border-red-300 text-red-700 hover:bg-red-700 hover:text-white rounded-control transition-all"
                        title="Delete"
                        @click="deleteNotification(n.id)"
                      >
                        <i class="pi pi-trash text-[9px]"></i>
                      </button>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-right text-xs font-medium tabular-nums text-text-muted">
                    {{ n.created_at ? new Date(n.created_at).toLocaleString() : '---' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

const { embedded = false } = defineProps<{ embedded?: boolean }>()

definePageMeta({
  requiredRole: 'coordinator'
})

type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationWithBroadcast = NotificationRow & {
  broadcast: { title: string | null; body: string | null } | null
}

const pageCache = usePageCache()
const { decrementCount } = useNotifications()

const searchInputRef = ref<HTMLInputElement | null>(null)
const studentSearch = ref('')
const isDropdownOpen = ref(false)

const filteredStudents = computed(() => {
  const q = studentSearch.value.toLowerCase().trim()
  if (!q) return students.value
  return students.value.filter(
    (s: any) =>
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q)
  )
})

const selectStudent = (s: any) => {
  alertForm.value.recipient_id = s.id
  studentSearch.value = `${s.full_name} (${s.student_id || 'N/A'})`
  isDropdownOpen.value = false
}

const clearSelection = () => {
  alertForm.value.recipient_id = null
  studentSearch.value = ''
  searchInputRef.value?.focus()
  isDropdownOpen.value = true
}

// Close dropdown on outside click
onMounted(() => {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.space-y-2.relative')) {
      isDropdownOpen.value = false
    }
  })
})

type NotificationDisplay = NotificationWithBroadcast & { recipient_name: string | null }
type StudentLookup = { id: string; full_name: string; student_id: string | null }
const notificationHistoryUrl = embedded ? '/api/alerts' : '/api/notifications'

const notifications = ref<NotificationDisplay[]>([])
const cachedStudents = pageCache.read<StudentLookup[]>('/api/students/lookup')
const students = ref<StudentLookup[]>(cachedStudents || [])
const cachedNotifications = pageCache.read<NotificationWithBroadcast[]>(notificationHistoryUrl)
const isLoading = ref(!cachedNotifications)
const isSending = ref(false)
const errorMessage = ref('')

const alertForm = ref({
  recipient_id: null as string | null,
  title: '',
  body: ''
})

const toDisplayNotifications = (rows: NotificationWithBroadcast[]) => {
  const names = Object.fromEntries(students.value.map(student => [student.id, student.full_name]))
  return rows.map(row => ({
    ...row,
    recipient_name: row.recipient_id ? (names[row.recipient_id] || 'Unknown') : null
  }))
}

if (cachedNotifications) notifications.value = toDisplayNotifications(cachedNotifications)

const loadData = async (force = false) => {
  const cached = pageCache.read<NotificationWithBroadcast[]>(notificationHistoryUrl)
  if (cached) notifications.value = toDisplayNotifications(cached)
  isLoading.value = !cached
  try {
    const [notifRes, studentRes] = await Promise.all([
      pageCache.fetch<NotificationWithBroadcast[]>(notificationHistoryUrl, { force }),
      pageCache.fetch<StudentLookup[]>('/api/students/lookup', { force })
    ])

    students.value = studentRes || []
    notifications.value = toDisplayNotifications(notifRes || [])
  } catch (error: any) {
    errorMessage.value = 'Sync failed'
  } finally {
    isLoading.value = false
  }
}

const sendAlert = async () => {
  if (!alertForm.value.recipient_id) return
  isSending.value = true
  try {
    await $fetch('/api/notifications', {
      method: 'POST',
      body: {
        recipient_id: alertForm.value.recipient_id,
        title: alertForm.value.title,
        body: alertForm.value.body,
        type: 'manual_alert'
      }
    })
    alertForm.value = { recipient_id: null, title: '', body: '' }
    pageCache.invalidate(notificationHistoryUrl)
    await loadData(true)
  } catch (error: any) {
    alert('Failed to send alert')
  } finally {
    isSending.value = false
  }
}

const displayTitle = (n: NotificationDisplay) =>
  n.title || n.broadcast?.title || 'No Title'

const displayBody = (n: NotificationDisplay) =>
  n.body || n.broadcast?.body

const markAsRead = async (notification: NotificationDisplay) => {
  try {
    await $fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' })
    const idx = notifications.value.findIndex(n => n.id === notification.id)
    if (idx !== -1) {
      const notif = notifications.value[idx]!
      notifications.value[idx] = { ...notif, is_read: true }
    }
    pageCache.invalidate(notificationHistoryUrl)
    decrementCount()
  } catch {
    // silently fail — the badge will update on next page load
  }
}

const deleteNotification = async (id: number) => {
  try {
    await $fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    notifications.value = notifications.value.filter(n => n.id !== id)
    pageCache.invalidate(notificationHistoryUrl)
  } catch {
    // silently fail
  }
}

onMounted(loadData)
</script>
