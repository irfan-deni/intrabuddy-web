<template>
  <section class="space-y-8">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
      <div>
        <h1 class="text-4xl font-black text-brand-navy tracking-tight uppercase">Logbook Review</h1>
        <p class="text-text-muted mt-2 font-bold uppercase text-[10px] tracking-widest">Monitor cohort logbook compliance and send reminders.</p>
      </div>
    </header>

    <p v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </p>

    <article class="bg-white border border-slate-100 shadow-sm relative">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-6">
        <h2 class="text-[11px] font-black text-brand-navy uppercase tracking-[0.2em]">Logbook Submissions</h2>

        <div class="flex items-center gap-4">
          <select
            v-model="statusFilter"
            class="text-[10px] font-black border border-slate-100 rounded-none px-4 py-2 bg-white uppercase tracking-widest outline-none focus:border-brand-cyan transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Not Submitted">Not Submitted</option>
            <option value="Late">Late</option>
          </select>

          <button
            class="h-8 px-4 bg-brand-navy text-white text-[9px] font-black uppercase tracking-widest hover:brightness-150 transition-all"
            :disabled="isLoading"
            @click="loadLogbooks"
          >
            Refresh
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[9px] font-black text-text-veryMuted uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
              <th class="px-8 py-6">Student</th>
              <th class="px-8 py-6">Week</th>
              <th class="px-8 py-6">End Date</th>
              <th class="px-8 py-6">Status</th>
              <th class="px-8 py-6 text-right">Submitted At</th>
            </tr>
          </thead>
          
          <tbody class="text-xs divide-y divide-slate-50">
            <tr v-if="isLoading">
              <td colspan="5" class="px-8 py-16 text-center text-text-veryMuted">
                <i class="pi pi-spin pi-spinner text-xl text-brand-cyan mr-2" />
                <span class="text-[10px] font-black uppercase tracking-widest">Loading logbooks...</span>
              </td>
            </tr>

            <tr v-else-if="logbooks.length === 0">
              <td colspan="5" class="px-8 py-16 text-center text-text-veryMuted">
                <i class="pi pi-inbox mb-2 text-3xl block"></i>
                <span class="text-[10px] font-black uppercase tracking-widest">No logbook records found for the active cohort.</span>
              </td>
            </tr>

            <tr v-for="entry in logbooks" :key="entry.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-8 py-6">
                <div class="font-black text-brand-navy uppercase tracking-tight">{{ entry.studentName }}</div>
                <div class="text-[9px] font-bold text-text-veryMuted mt-1">{{ entry.studentMatric || 'No ID' }}</div>
              </td>
              <td class="px-8 py-6 font-black text-brand-navy tracking-tighter">Week {{ entry.weekNumber }}</td>
              <td class="px-8 py-6 font-bold text-text-muted tabular-nums">{{ entry.weekEndDate }}</td>
              <td class="px-8 py-6">
                <StatusBadge :status="entry.statusLabel" :positive="entry.statusLabel === 'Submitted'" />

                <div v-if="entry.isStale" class="mt-2 flex items-center gap-1 text-[9px] font-black text-amber-700 uppercase tracking-wider">
                  <i class="pi pi-exclamation-triangle text-[10px]" /> Stale Record
                </div>
              </td>
              <td class="px-8 py-6 text-right text-text-veryMuted font-black tabular-nums text-[10px]">
                {{ entry.submittedAt ? formatDate(entry.submittedAt) : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

import StatusBadge from '~/components/StatusBadge.vue'

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
}

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
