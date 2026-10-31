<template>
  <section class="app-surface-ui space-y-6 md:space-y-8">
    <header>
      <h1 class="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">Notifications</h1>
      <p class="mt-2 text-sm font-normal leading-relaxed text-text-muted">Notifications sent directly to you.</p>
    </header>

    <div v-if="isLoading" class="rounded-card py-12 md:py-16 text-center text-text-muted bg-surface border border-surface-border">
      <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
      <span class="text-sm font-medium">Loading notifications...</span>
    </div>

    <div v-else-if="errorMessage" class="rounded-card p-5 bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-between gap-4">
      <span class="text-sm font-medium">{{ errorMessage }}</span>
      <button type="button" class="rounded-control shrink-0 border border-rose-300 px-3 py-2 text-xs font-semibold hover:bg-rose-100 transition-colors" @click="loadInbox(true)">Retry</button>
    </div>

    <div v-else-if="notifications.length === 0" class="rounded-card py-12 md:py-20 text-center text-sm font-medium text-text-muted bg-surface border border-surface-border">Your inbox is clear.</div>

    <div v-else class="rounded-card overflow-hidden bg-surface border border-surface-border divide-y divide-surface-border">
      <article v-for="notification in notifications" :key="notification.id" class="p-4 md:p-6 flex items-start gap-4" :class="notification.is_read ? '' : 'bg-sky-50/40'">
        <div class="rounded-control h-9 w-9 shrink-0 flex items-center justify-center bg-slate-900 text-white">
          <i class="pi pi-bell text-sm" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <h2 class="text-sm font-semibold text-slate-800">{{ notification.title || notification.broadcast?.title || 'Notification' }}</h2>
            <time class="text-xs font-medium text-text-muted tabular-nums">{{ formatDate(notification.created_at) }}</time>
          </div>
          <AnnouncementBody class="mt-1" :body="notification.body || notification.broadcast?.body || ''" />
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button v-if="!notification.is_read" type="button" class="rounded-control h-8 px-3 bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 transition-colors" @click="markAsRead(notification)">Mark read</button>
          <button type="button" class="rounded-control h-8 w-8 border border-red-300 text-red-700 hover:bg-red-700 hover:text-white transition-colors" :aria-label="`Delete notification ${notification.id}`" @click="deleteNotification(notification.id)"><i class="pi pi-trash text-xs" /></button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({ requiredRole: 'coordinator' })

type NotificationRow = Database['public']['Tables']['notifications']['Row']
type InboxNotification = NotificationRow & { broadcast: { title: string | null; body: string | null } | null }

const pageCache = usePageCache()
const { decrementCount } = useNotifications()
const cachedInbox = pageCache.read<InboxNotification[]>('/api/notifications')
const notifications = ref<InboxNotification[]>(cachedInbox || [])
const isLoading = ref(!cachedInbox)
const errorMessage = ref('')

const loadInbox = async (force = false) => {
  const cached = pageCache.read<InboxNotification[]>('/api/notifications')
  if (cached) notifications.value = cached
  isLoading.value = !cached
  errorMessage.value = ''
  try {
    notifications.value = await pageCache.fetch<InboxNotification[]>('/api/notifications', { force })
  } catch {
    if (!cached) errorMessage.value = 'Unable to load your inbox.'
  } finally {
    isLoading.value = false
  }
}

const markAsRead = async (notification: InboxNotification) => {
  try {
    await $fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' })
    notification.is_read = true
    pageCache.invalidate('/api/notifications')
    decrementCount()
  } catch {
    // The notification remains unread and can be retried.
  }
}

const deleteNotification = async (id: number) => {
  try {
    await $fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    const notification = notifications.value.find(item => item.id === id)
    notifications.value = notifications.value.filter(item => item.id !== id)
    pageCache.invalidate('/api/notifications')
    if (notification && !notification.is_read) decrementCount()
  } catch {
    // The notification remains visible and can be retried.
  }
}

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  : '---'

onMounted(loadInbox)
</script>
