<template>
  <div class="space-y-12">
    <header>
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Broadcasts</h1>
      <p class="text-slate-500 mt-1.5">Dispatch announcements to the cohort or specific segments.</p>
    </header>

    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-sm">
      <i class="pi pi-exclamation-circle text-lg"></i>
      {{ errorMessage }}
    </div>

    <div v-if="dispatchNotice" :class="[
      'p-4 rounded-xl border flex items-center justify-between gap-4 text-sm animate-in fade-in slide-in-from-top-4 duration-300',
      dispatchNotice.variant === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
    ]">
      <div class="flex items-center gap-3">
        <i :class="dispatchNotice.variant === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'" class="text-lg"></i>
        <span class="font-medium">{{ dispatchNotice.message }}</span>
      </div>
      <button @click="dispatchNotice = null" class="text-slate-400 hover:text-slate-900">
        <i class="pi pi-times text-xs"></i>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Compose Form -->
      <div class="lg:col-span-5 space-y-6">
        <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest">New Broadcast</h2>
        
        <div class="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <form class="space-y-6" @submit.prevent="createBroadcast">
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Message Title</label>
              <input
                v-model="form.title"
                type="text"
                required
                placeholder="Important Announcement"
                class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all font-medium"
              >
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Content Body</label>
              <textarea
                v-model="form.body"
                rows="6"
                required
                placeholder="Write your message here..."
                class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all resize-none"
              ></textarea>
            </div>

            <div class="flex flex-col gap-4 pt-4 border-t border-slate-50">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipients</span>
                <select v-model="form.targetRole" class="text-xs font-bold text-blue-600 border-none bg-transparent outline-none cursor-pointer hover:text-blue-700">
                  <option value="student">All Students</option>
                  <option value="unplaced_students">Unplaced Only</option>
                </select>
              </div>

              <button
                type="submit"
                :disabled="isSaving"
                class="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <i class="pi pi-send text-xs" :class="{ 'animate-bounce': isSaving }"></i>
                {{ isSaving ? 'Sending...' : 'Send Broadcast' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- History Section -->
      <div class="lg:col-span-7 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest">History</h2>
          <button @click="loadBroadcasts" :disabled="isLoading" class="text-xs font-bold text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2">
            <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
            Refresh
          </button>
        </div>

        <div class="space-y-4">
          <div v-if="isLoading" class="py-20 text-center text-slate-300 flex flex-col items-center gap-3">
            <i class="pi pi-spin pi-spinner text-3xl"></i>
            <span class="text-sm font-medium">Fetching history...</span>
          </div>
          <div v-else-if="broadcasts.length === 0" class="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <i class="pi pi-history text-4xl mb-4 text-slate-200"></i>
            <p class="text-sm font-medium text-slate-400">No previous broadcasts found.</p>
          </div>
          
          <div v-for="broadcast in broadcasts" :key="broadcast.id" class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all group">
            <div class="flex justify-between items-start gap-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <i class="pi pi-envelope text-[10px]"></i>
                  </span>
                  <h3 class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{{ broadcast.title }}</h3>
                </div>
                <p class="text-sm text-slate-500 leading-relaxed">{{ broadcast.body }}</p>
              </div>
              <button
                class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-200 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                @click="deleteBroadcast(broadcast.id)"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
            
            <div class="flex items-center gap-4 mt-6 pt-4 border-t border-slate-50">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {{ broadcast.target_roles?.join(', ') || '---' }}
              </span>
              <span class="text-[11px] font-medium text-slate-300 tabular-nums">
                {{ broadcast.sent_at ? formatDate(broadcast.sent_at) : '---' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
    errorMessage.value = 'Failed to load broadcast history'
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
      throw new Error('Please fill in all fields')
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
      dispatchNotice.value = { variant: 'success', message: `Broadcast dispatched to ${result.queued} recipients` }
      form.value.title = ''
      form.value.body = ''
    }
    await loadBroadcasts()
  } catch (error: unknown) {
    dispatchNotice.value = { variant: 'error', message: 'Failed to send broadcast' }
  } finally {
    isSaving.value = false
  }
}

const deleteBroadcast = async (id: number) => {
  if (!confirm('Are you sure you want to archive this broadcast?')) return

  try {
    const { error } = await supabase.from('broadcast_messages').delete().eq('id', id)
    if (error) throw error
    await loadBroadcasts()
  } catch (error: unknown) {
    alert('Archive failed')
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await loadBroadcasts()
})
</script>
