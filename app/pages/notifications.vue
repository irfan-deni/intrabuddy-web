<template>
  <div class="app-surface-ui space-y-8 md:space-y-10">
    <section>
      <header v-if="!embedded" class="mb-6">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Notification Center</h1>
        <p class="text-text-muted mt-2 font-bold uppercase text-[10px] tracking-widest">View system notifications and send manual alerts.</p>
      </header>

      <div class="rounded-card max-w-3xl bg-surface border border-surface-border p-5 md:p-7 shadow-sm">
        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6">Send an alert</h2>
        <form @submit.prevent="sendAlert" class="space-y-6">
          <div class="space-y-2 relative">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Recipient</label>
            <div class="relative">
              <input
                ref="searchInputRef"
                v-model="studentSearch"
                type="text"
                placeholder="Search for a student..."
                required
                class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800"
                @focus="isDropdownOpen = true"
                @input="isDropdownOpen = true"
              />
              <button
                v-if="studentSearch"
                type="button"
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
                class="px-4 py-3 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-sky-700 hover:text-white transition-all text-slate-800"
                @click="selectStudent(s)"
              >
                {{ s.full_name }} ({{ s.student_id || 'N/A' }})
              </li>
              <li v-if="filteredStudents.length === 0" class="px-4 py-3 text-xs text-text-muted font-bold uppercase tracking-widest cursor-default">
                No matches
              </li>
            </ul>
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Title</label>
            <input v-model="alertForm.title" type="text" required placeholder="e.g., Urgent Reminder"
              class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Message</label>
            <textarea v-model="alertForm.body" rows="4" required placeholder="Enter alert message..."
              class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <button type="submit" :disabled="isSending"
            class="rounded-control bg-sky-700 text-white px-8 py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sky-800 transition-all disabled:opacity-30">
            {{ isSending ? 'Sending...' : 'Send Alert' }}
          </button>
        </form>
      </div>
    </section>

    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">{{ embedded ? 'Individual Alert History' : 'Notification History' }}</h2>
        <span class="text-[8px] font-black text-text-muted uppercase tracking-widest tabular-nums">{{ notifications.length }} Records</span>
      </div>

      <div class="rounded-card overflow-hidden bg-surface border border-surface-border">
        <div v-if="isLoading" class="py-12 md:py-16 text-center text-text-muted">
          <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
          <span class="text-[10px] font-black uppercase tracking-widest">Loading...</span>
        </div>

        <div v-else-if="notifications.length === 0" class="py-12 md:py-20 text-center text-text-muted font-black uppercase tracking-widest text-[10px]">No notifications recorded</div>

        <template v-else>
          <div class="block md:hidden space-y-3 p-4">
            <div v-for="n in notifications" :key="n.id" class="rounded-card border border-surface-border p-4 transition-all" :class="n.is_read ? 'bg-surface' : 'bg-amber-50/40'">
              <div class="flex items-start justify-between mb-2">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ n.recipient_name || 'Unknown' }}</div>
                <div class="flex items-center gap-1.5 ml-2">
                  <button
                    v-if="!embedded && !n.is_read"
                    class="h-6 w-6 flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white rounded-control transition-all"
                    title="Mark as read"
                    @click="markAsRead(n)"
                  >
                    <i class="pi pi-check text-[9px]"></i>
                  </button>
                  <span class="rounded-badge px-2 py-0.5 text-[9px] font-black whitespace-nowrap" :class="n.is_read ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-400 text-slate-900'">{{ n.is_read ? 'Read' : 'Unread' }}</span>
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
              <div class="font-black text-slate-800 uppercase tracking-tight text-xs mb-1">{{ displayTitle(n) }}</div>
              <AnnouncementBody :body="displayBody(n)" compact class="mb-2" />
              <div class="flex items-center justify-between pt-2 border-t border-surface-border">
                <span class="rounded-badge px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ n.type || 'general' }}</span>
                <span class="text-[9px] font-black text-text-muted tabular-nums">{{ n.created_at ? new Date(n.created_at).toLocaleString() : '---' }}</span>
              </div>
            </div>
          </div>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] bg-surface-muted">
                  <th class="px-8 py-6">Recipient</th>
                  <th class="px-8 py-6">Title</th>
                  <th class="px-8 py-6">Type</th>
                  <th class="px-8 py-6 text-right">Read</th>
                  <th class="px-8 py-6 text-right">Sent At</th>
                </tr>
              </thead>
              <tbody class="text-xs divide-y divide-surface-border">
                <tr v-for="n in notifications" :key="n.id" class="transition-all group" :class="n.is_read ? 'bg-surface' : 'bg-amber-50/40'">
                  <td class="px-8 py-6 font-black text-slate-800 uppercase tracking-tight text-xs whitespace-nowrap">{{ n.recipient_name || 'Unknown' }}</td>
                  <td class="px-8 py-6">
                    <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ displayTitle(n) }}</div>
                    <AnnouncementBody :body="displayBody(n)" compact class="mt-1" />
                  </td>
                  <td class="px-8 py-6">
                    <span class="rounded-badge px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ n.type || 'general' }}</span>
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
                      <span class="rounded-badge px-2 py-0.5 text-[9px] font-black" :class="n.is_read ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-400 text-slate-900'">{{ n.is_read ? 'Read' : 'Unread' }}</span>
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
                  <td class="px-8 py-6 text-right text-text-muted font-black tabular-nums text-[10px]">
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
