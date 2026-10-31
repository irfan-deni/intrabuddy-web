<template>
  <div class="dashboard app-surface-ui space-y-6 md:space-y-8">
    <header class="dashboard-header flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 md:pb-8">
      <div>
        <h1 class="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p class="mt-2 text-sm font-normal leading-relaxed text-text-muted">Real-time overview of the active semester.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button
          :disabled="refreshing"
          class="rounded-control min-h-11 px-3 py-2 bg-slate-600 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 flex items-center gap-2"
          @click="fetchData(true)"
        >
          <i aria-hidden="true" :class="['pi pi-refresh', { 'pi-spin': refreshing }]"></i>
          Refresh
        </button>
        <button
          :disabled="isLoading || logbooksLoading || exporting"
          class="rounded-control min-h-11 px-3 py-2 bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 transition-colors flex items-center justify-center gap-2"
          @click="generatePDF"
        >
          <i aria-hidden="true" class="pi pi-file-pdf"></i>
          {{ exporting ? 'Generating report…' : 'Export Semester Report' }}
        </button>
      </div>
    </header>

    <p v-if="logbooksError" role="alert" class="text-sm text-rose-700">Unable to refresh dashboard data. Please try Refresh again.</p>

    <div class="dashboard-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div
        v-for="stat in stats" :key="stat.label"
        class="rounded-card bg-surface shadow-sm border"
        :class="[stat.borderClass, stat.to ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : '']"
        @click="stat.to ? navigateTo(stat.to) : undefined"
      >
        <div class="dashboard-stat-content p-4 md:p-6">
          <div class="dashboard-stat-label flex items-center gap-3 mb-2 md:mb-4">
            <div class="h-8 w-8 md:h-10 md:w-10 shrink-0 flex items-center justify-center rounded-lg" :class="stat.iconClass">
              <i :class="[stat.icon, 'text-xs md:text-sm']"></i>
            </div>
            <span class="text-sm font-medium leading-relaxed text-text-muted">{{ stat.label }}</span>
          </div>
          <p class="dashboard-stat-value text-2xl md:text-4xl font-bold text-slate-800 tabular-nums tracking-tight">
            {{ isLoading ? '...' : stat.value }}
          </p>
        </div>
      </div>
    </div>

    <div class="dashboard-overview grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card class="rounded-card lg:col-span-2 bg-surface shadow-sm border border-surface-border">
        <template #content>
          <div class="dashboard-placement p-4 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div class="dashboard-placement-chart relative w-36 h-36 md:w-48 md:h-48 flex-shrink-0">
              <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-surface-border" stroke-width="3"></circle>
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-sky-600" stroke-width="3" stroke-dasharray="100" :stroke-dashoffset="100 - (placementPercentage || 0)" stroke-linecap="round"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold text-slate-800 tabular-nums">{{ placementPercentage }}%</span>
                <span class="text-sm font-medium leading-relaxed text-text-muted">Placed</span>
              </div>
            </div>
            <div class="dashboard-placement-details flex-1 space-y-6">
              <h2 class="dashboard-section-heading text-lg font-semibold text-slate-800">Placement Status</h2>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg bg-sky-50 px-3 py-2">
                  <p class="text-sm font-medium leading-relaxed text-sky-800">Placed</p>
                  <p class="text-xl font-bold text-slate-800 tabular-nums">{{ placedStudents }}</p>
                </div>
                <div class="rounded-lg bg-slate-100 px-3 py-2">
                  <p class="text-sm font-medium leading-relaxed text-text-muted">Still searching</p>
                  <p class="text-xl font-bold text-slate-800 tabular-nums">{{ unplacedStudents }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="rounded-card bg-slate-800 text-white shadow-sm border border-slate-800">
        <template #content>
          <div class="dashboard-semester p-6 flex flex-col justify-center h-full min-h-[180px] md:min-h-[200px]">
            <div>
              <p class="text-sm font-medium leading-relaxed text-slate-300 mb-4">Semester Control</p>
              <h3 class="text-2xl font-bold leading-tight">
                Active:<br>{{ semesterName || 'Scanning...' }}
              </h3>
            </div>
            <NuxtLink to="/communications" class="inline-flex items-center gap-2 mt-6 text-sky-400 hover:text-sky-300 transition-colors text-sm font-semibold">
              <span>Dispatch Alert</span>
              <i class="pi pi-arrow-right text-xs"></i>
            </NuxtLink>
          </div>
        </template>
      </Card>
    </div>

      <Card class="rounded-card bg-surface shadow-sm border border-surface-border">
      <template #content>
        <div class="dashboard-logbooks p-4 md:p-8">
          <h2 class="dashboard-section-heading text-lg font-semibold text-slate-800 mb-6 md:mb-8">Logbook Status Summary</h2>

          <div v-if="logbooksLoading" role="status" class="animate-pulse py-12 md:py-16 text-center text-sm leading-relaxed text-text-muted">Loading logbook summary…</div>
          <div v-else-if="logbooksError" role="alert" class="py-12 text-center text-sm text-rose-700">Unable to load logbook summary. Please refresh to try again.</div>
          <div v-else-if="totalExpected === 0" class="text-center py-12 md:py-16 text-sm leading-relaxed text-text-muted">No activity data available</div>

          <template v-else>
            <div class="flex items-end justify-between gap-4 mb-2">
              <div>
                <span class="text-sm font-medium leading-relaxed text-text-muted">Compliance</span>
                <p class="text-xs text-text-muted">{{ totalSubmitted }} / {{ totalExpected }} this week</p>
              </div>
              <span class="text-3xl font-bold text-slate-800 tabular-nums">{{ complianceRate }}%</span>
            </div>

            <div class="dashboard-compliance-bar w-full bg-surface-border rounded-full h-4 mt-4 mb-4 overflow-hidden flex">
              <div class="h-full bg-emerald-500 transition-all duration-1000" :style="{ width: submittedPercent + '%' }"></div>
              <div class="h-full bg-amber-600 transition-all duration-1000" :style="{ width: latePercent + '%' }"></div>
              <div class="h-full bg-surface-border transition-all duration-1000" :style="{ width: pendingPercent + '%' }"></div>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-3">
              <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-emerald-50 px-3 py-2">
                <p class="flex items-center gap-1.5 text-xs font-medium text-emerald-800"><span aria-hidden="true" class="h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>Submitted</p>
                <p class="text-xl font-bold leading-none tabular-nums text-slate-800">{{ totalSubmitted }}</p>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-slate-100 px-3 py-2">
                <p class="flex items-center gap-1.5 text-xs font-medium text-amber-800"><span aria-hidden="true" class="h-2 w-2 shrink-0 rounded-full bg-amber-600"></span>Overdue</p>
                <p class="text-xl font-bold leading-none tabular-nums text-slate-800">{{ totalLate }}</p>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-slate-100 px-3 py-2">
                <p class="flex items-center gap-1.5 text-xs font-medium text-slate-600"><span aria-hidden="true" class="h-2 w-2 shrink-0 rounded-full bg-slate-400"></span>Pending</p>
                <p class="text-xl font-bold leading-none tabular-nums text-slate-800">{{ totalPending }}</p>
              </div>
            </div>
          </template>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'
import { generateSemesterReport } from '~/utils/semesterReport'
import type { ReportLogbook, ReportStudent } from '~/utils/semesterReport'
import type { DashboardResponse, LogbookSummary } from '~/types/dashboard'

definePageMeta({
  requiredRole: 'coordinator'
})

const pageCache = usePageCache()
const cachedDashboard = pageCache.read<DashboardResponse>('/api/dashboard')
const cachedLogbooks = cachedDashboard?.logbookSummary
const semesterName = ref(cachedDashboard?.semesterName || '')
const totalStudents = ref(cachedDashboard?.totalStudents || 0)
const placedStudents = ref(cachedDashboard?.placedStudents || 0)
const unplacedStudents = ref(cachedDashboard?.unplacedStudents || 0)
const placementPercentage = ref(cachedDashboard?.placementPercentage || 0)
const isLoading = ref(!cachedDashboard)
const logbooksLoading = ref(!cachedLogbooks)
const logbooksError = ref(false)
const exporting = ref(false)
const refreshing = ref(false)

const logbookSummary = ref<LogbookSummary>(cachedLogbooks || { total: 0, submitted: 0, late: 0, pending: 0 })

const totalExpected = computed(() => logbookSummary.value.total)

const totalSubmitted = computed(() =>
  logbookSummary.value.submitted
)

const totalLate = computed(() =>
  logbookSummary.value.late
)

const totalPending = computed(() =>
  logbookSummary.value.pending
)

const complianceRate = computed(() =>
  totalExpected.value > 0 ? Math.round((totalSubmitted.value / totalExpected.value) * 100) : 0
)

const submittedPercent = computed(() =>
  totalExpected.value > 0 ? Math.round((totalSubmitted.value / totalExpected.value) * 100) : 0
)

const latePercent = computed(() =>
  totalExpected.value > 0 ? Math.round((totalLate.value / totalExpected.value) * 100) : 0
)

const pendingPercent = computed(() =>
  totalExpected.value > 0 ? Math.round((totalPending.value / totalExpected.value) * 100) : 0
)

const stats = computed(() => [
  { label: 'Total Students', value: totalStudents.value, icon: 'pi pi-users', to: '/students', borderClass: 'border-sky-200', iconClass: 'bg-sky-100 text-sky-800' },
  { label: 'Placed', value: placedStudents.value, icon: 'pi pi-check-circle', to: '/students?status=Accepted', borderClass: 'border-emerald-200', iconClass: 'bg-emerald-100 text-emerald-800' },
  { label: 'Unplaced', value: unplacedStudents.value, icon: 'pi pi-search', to: '/students?status=unplaced', borderClass: 'border-amber-200', iconClass: 'bg-amber-100 text-amber-800' },
  { label: 'Placement Rate', value: placementPercentage.value + '%', icon: 'pi pi-chart-line', borderClass: 'border-violet-200', iconClass: 'bg-violet-100 text-violet-800' }
])

const fetchData = async (force = false) => {
  refreshing.value = true
  logbooksError.value = false
  try {
    const dash = await pageCache.fetch<DashboardResponse>('/api/dashboard', { force })
    semesterName.value = dash.semesterName
    totalStudents.value = dash.totalStudents
    placedStudents.value = dash.placedStudents
    unplacedStudents.value = dash.unplacedStudents
    placementPercentage.value = dash.placementPercentage
    logbookSummary.value = dash.logbookSummary
  } catch {
    logbooksError.value = true
  } finally {
    isLoading.value = false
    logbooksLoading.value = false
    refreshing.value = false
  }
}

const generatePDF = async () => {
  exporting.value = true
  try {
    // Fetch fresh records rather than mixing cached dashboard totals with export details.
    const [dashboard, directory, logbooks] = await Promise.all([
      $fetch<DashboardResponse>('/api/dashboard'),
      $fetch<{ students: ReportStudent[] }>('/api/students'),
      $fetch<ReportLogbook[]>('/api/logbooks')
    ])
    await generateSemesterReport(dashboard.semesterName || 'N/A', directory.students, logbooks)
  } catch {
    alert('Unable to export the report. Please try again.')
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
/* Keep dashboard headings readable without changing the global heading rules. */
.dashboard-section-heading {
  font-weight: 600 !important;
  letter-spacing: normal !important;
}

/* Fit the desktop overview without hiding content or shrinking readable labels. */
@media (min-width: 1024px) {
  .dashboard {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .dashboard > :not([hidden]) ~ :not([hidden]) {
    margin-top: 1rem;
  }

  .dashboard-header {
    padding-bottom: 0;
    gap: 1rem;
  }

  .dashboard-header h1 {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .dashboard-stats,
  .dashboard-overview {
    gap: 1rem;
  }

  .dashboard-overview,
  .dashboard > .p-card {
    flex-grow: 1;
  }

  .dashboard-stat-content,
  .dashboard-placement,
  .dashboard-semester,
  .dashboard-logbooks {
    padding: 1rem 1.25rem;
  }

  .dashboard-stat-label {
    margin-bottom: 0.5rem;
  }

  .dashboard-stat-label > div {
    width: 2rem;
    height: 2rem;
  }

  .dashboard-stat-value {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .dashboard-placement {
    gap: 1.5rem;
    height: 100%;
  }

  .dashboard-overview :deep(.p-card-body),
  .dashboard-overview :deep(.p-card-content),
  .dashboard > .p-card :deep(.p-card-body),
  .dashboard > .p-card :deep(.p-card-content) {
    height: 100%;
  }

  .dashboard-placement-chart {
    width: 8rem;
    height: 8rem;
  }

  .dashboard-placement-details > :not([hidden]) ~ :not([hidden]) {
    margin-top: 1rem;
  }

  .dashboard-semester {
    min-height: 10rem;
  }

  .dashboard-semester a {
    margin-top: 1rem;
  }

  .dashboard-logbooks h2 {
    margin-bottom: 0.75rem;
  }

  .dashboard-logbooks {
    height: 100%;
  }

  .dashboard-compliance-bar {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .dashboard-logbooks > [role='status'],
  .dashboard-logbooks > [role='alert'],
  .dashboard-logbooks > .text-center {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
  }
}

/* Use the extra vertical room on taller desktops instead of staying compressed. */
@media (min-width: 1024px) and (min-height: 850px) {
  .dashboard > :not([hidden]) ~ :not([hidden]) {
    margin-top: 1.25rem;
  }

  .dashboard-stats,
  .dashboard-overview {
    gap: 1.25rem;
  }

  .dashboard-stat-content,
  .dashboard-placement,
  .dashboard-semester,
  .dashboard-logbooks {
    padding: 1.25rem;
  }

  .dashboard-logbooks h2 {
    margin-bottom: 1rem;
  }

  .dashboard-compliance-bar {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }
}
</style>
