<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Weekly Logbook Status</h1>
      <p class="mt-1 text-slate-500">Monitor cohort logbook compliance and send reminders.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <article class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/50 p-5">
        <h2 class="text-lg font-semibold text-slate-900">Logbook Submissions</h2>

        <div class="flex items-center gap-3">
          <select
            v-model="statusFilter"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Not Submitted">Not Submitted</option>
            <option value="Late">Late</option>
          </select>

          <button
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            :disabled="isLoading"
            @click="loadLogbooks"
          >
            Refresh
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500">
              <th class="px-6 py-4 font-medium">Student</th>
              <th class="px-6 py-4 font-medium">Week</th>
              <th class="px-6 py-4 font-medium">End Date</th>
              <th class="px-6 py-4 font-medium">Status</th>
              <th class="px-6 py-4 font-medium text-right">Submitted At</th>
            </tr>
          </thead>
          
          <tbody v-if="isLoading">
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                <i class="pi pi-spin pi-spinner mr-2" />
                Loading logbooks...
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="logbooks.length === 0">
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                <i class="pi pi-inbox text-3xl mb-2"></i>
                <p>No logbook records found for the active cohort.</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="entry in logbooks" :key="entry.id" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ entry.studentName }}</div>
                <div class="text-xs text-slate-500 mt-1">{{ entry.studentMatric || 'No ID' }}</div>
              </td>
              <td class="px-6 py-4">Week {{ entry.weekNumber }}</td>
              <td class="px-6 py-4 text-slate-600">{{ entry.weekEndDate }}</td>
              <td class="px-6 py-4">
                <span v-if="entry.statusLabel === 'Submitted'" class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  Submitted
                </span>
                <span v-else-if="entry.statusLabel === 'Late'" class="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                  Late
                </span>
                <span v-else class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  Not Submitted
                </span>

                <div v-if="entry.isStale" class="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium" title="Record hasn't been updated in over 24 hours">
                  <i class="pi pi-exclamation-triangle text-[10px]"></i> Stale Record
                </div>
              </td>
              <td class="px-6 py-4 text-right text-slate-500">
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
