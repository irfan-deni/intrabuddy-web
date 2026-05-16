<template>
<<<<<<< HEAD
  <div class="p-8 lg:p-10">
    <header class="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-brand-blue">Dashboard</p>
        <h1 class="mt-2 text-4xl font-black tracking-tight text-brand-navy">Cohort Progress Overview</h1>
        <p class="mt-2 text-slate-500">
          Active Cohort: <span class="font-semibold text-brand-teal">{{ cohortName || 'Loading...' }}</span>
        </p>
      </div>
      <div class="rounded-2xl border border-brand-blue/10 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        Placement data is refreshed from Supabase active cohort records.
      </div>
=======
  <div class="p-8 space-y-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Cohort Progress Overview</h1>
      <p class="text-slate-500 mt-1">
        Active Cohort: <span class="font-semibold text-cyan-600">{{ cohortName || 'Loading...' }}</span>
      </p>
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
    </header>

    <div v-if="errorMessage" class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <div class="flex flex-col justify-between rounded-3xl border border-brand-blue/10 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div class="flex items-center gap-3 mb-2">
<<<<<<< HEAD
          <i class="pi pi-users text-brand-blue text-xl"></i>
          <h3 class="font-medium text-slate-500">Total Students</h3>
=======
          <i class="pi pi-users text-cyan-500 text-xl"></i>
          <h3 class="text-slate-500 font-medium">Total Students</h3>
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
        </div>
        <p class="text-4xl font-black text-brand-navy">{{ isLoading ? '-' : totalStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div class="mb-2 flex items-center gap-3">
          <i class="pi pi-briefcase text-emerald-500 text-xl"></i>
          <h3 class="font-medium text-slate-500">Placed</h3>
        </div>
        <p class="text-4xl font-black text-brand-navy">{{ isLoading ? '-' : placedStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div class="mb-2 flex items-center gap-3">
          <i class="pi pi-search text-amber-500 text-xl"></i>
          <h3 class="font-medium text-slate-500">Unplaced</h3>
        </div>
        <p class="text-4xl font-black text-brand-navy">{{ isLoading ? '-' : unplacedStudents }}</p>
      </div>

<<<<<<< HEAD
      <div class="flex flex-col justify-between rounded-3xl border border-brand-blue/15 bg-gradient-to-br from-brand-blue to-brand-teal p-6 text-white shadow-[0_18px_60px_rgba(30,79,216,0.24)]">
        <div class="mb-2 flex items-center gap-3">
          <i class="pi pi-chart-pie text-white text-xl"></i>
          <h3 class="font-medium text-white/90">Placement Rate</h3>
        </div>
        <p class="text-4xl font-black text-white">{{ isLoading ? '-' : placementPercentage + '%' }}</p>
=======
      <div class="flex flex-col justify-between rounded-xl border border-slate-100 bg-cyan-50 p-6 shadow-sm">
         <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-chart-pie text-cyan-600 text-xl"></i>
          <h3 class="text-cyan-800 font-medium">Milestone Status</h3>
        </div>
        <p class="text-4xl font-bold text-cyan-700">{{ isLoading ? '-' : placementPercentage + '%' }}</p>
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
      </div>
    </div>

    <!-- Weekly Logbook Status Section -->
    <section>
      <header class="mb-4">
        <h2 class="text-2xl font-bold text-slate-900">Weekly Logbook Status</h2>
        <p class="mt-1 text-slate-500">Monitor cohort logbook compliance and send reminders.</p>
      </header>

      <p v-if="logbooksErrorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ logbooksErrorMessage }}
      </p>

      <article class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/50 p-5">
          <h3 class="text-lg font-semibold text-slate-900">Logbook Submissions</h3>

          <div class="flex items-center gap-3">
            <select
              v-model="statusFilter"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Not Submitted">Not Submitted</option>
              <option value="Late">Late</option>
            </select>

            <button
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              :disabled="isLogbooksLoading"
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
            
            <tbody v-if="isLogbooksLoading">
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

type DashboardResponse = {
  cohortName: string
  totalStudents: number
  placedStudents: number
  unplacedStudents: number
  placementPercentage: number
}

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

const cohortName = ref('')
const totalStudents = ref(0)
const placedStudents = ref(0)
const unplacedStudents = ref(0)
const placementPercentage = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

const logbooks = ref<LogbookEntry[]>([])
const isLogbooksLoading = ref(false)
const logbooksErrorMessage = ref('')
const statusFilter = ref('all')

watch(statusFilter, () => {
  void loadLogbooks()
})

const fetchDashboardData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await $fetch<DashboardResponse>('/api/dashboard')
    cohortName.value = data.cohortName
    totalStudents.value = data.totalStudents
    placedStudents.value = data.placedStudents
    unplacedStudents.value = data.unplacedStudents
    placementPercentage.value = data.placementPercentage
  } catch (error: any) {
    const serverMessage = error.data?.statusMessage || error.data?.message
    errorMessage.value = serverMessage ? `Server Error: ${serverMessage}` : (error.message || 'Unable to load dashboard data.')
  } finally {
    isLoading.value = false
  }
}

const loadLogbooks = async () => {
  isLogbooksLoading.value = true
  logbooksErrorMessage.value = ''

  try {
    const queryParams = new URLSearchParams()
    if (statusFilter.value !== 'all') {
      queryParams.set('status', statusFilter.value)
    }

    const data = await $fetch<LogbookEntry[]>(`/api/logbooks?${queryParams.toString()}`)
    logbooks.value = data || []
  } catch (error: unknown) {
    logbooksErrorMessage.value = error instanceof Error ? error.message : 'Unable to load logbooks.'
  } finally {
    isLogbooksLoading.value = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

onMounted(async () => {
  await Promise.all([
    fetchDashboardData(),
    loadLogbooks()
  ])
})
</script>