<template>
  <div class="dashboard app-surface-ui flex grow flex-col gap-4 md:gap-5">
    <header class="dashboard-hero grid gap-x-5 gap-y-3 rounded-card px-4 py-4 text-white shadow-sm sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:py-5">
      <div class="dashboard-hero-copy min-w-0">
        <p class="text-xs font-semibold text-teal-200">Internship coordination</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Dashboard</h1>
        <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-100">
          <p v-if="loading" role="status">Loading active semester…</p>
          <p v-else-if="dashboard?.semester" class="flex w-full flex-col gap-y-0.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
            <span class="font-semibold text-white">{{ dashboard.semesterName }}</span>
            <span>{{ dateRange(dashboard.semester.startDate, dashboard.semester.endDate) }}</span>
          </p>
          <p v-else-if="!error">No active semester</p>
          <span v-if="dashboard?.semester" class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="dashboard.semester.registrationOpen ? 'bg-teal-100 text-teal-950' : 'bg-slate-200 text-slate-800'">
            Registration {{ dashboard.semester.registrationOpen ? 'open' : 'closed' }}
          </span>
          <NuxtLink to="/semesters" class="dashboard-hero-link">Manage semester <i aria-hidden="true" class="pi pi-arrow-right text-xs" /></NuxtLink>
        </div>
      </div>
      <div aria-hidden="true" class="dashboard-hero-art pointer-events-none relative hidden self-stretch">
        <DashboardSemesterArt class="absolute inset-0 h-full w-full" />
      </div>
      <div class="dashboard-hero-actions flex flex-wrap items-start gap-2 border-t border-white/15 pt-3 md:justify-end md:border-0 md:pt-0">
        <button type="button" :disabled="refreshing" class="dashboard-button" @click="fetchData(true)">
          <i aria-hidden="true" :class="['pi pi-refresh', { 'pi-spin': refreshing }]"></i>
          Refresh
        </button>
        <button type="button" :disabled="!dashboard?.semester || refreshing || exporting || error" class="dashboard-button" @click="generatePDF">
          <i aria-hidden="true" class="pi pi-file-pdf"></i>
          {{ exporting ? 'Generating report…' : 'Export Semester Report' }}
        </button>
      </div>
    </header>

    <p v-if="error" role="alert" class="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {{ dashboard ? 'Unable to refresh. Showing the last loaded dashboard.' : 'Unable to load the dashboard. Please try Refresh again.' }}
    </p>
    <p v-if="exportError" role="alert" class="text-sm text-rose-800">Unable to export the report. Please try again.</p>

    <div v-if="loading" class="rounded-card border border-surface-border bg-surface p-5 text-sm text-text-muted" role="status">Loading dashboard data…</div>
    <div v-else-if="dashboard && !dashboard.semester" class="rounded-card border border-surface-border bg-surface p-5 text-sm text-text-muted">
      Set an active semester to see placements, follow-up items, and logbook submissions.
    </div>

    <template v-else-if="dashboard?.semester">
      <section aria-labelledby="placement-heading">
        <h2 id="placement-heading" class="dashboard-section-heading mb-3">Placement overview</h2>
        <div class="grid gap-3 sm:grid-cols-3">
          <NuxtLink v-for="stat in placementStats" :key="stat.label" :to="stat.to"
            class="dashboard-stat group flex items-center gap-3 rounded-card border bg-surface p-3 shadow-sm transition-colors hover:bg-surface-muted md:p-4"
            :class="stat.border">
            <span aria-hidden="true" class="grid h-10 w-10 shrink-0 place-items-center rounded-lg md:h-12 md:w-12" :class="stat.tint">
              <i :class="['pi', stat.icon]" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-text-muted">{{ stat.label }}</span>
              <span class="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                <strong class="text-3xl font-bold tabular-nums leading-tight text-slate-800">{{ stat.value }}</strong>
                <span v-if="stat.detail" class="text-xs font-medium text-text-muted sm:text-sm">{{ stat.detail }}</span>
              </span>
              <span v-if="stat.progress != null" aria-hidden="true" class="placement-progress mt-2 block h-1.5 overflow-hidden rounded-full bg-teal-100">
                <span class="block h-full rounded-full bg-teal-600" :style="{ width: `${stat.progress}%` }" />
              </span>
            </span>
            <i aria-hidden="true" class="pi pi-arrow-up-right hidden shrink-0 text-xs text-sky-700 group-hover:text-sky-900 lg:block" />
          </NuxtLink>
        </div>
      </section>

      <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16.5rem,1fr)] lg:items-stretch">
        <section aria-labelledby="attention-heading" class="dashboard-panel dashboard-attention rounded-card lg:col-start-2 lg:row-start-1">
          <div class="flex items-center gap-3">
            <span aria-hidden="true" class="grid h-9 w-9 place-items-center rounded-lg bg-violet-100 text-violet-800"><i class="pi pi-inbox" /></span>
            <h2 id="attention-heading" class="dashboard-section-heading">Needs attention</h2>
          </div>
          <div v-if="attentionGroups.length" class="mt-3 divide-y divide-surface-border border-t border-surface-border">
            <div v-for="group in attentionGroups" :key="group.id">
              <h3 v-if="group.heading" class="px-2 pt-2 text-xs font-semibold text-text-muted">{{ group.heading }}</h3>
              <ul class="divide-y divide-surface-border">
                <li v-for="item in group.items" :key="item.to">
                  <NuxtLink :to="item.to" :aria-label="item.unit === 'logbook' ? `${item.label}: ${item.count} ${item.count === 1 ? 'logbook' : 'logbooks'}` : undefined"
                    class="dashboard-action group flex min-h-12 items-center gap-2.5 rounded-control px-2 py-2 text-sm hover:bg-white">
                    <span class="flex-1 font-medium text-slate-800 group-hover:underline">{{ item.label }}</span>
                    <span class="min-w-8 shrink-0 whitespace-nowrap rounded-md px-1.5 py-1 text-center font-semibold tabular-nums" :class="item.urgent ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'">{{ item.count }}{{ item.unit === 'student' ? (item.count === 1 ? ' student' : ' students') : '' }}</span>
                    <i aria-hidden="true" class="pi pi-arrow-right shrink-0 text-xs text-sky-700" />
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
          <p v-else-if="dashboard.reviewQueue?.count !== null" class="mt-4 flex items-center gap-2 border-t border-surface-border pt-3 text-sm font-medium text-emerald-800">
            <i aria-hidden="true" class="pi pi-check-circle" />
            You’re all caught up.
          </p>
          <p v-if="dashboard.reviewQueue?.count === null" class="mt-3 text-sm text-rose-800">Logbook review count is unavailable.</p>
        </section>

        <section aria-labelledby="logbooks-heading" class="dashboard-panel rounded-card lg:col-start-1 lg:row-start-1">
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div class="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-800"><i class="pi pi-chart-bar" /></span>
              <div>
                <h2 id="logbooks-heading" class="dashboard-section-heading">Weekly logbooks</h2>
                <p v-if="!trend.length && weekly?.weekEnd" class="mt-0.5 text-sm text-text-muted">
                  {{ dateRange(weekly.weekStart, weekly.weekEnd) }}
                </p>
              </div>
            </div>
            <NuxtLink :to="weeklyLogbooksLink" class="dashboard-link">
              {{ weekly?.weekEnd ? 'View this week' : 'View logbooks' }}
              <i aria-hidden="true" class="pi pi-arrow-right text-xs" />
            </NuxtLink>
          </div>
          <DashboardLogbookChart v-if="trend.length" class="mt-3 border-t border-surface-border pt-2" :weeks="trend" :current-week="weekly?.weekEnd ?? null" />
          <div v-else-if="weekly?.weekEnd" class="mt-3 space-y-2">
            <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p class="text-sm text-text-muted">
                <span class="text-xl font-bold tabular-nums text-slate-800">{{ weekly.submitted }} / {{ weekly.total }}</span> submitted
              </p>
              <p v-if="weekly.pending > 0" class="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-sky-900">
                {{ weekly.pending }} not yet due
              </p>
            </div>
            <div role="progressbar" aria-label="Weekly logbooks submitted" :aria-valuemax="weekly.total"
              :aria-valuenow="weekly.submitted" :aria-valuetext="`${weekly.submitted} of ${weekly.total} submitted`"
              class="h-2.5 overflow-hidden rounded-full bg-sky-100">
              <div class="h-full rounded-full bg-teal-600" :style="{ width: `${weeklySubmissionPercent}%` }" />
            </div>
          </div>
          <div v-else class="mt-3 flex items-center gap-2.5 text-sm text-text-muted">
            <span aria-hidden="true" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <i class="pi pi-calendar" />
            </span>
            <p>No logbooks due this week.</p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { generateSemesterReport, type ReportLogbook, type ReportStudent } from '~/utils/semesterReport'
import type { DashboardResponse } from '~/types/dashboard'

definePageMeta({ requiredRole: 'coordinator' })

const pageCache = usePageCache()
const url = '/api/dashboard'
const dashboard = ref(pageCache.read<DashboardResponse>(url))
const activeSemesterName = useState<string | null>('active-semester-name', () => null)
watch(dashboard, (data) => {
  if (data) activeSemesterName.value = data.semester ? data.semesterName : ''
}, { immediate: true })
const loading = ref(!dashboard.value)
const refreshing = ref(false)
const exporting = ref(false)
const error = ref(false)
const exportError = ref(false)

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const dateRange = (start: string | null, end: string | null) => {
  if (start && end) return dateFormat.formatRange(new Date(start), new Date(end))
  if (start) return `From ${dateFormat.format(new Date(start))}`
  if (end) return `Until ${dateFormat.format(new Date(end))}`
  return 'Dates not set'
}

const placementStats = computed(() => {
  const data = dashboard.value
  if (!data) return []
  return [
    { label: 'Enrolled students', value: data.totalStudents, to: '/students', icon: 'pi-users', tint: 'bg-sky-100 text-sky-800', border: 'border-sky-200' },
    { label: 'Confirmed placements', value: data.placedStudents, to: '/students?status=Accepted', icon: 'pi-check-circle', tint: 'bg-teal-100 text-teal-800', border: 'border-teal-200',
      progress: data.placementPercentage,
      detail: data.placementPercentage === null ? '' : `${data.placementPercentage}% of enrolled` },
    { label: 'Needs placement follow-up', value: data.unplacedStudents, to: '/students?status=unplaced', icon: 'pi-search',
      tint: data.unplacedStudents > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700',
      detail: data.unplacedStudents > 0 ? 'No accepted placement' : '',
      border: data.unplacedStudents > 0 ? 'border-amber-400' : 'border-surface-border' }
  ]
})

const attentionGroups = computed(() => {
  const data = dashboard.value
  if (!data) return []
  return [
    {
      id: 'logbooks', heading: 'Logbooks',
      items: [
        { label: 'Overdue', count: data.overdueLogbooks, to: '/logbooks?status=Late', urgent: true, unit: 'logbook' },
        { label: 'Awaiting review', count: data.reviewQueue?.count ?? 0, to: '/logbooks?review=awaiting', urgent: false, unit: 'logbook' }
      ].filter(item => item.count > 0)
    },
    {
      id: 'checklists',
      items: [
        { label: 'Incomplete checklists', count: data.studentsMissingChecklists, to: '/students?checklist=missing', urgent: false, unit: 'student' }
      ].filter(item => item.count > 0)
    }
  ].filter(group => group.items.length > 0)
})

const weekly = computed(() => dashboard.value?.logbookSummary)
const weeklySubmissionPercent = computed(() => {
  const summary = weekly.value
  return summary?.total ? (summary.submitted / summary.total) * 100 : 0
})
const trend = computed(() => dashboard.value?.logbookTrend ?? [])
const weeklyLogbooksLink = computed(() => weekly.value?.weekEnd
  ? { path: '/logbooks', query: { week_end: weekly.value.weekEnd } }
  : '/logbooks')

const fetchData = async (force = false) => {
  refreshing.value = true
  error.value = false
  try {
    dashboard.value = await pageCache.fetch<DashboardResponse>(url, { force })
  } catch {
    error.value = true
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const generatePDF = async () => {
  exporting.value = true
  exportError.value = false
  try {
    const [summary, directory, logbooks] = await Promise.all([
      $fetch<DashboardResponse>(url),
      $fetch<{ students: ReportStudent[] }>('/api/students'),
      $fetch<ReportLogbook[]>('/api/logbooks')
    ])
    await generateSemesterReport(summary.semesterName, directory.students, logbooks)
  } catch {
    exportError.value = true
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
.dashboard-hero {
  background: #102846;
  container-type: inline-size;
}

/* Switch to the illustrated layout based on the available banner width. */
.dashboard-hero-art {
  background: radial-gradient(ellipse at 67% 58%, #105554, transparent 75%);
}

@container (min-width: 55rem) {
  .dashboard-hero-art {
    display: block;
    width: clamp(10rem, 23cqw, 17rem);
  }
  .dashboard-hero-actions {
    grid-column: 3;
  }
  .dashboard-hero-copy {
    grid-column: 1;
  }
  .dashboard-hero-art,
  .dashboard-hero-actions,
  .dashboard-hero-copy {
    grid-row: 1;
  }
}

.dashboard-hero-link {
  @apply inline-flex items-center gap-1.5 font-semibold text-teal-100 hover:underline focus-visible:outline-white;
}

.dashboard-attention {
  background: linear-gradient(155deg, #f3f4ff, #f8fafc 70%);
}

.dashboard-section-heading {
  @apply text-lg text-slate-800;
  font-weight: 600 !important;
  letter-spacing: normal !important;
}

.dashboard-panel {
  @apply min-w-0 border border-surface-border bg-surface p-4 shadow-sm md:p-5;
}

.dashboard-link {
  @apply inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline;
}

.dashboard-button {
  @apply inline-flex min-h-11 items-center gap-2 rounded-control border border-slate-500 bg-[#19385a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#24496f] disabled:opacity-50 md:min-h-10;
}

.dashboard-link, .dashboard-action, .dashboard-stat {
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700;
}
.dashboard-button {
  @apply focus-visible:outline-white;
}
</style>
