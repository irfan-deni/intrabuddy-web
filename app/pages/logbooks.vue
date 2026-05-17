<template>
  <section class="space-y-6 md:space-y-8">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6 md:pb-8">
      <div>
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Logbook Review</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Monitor cohort logbook compliance and send reminders.</p>
      </div>
    </header>

    <p v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </p>

    <article class="bg-white border border-stone-200 shadow-sm relative">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-stone-50/50 p-4 md:p-6">
        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Logbook Submissions</h2>

        <div class="flex items-center gap-3 md:gap-4">
          <select
            v-model="statusFilter"
            class="text-[10px] font-black border border-stone-200 rounded-none px-3 md:px-4 py-2 bg-white uppercase tracking-widest outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Not Submitted">Not Submitted</option>
            <option value="Late">Late</option>
          </select>

          <button
            class="h-8 px-3 md:px-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-150 transition-all"
            :disabled="isLoading"
            @click="loadLogbooks"
          >
            Refresh
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="py-12 md:py-16 text-center text-stone-400">
        <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
        <span class="text-[10px] font-black uppercase tracking-widest">Loading logbooks...</span>
      </div>

      <div v-else-if="logbooks.length === 0" class="py-12 md:py-16 text-center text-stone-400">
        <i class="pi pi-inbox mb-2 text-3xl block"></i>
        <span class="text-[10px] font-black uppercase tracking-widest">No logbook records found for the active cohort.</span>
      </div>

      <template v-else>
        <div class="block md:hidden space-y-3 p-4 md:p-0">
          <div v-for="entry in logbooks" :key="entry.id" class="bg-stone-50 border border-stone-200 p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="min-w-0 flex-1">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ entry.studentName }}</div>
                <div class="text-[9px] font-bold text-stone-400 mt-0.5">{{ entry.studentMatric || 'No ID' }}</div>
              </div>
              <StatusBadge :status="entry.statusLabel" :positive="entry.statusLabel === 'Submitted'" />
            </div>
            <div class="flex items-center justify-between text-xs text-stone-500">
              <span class="font-black text-slate-800">Week {{ entry.weekNumber }}</span>
              <span class="font-bold tabular-nums">{{ entry.weekEndDate }}</span>
            </div>
            <div v-if="entry.isStale" class="mt-2 flex items-center gap-1 text-[9px] font-black text-amber-700 uppercase tracking-wider">
              <i class="pi pi-exclamation-triangle text-[10px]" /> Stale Record
            </div>
            <div class="mt-3 pt-3 border-t border-stone-200 flex items-center gap-2">
              <button
                v-if="!entry.isSubmitted"
                class="flex-1 h-9 bg-amber-400 text-slate-900 text-[8px] font-black uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1"
                :disabled="entry.isSendingReminder"
                @click="sendReminder(entry)"
              >
                <i class="pi pi-bell"></i>
                {{ entry.isSendingReminder ? '...' : 'Remind' }}
              </button>
              <button
                v-if="isSuperCoordinator"
                class="flex-1 h-9 bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider hover:brightness-150 transition-all flex items-center justify-center gap-1"
                :disabled="entry.isSubmitting"
                @click="markSubmitted(entry)"
              >
                <i class="pi pi-check"></i>
                {{ entry.isSubmitting ? '...' : 'Mark Done' }}
              </button>
            </div>
          </div>
        </div>

        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-xs font-semibold text-stone-500 uppercase tracking-wider bg-stone-50/50 border-b border-stone-200">
                <th class="px-8 py-6">Student</th>
                <th class="px-8 py-6">Week</th>
                <th class="px-8 py-6">End Date</th>
                <th class="px-8 py-6">Status</th>
                <th class="px-8 py-6 text-right">Submitted At</th>
                <th class="px-8 py-6 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-stone-100">
              <tr v-for="entry in logbooks" :key="entry.id" class="hover:bg-stone-50 transition-colors group">
                <td class="px-8 py-6">
                  <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ entry.studentName }}</div>
                  <div class="text-[9px] font-bold text-stone-400 mt-1">{{ entry.studentMatric || 'No ID' }}</div>
                </td>
                <td class="px-8 py-6 font-black text-slate-800 tracking-tighter text-xs">Week {{ entry.weekNumber }}</td>
                <td class="px-8 py-6 font-bold text-stone-500 tabular-nums text-xs">{{ entry.weekEndDate }}</td>
                <td class="px-8 py-6">
                  <StatusBadge :status="entry.statusLabel" :positive="entry.statusLabel === 'Submitted'" />
                  <div v-if="entry.isStale" class="mt-2 flex items-center gap-1 text-[9px] font-black text-amber-700 uppercase tracking-wider">
                    <i class="pi pi-exclamation-triangle text-[10px]" /> Stale Record
                  </div>
                </td>
                <td class="px-8 py-6 text-right text-stone-400 font-black tabular-nums text-[10px]">
                  {{ entry.submittedAt ? formatDate(entry.submittedAt) : '-' }}
                </td>
                <td class="px-8 py-6 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      v-if="!entry.isSubmitted"
                      class="h-8 px-3 bg-amber-400 text-slate-900 text-[8px] font-black uppercase tracking-wider hover:brightness-110 transition-all"
                      :disabled="entry.isSendingReminder"
                      @click="sendReminder(entry)"
                    >
                      <i class="pi pi-bell mr-1"></i>
                      {{ entry.isSendingReminder ? '...' : 'Remind' }}
                    </button>
                    <button
                      v-if="isSuperCoordinator"
                      class="h-8 px-3 bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider hover:brightness-150 transition-all"
                      :disabled="entry.isSubmitting"
                      @click="markSubmitted(entry)"
                    >
                      <i class="pi pi-check mr-1"></i>
                      {{ entry.isSubmitting ? '...' : 'Mark Done' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </article>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

import StatusBadge from '~/components/StatusBadge.vue'

import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

type LogbookEntry = {
  id: number
  studentId: string
  studentName: string
  studentMatric: string
  weekNumber: number
  weekEndDate: string
  isSubmitted: boolean
  submittedAt: string | null
  statusLabel: string
  isStale: boolean
  reminderSent: boolean
  isSendingReminder?: boolean
  isSubmitting?: boolean
}

const { isSuperCoordinator } = useCoordinatorPrivileges()

const logbooks = ref<LogbookEntry[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const statusFilter = ref('all')

watch(statusFilter, () => {
  void loadLogbooks()
})

const loadLogbooks = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const queryParams = new URLSearchParams()
    if (statusFilter.value !== 'all') {
      queryParams.set('status', statusFilter.value)
    }

    const data = await $fetch<LogbookEntry[]>(`/api/logbooks?${queryParams.toString()}`)
    logbooks.value = data || []
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load logbooks.'
  } finally {
    isLoading.value = false
  }
}

const sendReminder = async (entry: LogbookEntry) => {
  entry.isSendingReminder = true
  try {
    await $fetch(`/api/logbooks/${entry.id}/reminder`, { method: 'POST' })
    entry.reminderSent = true
  } catch (error: any) {
    alert('Failed to send reminder')
  } finally {
    entry.isSendingReminder = false
  }
}

const markSubmitted = async (entry: LogbookEntry) => {
  entry.isSubmitting = true
  try {
    await $fetch(`/api/logbooks/${entry.id}/submit`, { method: 'POST' })
    entry.isSubmitted = true
    entry.submittedAt = new Date().toISOString()
    entry.statusLabel = 'Submitted'
  } catch (error: any) {
    alert('Failed to mark as submitted')
  } finally {
    entry.isSubmitting = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

onMounted(async () => {
  await loadLogbooks()
})
</script>
