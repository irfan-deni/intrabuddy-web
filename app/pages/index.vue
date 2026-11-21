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
        class="rounded-card relative overflow-hidden shadow-sm border"
        :class="[stat.label === 'Unplaced' && !isLoading && !logbooksError && unplacedStudents > 0 ? 'border-amber-400 bg-amber-50 shadow-[inset_4px_0_0_0_#d97706]' : `${stat.borderClass} bg-surface`, stat.to ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : '']"
        @click="stat.to ? navigateTo(stat.to) : undefined"
      >
        <div aria-hidden="true" class="pointer-events-none absolute right-3 top-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-current opacity-[0.16]" :class="stat.iconClass">
          <i :class="[stat.icon, 'text-2xl']"></i>
        </div>
        <div class="dashboard-stat-content relative p-4 pr-20 md:p-6 md:pr-20">
          <div class="dashboard-stat-label flex items-center gap-3 mb-2 md:mb-4">
            <div class="h-8 w-8 md:h-10 md:w-10 shrink-0 flex items-center justify-center rounded-lg" :class="stat.iconClass">
              <i :class="[stat.icon, 'text-xs md:text-sm']"></i>
            </div>
            <span class="text-sm font-medium leading-relaxed text-text-muted">{{ stat.label }}</span>
          </div>
          <p class="dashboard-stat-value text-2xl md:text-4xl font-bold text-slate-800 tabular-nums tracking-tight">
            {{ isLoading ? '...' : stat.value }}
          </p>
          <p v-if="stat.label === 'Unplaced' && !isLoading && !logbooksError && unplacedStudents > 0" class="mt-1 text-xs font-semibold text-amber-800">Needs follow-up</p>
        </div>
      </div>
    </div>

    <div class="dashboard-overview grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card class="rounded-card bg-surface shadow-sm border border-surface-border">
        <template #content>
          <div class="dashboard-placement relative overflow-hidden p-4 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <svg aria-hidden="true" viewBox="0 0 240 150" class="pointer-events-none absolute bottom-0 right-0 hidden h-36 w-60 text-emerald-700 opacity-[0.12] xl:block" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 139h224M147 139V41l40-22 40 22v98M158 139V54h58v85M179 139v-25h18v25" />
              <path d="M169 65h8v9h-8zM197 65h8v9h-8zM169 86h8v9h-8zM197 86h8v9h-8zM28 139v-23l22-12 22 12v23" />
              <circle cx="105" cy="92" r="9" />
              <path d="M96 139v-26c0-6 4-11 9-11s9 5 9 11v26M96 115l-10 12M114 115l10 10M116 128h16v11h-16zM122 128v-4h5v4M74 72h40m-8-7 8 7-8 7" />
            </svg>
            <div v-if="!isLoading && !logbooksError && totalStudents > 0" class="dashboard-placement-chart relative order-last w-36 h-36 md:w-48 md:h-48 flex-shrink-0">
              <div aria-hidden="true" class="pointer-events-none absolute -inset-3 rounded-full bg-emerald-50/70 ring-1 ring-emerald-100"></div>
              <div aria-hidden="true" class="pointer-events-none absolute inset-2 rounded-full ring-1 ring-emerald-100/80"></div>
              <svg aria-hidden="true" viewBox="0 0 36 36" class="relative w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-surface-border" stroke-width="3"></circle>
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-emerald-600" stroke-width="3" stroke-dasharray="100" :stroke-dashoffset="100 - (placementPercentage || 0)" stroke-linecap="round"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold text-slate-800 tabular-nums">{{ placementPercentage }}%</span>
                <span class="text-sm font-medium leading-relaxed text-text-muted">Placed</span>
              </div>
            </div>
            <div class="dashboard-placement-details relative w-full min-w-0 flex-1 space-y-6">
              <h2 class="dashboard-section-heading text-lg font-semibold text-slate-800">Placement Status</h2>
              <p v-if="isLoading" role="status" class="text-sm text-text-muted">Loading placement data…</p>
              <p v-else-if="logbooksError" class="text-sm text-text-muted">Placement data is unavailable. Please refresh to try again.</p>
              <p v-else-if="totalStudents === 0" class="text-sm text-text-muted">No students in the active semester yet.</p>
              <div v-else class="space-y-3">
                <p class="text-base font-semibold text-slate-800 tabular-nums">{{ placedStudents }} of {{ totalStudents }} students placed</p>
                <p v-if="unplacedStudents > 0" class="text-sm font-medium text-amber-800 tabular-nums">Needs follow-up: {{ unplacedStudents }} unplaced</p>
                <p v-else class="text-sm font-medium text-emerald-700">All students are placed</p>
              </div>
              <NuxtLink :to="!isLoading && !logbooksError && unplacedStudents > 0 ? '/students?status=unplaced' : '/students'" class="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">
                {{ !isLoading && !logbooksError && unplacedStudents > 0 ? 'View unplaced students' : 'View students' }} <i aria-hidden="true" class="pi pi-arrow-right text-xs"></i>
              </NuxtLink>
            </div>
          </div>
        </template>
      </Card>

      <Card class="rounded-card bg-slate-800 text-white shadow-sm border border-slate-800">
        <template #content>
          <div class="dashboard-semester p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 h-full min-h-[180px] md:min-h-[200px]">
            <div class="min-w-0">
              <p class="text-sm font-medium leading-relaxed text-slate-300 mb-4">Semester Control</p>
              <h3 class="text-2xl font-bold leading-tight">
                Active:<br>{{ semesterName || 'Scanning...' }}
              </h3>
              <div v-if="activeSemester" class="mt-3 space-y-1 text-sm text-slate-300">
                <p>{{ semesterPeriod(activeSemester.start_date, activeSemester.end_date) }}</p>
                <p>Registration: <span class="font-semibold text-white">{{ activeSemester.registration_open ? 'Open' : 'Closed' }}</span></p>
              </div>
              <p v-else-if="semesterDetailsError" class="mt-3 text-sm text-slate-300">Semester details unavailable.</p>
            </div>
            <div class="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              <NuxtLink to="/semesters" class="inline-flex items-center gap-2 text-sky-300 hover:text-white hover:underline transition-colors text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
                View semesters <i aria-hidden="true" class="pi pi-arrow-right text-xs"></i>
              </NuxtLink>
              <NuxtLink to="/students" class="inline-flex items-center gap-2 text-sky-300 hover:text-white hover:underline transition-colors text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
                View students <i aria-hidden="true" class="pi pi-arrow-right text-xs"></i>
              </NuxtLink>
            </div>
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
type ActiveSemester = { is_active: boolean; start_date: string | null; end_date: string | null; registration_open: boolean }
const activeSemester = ref<ActiveSemester | null>(null)
const semesterDetailsError = ref(false)

const semesterPeriod = (start: string | null, end: string | null) => {
  const format = (date: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))
  if (!start && !end) return 'Dates not set'
  if (!start) return `Until ${format(end!)}`
  if (!end) return `From ${format(start)}`
  return `${format(start)} – ${format(end)}`
}

const fetchSemesterDetails = async () => {
  try {
    const data = await $fetch<{ semesters: ActiveSemester[] }>('/api/semesters')
    activeSemester.value = data.semesters.find(semester => semester.is_active) || null
    semesterDetailsError.value = false
  } catch {
    activeSemester.value = null
    semesterDetailsError.value = true
  }
}

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
  void fetchSemesterDetails()
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

  .dashboard-overview {
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

  .dashboard-logbooks h2 {
    margin-bottom: 0.75rem;
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
