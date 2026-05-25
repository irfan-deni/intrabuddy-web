<template>
  <div class="space-y-8 md:space-y-12">
    <section class="bg-white border border-stone-200 p-4 sm:p-8 lg:p-12 shadow-sm relative overflow-hidden">
      <div class="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <i class="pi pi-bell text-[120px] text-black"></i>
      </div>

      <header class="mb-6 md:mb-10">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Notification Center</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">View system notifications and send manual alerts.</p>
      </header>

      <div class="max-w-3xl mb-8 md:mb-12 p-4 md:p-6 lg:p-8 border border-stone-200 bg-stone-50/50">
        <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6">Manual Alert Dispatch</h3>
        <form @submit.prevent="sendAlert" class="space-y-6">
          <div class="space-y-2 relative">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Recipient</label>
            <div class="relative">
              <input
                ref="searchInputRef"
                v-model="studentSearch"
                type="text"
                placeholder="Search for a student..."
                required
                class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800"
                @focus="isDropdownOpen = true"
                @input="isDropdownOpen = true"
              />
              <button
                v-if="studentSearch"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-800 transition-colors"
                @click="clearSelection"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
            <ul
              v-if="isDropdownOpen"
              class="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-60 overflow-y-auto"
            >
              <li
                v-for="s in filteredStudents"
                :key="s.id"
                class="px-4 py-3 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-sky-600 hover:text-white transition-all text-slate-800"
                @click="selectStudent(s)"
              >
                {{ s.full_name }} ({{ s.student_id || 'N/A' }})
              </li>
              <li v-if="filteredStudents.length === 0" class="px-4 py-3 text-xs text-stone-400 font-bold uppercase tracking-widest cursor-default">
                No matches
              </li>
            </ul>
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Title</label>
            <input v-model="alertForm.title" type="text" required placeholder="e.g., Urgent Reminder"
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Message</label>
            <textarea v-model="alertForm.body" rows="4" required placeholder="Enter alert message..."
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <button type="submit" :disabled="isSending"
            class="bg-sky-600 text-white px-8 py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-30">
            {{ isSending ? 'Sending...' : 'Send Alert' }}
          </button>
        </form>
      </div>
    </section>

    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Notification History</h2>
        <span class="text-[8px] font-black text-stone-400 uppercase tracking-widest tabular-nums">{{ notifications.length }} Records</span>
      </div>

      <div class="bg-white border border-stone-200">
        <div v-if="isLoading" class="py-12 md:py-16 text-center text-stone-400">
          <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
          <span class="text-[10px] font-black uppercase tracking-widest">Loading...</span>
        </div>

        <div v-else-if="notifications.length === 0" class="py-12 md:py-20 text-center text-stone-400 font-black uppercase tracking-widest text-[10px]">No notifications recorded</div>

        <template v-else>
          <div class="block md:hidden space-y-3 p-4">
            <div v-for="n in notifications" :key="n.id" class="border border-stone-200 p-4 transition-all" :class="n.is_read ? 'bg-white' : 'bg-amber-50/40'">
              <div class="flex items-start justify-between mb-2">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ n.recipient_name || 'Unknown' }}</div>
                <div class="flex items-center gap-1.5 ml-2">
                  <button
                    v-if="!n.is_read"
                    class="h-6 w-6 flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white rounded transition-all"
                    title="Mark as read"
                    @click="markAsRead(n)"
                  >
                    <i class="pi pi-check text-[9px]"></i>
                  </button>
                  <span class="px-2 py-0.5 text-[9px] font-black whitespace-nowrap" :class="n.is_read ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'">{{ n.is_read ? 'Read' : 'Unread' }}</span>
                  <button
                    class="h-6 w-6 flex items-center justify-center border border-red-300 text-red-400 hover:bg-red-500 hover:text-white rounded transition-all"
                    title="Delete"
                    @click="deleteNotification(n.id)"
                  >
                    <i class="pi pi-trash text-[8px]"></i>
                  </button>
                </div>
              </div>
              <div class="font-black text-slate-800 uppercase tracking-tight text-xs mb-1">{{ displayTitle(n) }}</div>
              <div class="text-[9px] text-stone-400 line-clamp-2 mb-2">{{ displayBody(n) }}</div>
              <div class="flex items-center justify-between pt-2 border-t border-stone-100">
                <span class="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ n.type || 'general' }}</span>
                <span class="text-[9px] font-black text-stone-400 tabular-nums">{{ n.created_at ? new Date(n.created_at).toLocaleString() : '---' }}</span>
              </div>
            </div>
          </div>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50">
                  <th class="px-8 py-6">Recipient</th>
                  <th class="px-8 py-6">Title</th>
                  <th class="px-8 py-6">Type</th>
                  <th class="px-8 py-6 text-right">Read</th>
                  <th class="px-8 py-6 text-right">Sent At</th>
                </tr>
              </thead>
              <tbody class="text-xs divide-y divide-stone-100">
                <tr v-for="n in notifications" :key="n.id" class="transition-all group" :class="n.is_read ? 'bg-white' : 'bg-amber-50/40'">
                  <td class="px-8 py-6 font-black text-slate-800 uppercase tracking-tight text-xs whitespace-nowrap">{{ n.recipient_name || 'Unknown' }}</td>
                  <td class="px-8 py-6">
                    <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ displayTitle(n) }}</div>
                    <div class="text-[9px] text-stone-400 mt-1 line-clamp-1">{{ displayBody(n) }}</div>
                  </td>
                  <td class="px-8 py-6">
                    <span class="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ n.type || 'general' }}</span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        v-if="!n.is_read"
                        class="h-7 w-7 flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white rounded transition-all"
                        title="Mark as read"
                        @click="markAsRead(n)"
                      >
                        <i class="pi pi-check text-[10px]"></i>
                      </button>
                      <span class="px-2 py-0.5 text-[9px] font-black" :class="n.is_read ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'">{{ n.is_read ? 'Read' : 'Unread' }}</span>
                      <button
                        class="h-7 w-7 flex items-center justify-center border border-red-300 text-red-400 hover:bg-red-500 hover:text-white rounded transition-all"
                        title="Delete"
                        @click="deleteNotification(n.id)"
                      >
                        <i class="pi pi-trash text-[9px]"></i>
                      </button>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-right text-stone-400 font-black tabular-nums text-[10px]">
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
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

definePageMeta({
  requiredRole: 'coordinator'
})

type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationWithBroadcast = NotificationRow & {
  broadcast: { title: string | null; body: string | null } | null
}

const supabase = useSupabaseClient<Database>()
const { isSuperCoordinator } = useCoordinatorPrivileges()
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

const notifications = ref<NotificationDisplay[]>([])
const students = ref<any[]>([])
const isLoading = ref(true)
const isSending = ref(false)
const errorMessage = ref('')

const alertForm = ref({
  recipient_id: null as string | null,
  title: '',
  body: ''
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [notifRes, studentRes] = await Promise.all([
      supabase.from('notifications').select('*, broadcast:broadcast_messages(title, body)').order('created_at', { ascending: false }).limit(200),
      $fetch<any>('/api/students?cohort_id=all')
    ])

    if (notifRes.error) throw notifRes.error
    students.value = (studentRes?.students || studentRes || []).map((s: any) => ({
      id: s.id,
      full_name: s.full_name,
      student_id: s.student_id
    }))

    const rows = (notifRes.data || []) as NotificationWithBroadcast[]
    const recipientIds = rows.map(r => r.recipient_id).filter(Boolean) as string[]
    let nameMap: Record<string, string> = {}
    if (recipientIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, full_name').in('id', recipientIds)
      if (users) users.forEach(u => { nameMap[u.id] = u.full_name })
    }

    notifications.value = rows.map(r => ({
      ...r,
      recipient_name: r.recipient_id ? (nameMap[r.recipient_id] || 'Unknown') : null
    }))
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
    await loadData()
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
      notifications.value[idx] = { ...notifications.value[idx], is_read: true }
    }
    decrementCount()
  } catch {
    // silently fail — the badge will update on next page load
  }
}

const deleteNotification = async (id: number) => {
  try {
    await $fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    notifications.value = notifications.value.filter(n => n.id !== id)
  } catch {
    // silently fail
  }
}

onMounted(loadData)
</script>
