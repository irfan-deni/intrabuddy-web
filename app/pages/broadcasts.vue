<template>
  <section class="space-y-6 p-8 lg:p-10">
    <header class="space-y-2">
      <div class="flex items-center gap-3">
        <div class="rounded-2xl bg-brand-blue/10 p-3">
          <i class="pi pi-send text-2xl text-brand-blue"></i>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-brand-blue">Communication</p>
          <h1 class="text-4xl font-black tracking-tight text-brand-navy">Broadcast Notifications</h1>
        </div>
      </div>
      <p class="text-slate-500">Send targeted announcements to students.</p>
    </header>

    <p v-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <p
      v-if="dispatchNotice"
      class="rounded-2xl border px-4 py-3 text-sm"
      :class="dispatchNoticeClasses"
    >
      {{ dispatchNotice.message }}
    </p>

    <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <h2 class="mb-4 text-lg font-semibold text-brand-navy">Compose Broadcast</h2>

      <form class="space-y-4" @submit.prevent="createBroadcast">
        <label class="block text-sm font-medium text-slate-700">
          Title
          <input
            v-model="form.title"
            type="text"
            required
            class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          >
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Message Body
          <textarea
            v-model="form.body"
            rows="4"
            required
            class="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          ></textarea>
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Target Role
          <select
            v-model="form.targetRole"
            class="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="student">All Students</option>
            <option value="unplaced_students">Unplaced Students</option>
          </select>
        </label>

        <button
          type="submit"
          :disabled="isSaving"
          class="rounded-2xl bg-gradient-to-r from-brand-blue to-brand-teal px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSaving ? 'Sending...' : 'Send Broadcast' }}
        </button>
      </form>
    </article>

    <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-brand-navy">Broadcast History</h2>
        <button
          :disabled="isLoading"
          class="rounded-2xl border border-brand-blue/15 bg-white px-3 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-bg"
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
<<<<<<< HEAD
        <li v-for="broadcast in broadcasts" :key="broadcast.id" class="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-blue/30 hover:bg-brand-bg/30 hover:shadow-md">
          <div class="mb-2 flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <i class="pi pi-envelope-open text-brand-blue"></i>
                <h3 class="font-semibold text-brand-navy">{{ broadcast.title }}</h3>
              </div>
              <p class="mt-2 text-sm text-slate-700 line-clamp-2">{{ broadcast.body }}</p>
            </div>
            <span class="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Sent
            </span>
=======
        <li v-for="broadcast in broadcasts" :key="broadcast.id" class="rounded-lg border border-slate-200 p-3">
          <div class="mb-1 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <h3 class="font-semibold text-slate-900">{{ broadcast.title }}</h3>
              <span class="rounded-full bg-slate-100 px-2 py-1 text-xs uppercase tracking-wide text-slate-600">
                {{ broadcast.target_roles?.join(', ') || 'None' }}
              </span>
            </div>
            <button
              class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
              title="Delete Broadcast"
              @click="deleteBroadcast(broadcast.id)"
            >
              <i class="pi pi-trash"></i>
            </button>
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
          </div>
          <div class="mt-3 flex items-center justify-between">
            <span v-if="broadcast.target_roles" class="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              <i class="pi pi-users text-xs"></i>
              {{ broadcast.target_roles.join(', ') }}
            </span>
            <p class="text-xs text-slate-400">
              {{ broadcast.sent_at ? formatDate(broadcast.sent_at) : 'Unknown time' }}
            </p>
          </div>
        </li>
      </ul>

      <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
        <div class="flex justify-center mb-3">
          <i class="pi pi-send text-4xl text-slate-300"></i>
        </div>
        <p class="text-sm font-medium text-slate-600">No broadcasts sent yet.</p>
        <p class="text-xs text-slate-500 mt-1">Create your first broadcast using the form above.</p>
      </div>
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

    broadcasts.value = (data || []) as BroadcastRow[]
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

const deleteBroadcast = async (id: number) => {
  if (!confirm('Are you sure you want to delete this broadcast?')) return

  try {
    const { error } = await supabase
      .from('broadcast_messages')
      .delete()
      .eq('id', id)

    if (error) throw error

    dispatchNotice.value = {
      variant: 'success',
      message: 'Broadcast deleted successfully.'
    }
    await loadBroadcasts()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unable to delete broadcast.'
    dispatchNotice.value = { variant: 'error', message: msg }
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
