<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Broadcast Notifications</h1>
      <p class="mt-1 text-slate-500">Send targeted announcements to student cohorts.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <p
      v-if="dispatchNotice"
      class="rounded-lg border px-4 py-3 text-sm"
      :class="dispatchNoticeClasses"
    >
      {{ dispatchNotice.message }}
    </p>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-slate-900">Compose Broadcast</h2>

      <form class="space-y-4" @submit.prevent="createBroadcast">
        <label class="block text-sm font-medium text-slate-700">
          Title
          <input
            v-model="form.title"
            type="text"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Message
          <textarea
            v-model="form.message"
            rows="4"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          ></textarea>
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Target Audience
          <select
            v-model="form.target_audience"
            class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="all_students">All Students</option>
            <option value="unplaced_students">Unplaced Students</option>
          </select>
        </label>

        <button
          type="submit"
          :disabled="isSaving"
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSaving ? 'Sending...' : 'Send Broadcast' }}
        </button>
      </form>
    </article>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Broadcast History</h2>
        <button
          :disabled="isLoading"
          class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          @click="loadBroadcasts"
        >
          Refresh
        </button>
      </div>

      <div v-if="isLoading" class="py-8 text-center text-slate-400">
        <i class="pi pi-spin pi-spinner mr-2" />
        Loading broadcasts...
      </div>

      <ul v-else-if="broadcasts.length > 0" class="space-y-3">
        <li v-for="broadcast in broadcasts" :key="broadcast.id" class="rounded-lg border border-slate-200 p-3">
          <div class="mb-1 flex items-center justify-between gap-3">
            <h3 class="font-semibold text-slate-900">{{ broadcast.title }}</h3>
            <span class="rounded-full bg-slate-100 px-2 py-1 text-xs uppercase tracking-wide text-slate-600">
              {{ broadcast.target_audience.replaceAll('_', ' ') }}
            </span>
          </div>
          <p class="text-sm text-slate-700">{{ broadcast.message }}</p>
          <p class="mt-2 text-xs text-slate-500">
            {{ broadcast.created_at ? formatDate(broadcast.created_at) : 'Unknown time' }}
          </p>
        </li>
      </ul>

      <p v-else class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No broadcasts sent yet.
      </p>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

type BroadcastRow = Database['public']['Tables']['broadcast_notifications']['Row']

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
type RealtimeChannelRef = ReturnType<typeof supabase.channel>
const realtimeChannel = ref<RealtimeChannelRef | null>(null)

const broadcasts = ref<BroadcastRow[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')

type DispatchNotice = {
  variant: 'success' | 'warning' | 'error'
  message: string
}

const dispatchNotice = ref<DispatchNotice | null>(null)

const dispatchNoticeClasses = computed(() => {
  if (!dispatchNotice.value) {
    return ''
  }

  if (dispatchNotice.value.variant === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (dispatchNotice.value.variant === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-900'
  }

  return 'border-red-200 bg-red-50 text-red-800'
})

const form = ref({
  title: '',
  message: '',
  target_audience: 'all_students' as BroadcastRow['target_audience']
})

const loadBroadcasts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('broadcast_notifications')
      .select('id, title, message, target_audience, created_by, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    broadcasts.value = data || []
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load broadcasts.'
  } finally {
    isLoading.value = false
  }
}

type DispatchResponse = {
  ok: boolean
  queued?: number
  reason?: string
  requiresSetup?: boolean
  message?: string
}

const parseDispatchFailureMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: string; statusMessage?: string } }).data
    if (data?.message) {
      return data.message
    }
    if (data?.statusMessage) {
      return data.statusMessage
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Dispatch failed. The broadcast was still saved.'
}

const createBroadcast = async () => {
  if (!user.value) {
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  dispatchNotice.value = null

  try {
    if (!form.value.title.trim() || !form.value.message.trim()) {
      throw new Error('Title and message are required.')
    }

    const { data, error } = await supabase
      .from('broadcast_notifications')
      .insert({
        title: form.value.title.trim(),
        message: form.value.message.trim(),
        target_audience: form.value.target_audience,
        created_by: user.value.id
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    form.value = {
      title: '',
      message: '',
      target_audience: 'all_students'
    }

    if (data?.id) {
      try {
        const result = await $fetch<DispatchResponse>('/api/notifications/broadcast-dispatch', {
          method: 'POST',
          body: {
            broadcastId: data.id
          }
        })

        if (result.requiresSetup) {
          dispatchNotice.value = {
            variant: 'warning',
            message: result.message || 'Mobile notification tables are not set up. Apply docs/mobile-notifications-setup.sql to enable push queueing.'
          }
        } else if (result.ok && typeof result.queued === 'number') {
          if (result.queued === 0 && result.reason) {
            dispatchNotice.value = {
              variant: 'warning',
              message: `Broadcast saved. ${result.reason}`
            }
          } else {
            dispatchNotice.value = {
              variant: 'success',
              message: `Broadcast saved. Queued ${result.queued} mobile notification(s).`
            }
          }
        }
      } catch (dispatchError: unknown) {
        dispatchNotice.value = {
          variant: 'error',
          message: parseDispatchFailureMessage(dispatchError)
        }
      }
    }

    await loadBroadcasts()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to send broadcast.'
  } finally {
    isSaving.value = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

let broadcastRealtimeDebounce: ReturnType<typeof setTimeout> | null = null

const scheduleBroadcastReload = () => {
  if (broadcastRealtimeDebounce) {
    clearTimeout(broadcastRealtimeDebounce)
  }

  broadcastRealtimeDebounce = setTimeout(() => {
    broadcastRealtimeDebounce = null
    void loadBroadcasts()
  }, 500)
}

onMounted(async () => {
  await loadBroadcasts()

  realtimeChannel.value = supabase
    .channel('broadcast-notifications-sync')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'broadcast_notifications'
    }, () => {
      scheduleBroadcastReload()
    })
    .subscribe()
})

onUnmounted(() => {
  if (broadcastRealtimeDebounce) {
    clearTimeout(broadcastRealtimeDebounce)
    broadcastRealtimeDebounce = null
  }

  if (realtimeChannel.value) {
    realtimeChannel.value.unsubscribe()
    realtimeChannel.value = null
  }
})
</script>
