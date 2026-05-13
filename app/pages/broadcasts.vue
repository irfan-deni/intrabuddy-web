<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Broadcast Notifications</h1>
      <p class="mt-1 text-slate-500">Send targeted announcements to students.</p>
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
          Message Body
          <textarea
            v-model="form.body"
            rows="4"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          ></textarea>
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Target Role
          <select
            v-model="form.targetRole"
            class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="student">All Students</option>
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
              {{ broadcast.target_roles?.join(', ') || 'None' }}
            </span>
          </div>
          <p class="text-sm text-slate-700">{{ broadcast.body }}</p>
          <p class="mt-2 text-xs text-slate-500">
            {{ broadcast.sent_at ? formatDate(broadcast.sent_at) : 'Unknown time' }}
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

type BroadcastRow = Database['public']['Tables']['broadcast_messages']['Row']

const supabase = useSupabaseClient<Database>()

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
  if (!dispatchNotice.value) return ''
  if (dispatchNotice.value.variant === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (dispatchNotice.value.variant === 'warning') return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-red-200 bg-red-50 text-red-800'
})

const form = ref({
  title: '',
  body: '',
  targetRole: 'student'
})

const loadBroadcasts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('broadcast_messages')
      .select('*')
      .order('sent_at', { ascending: false })

    if (error) throw error

    broadcasts.value = data || []
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load broadcasts.'
  } finally {
    isLoading.value = false
  }
}

const createBroadcast = async () => {
  isSaving.value = true
  errorMessage.value = ''
  dispatchNotice.value = null

  try {
    if (!form.value.title.trim() || !form.value.body.trim()) {
      throw new Error('Title and message are required.')
    }

    const result = await $fetch<{ success: boolean; queued: number }>('/api/broadcasts', {
      method: 'POST',
      body: {
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        target_roles: [form.value.targetRole]
      }
    })

    if (result.success) {
      dispatchNotice.value = {
        variant: 'success',
        message: `Broadcast saved and queued to ${result.queued} recipients.`
      }
      form.value.title = ''
      form.value.body = ''
    }

    await loadBroadcasts()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unable to send broadcast.'
    dispatchNotice.value = { variant: 'error', message: msg }
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

onMounted(async () => {
  await loadBroadcasts()
})
</script>
