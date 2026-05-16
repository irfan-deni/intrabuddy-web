<template>
  <div class="space-y-10">
    <header class="flex items-end justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p class="text-slate-500 mt-1.5 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          Active Cohort: <span class="font-semibold text-slate-700">{{ cohortName || 'Loading...' }}</span>
        </p>
      </div>
      <div class="hidden lg:block text-right">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Sync</p>
        <p class="text-sm font-medium text-slate-600">Just now</p>
      </div>
    </header>

    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-sm">
      <i class="pi pi-exclamation-circle text-lg"></i>
      {{ errorMessage }}
    </div>

    <!-- Modern Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <i class="pi pi-users text-xl"></i>
          </div>
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Students</h3>
        </div>
        <p class="text-4xl font-bold text-slate-900 tabular-nums">{{ isLoading ? '...' : totalStudents }}</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i class="pi pi-briefcase text-xl"></i>
          </div>
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Placed</h3>
        </div>
        <p class="text-4xl font-bold text-slate-900 tabular-nums">{{ isLoading ? '...' : placedStudents }}</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i class="pi pi-search text-xl"></i>
          </div>
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Unplaced</h3>
        </div>
        <p class="text-4xl font-bold text-slate-900 tabular-nums">{{ isLoading ? '...' : unplacedStudents }}</p>
      </div>

      <div class="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
            <i class="pi pi-chart-pie text-xl"></i>
          </div>
          <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Success Rate</h3>
        </div>
        <p class="text-4xl font-bold text-white tabular-nums">{{ isLoading ? '...' : placementPercentage + '%' }}</p>
      </div>
    </div>

    <!-- Weekly Logbook Section -->
    <section class="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div class="px-8 py-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Recent Activity</h2>
          <p class="text-sm text-slate-500">Weekly logbook submission status for all students.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <select v-model="statusFilter" class="text-sm border border-slate-200 rounded-xl px-4 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer">
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Not Submitted">Not Submitted</option>
            <option value="Late">Late</option>
          </select>
          <button 
            @click="loadLogbooks" 
            :disabled="isLogbooksLoading" 
            class="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500"
          >
            <i class="pi pi-refresh" :class="{ 'pi-spin': isLogbooksLoading }"></i>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <th class="px-8 py-4 font-bold">Student</th>
              <th class="px-8 py-4 font-bold">Period</th>
              <th class="px-8 py-4 font-bold">Compliance</th>
              <th class="px-8 py-4 font-bold text-right">Updated</th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLogbooksLoading">
              <td colspan="4" class="px-8 py-16 text-center text-slate-400">
                <div class="flex flex-col items-center gap-2">
                  <i class="pi pi-spin pi-spinner text-2xl"></i>
                  <span class="text-sm">Fetching latest logs...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="logbooks.length === 0">
              <td colspan="4" class="px-8 py-16 text-center text-slate-400">
                <i class="pi pi-inbox text-3xl mb-2"></i>
                <p class="text-sm">No activity found for this filter.</p>
              </td>
            </tr>
            <tr v-for="entry in logbooks" :key="entry.id" class="group hover:bg-slate-50/80 transition-colors">
              <td class="px-8 py-5">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{{ entry.studentName }}</span>
                  <span class="text-xs text-slate-500">{{ entry.studentMatric || '---' }}</span>
                </div>
              </td>
              <td class="px-8 py-5">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                  Week {{ entry.weekNumber }}
                </span>
              </td>
              <td class="px-8 py-5">
                <span :class="[
                  'px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
                  entry.statusLabel === 'Submitted' ? 'bg-emerald-100 text-emerald-700' : 
                  entry.statusLabel === 'Late' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                ]">
                  {{ entry.statusLabel }}
                </span>
              </td>
              <td class="px-8 py-5 text-right">
                <span class="text-xs font-medium text-slate-400 tabular-nums">
                  {{ entry.submittedAt ? formatDate(entry.submittedAt) : '---' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
    errorMessage.value = 'Failed to load dashboard data'
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
    logbooksErrorMessage.value = 'Failed to load activity logs'
  } finally {
    isLogbooksLoading.value = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await Promise.all([
    fetchDashboardData(),
    loadLogbooks()
  ])
})
</script>