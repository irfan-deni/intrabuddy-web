<template>
  <section class="app-surface-ui space-y-6 md:space-y-8">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">Logbooks</h1>
        <p class="mt-2 text-sm font-normal leading-relaxed text-text-muted">Monitor semester logbook compliance and send reminders.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :disabled="isRefreshing"
          class="rounded-control inline-flex h-11 w-11 items-center justify-center text-sm font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
          title="Refresh"
          aria-label="Refresh"
          @click="loadLogbooks(true)"
        >
          <i aria-hidden="true" :class="['pi pi-refresh', { 'pi-spin': isRefreshing }]"></i>
        </button>
        <button
          type="button"
          :disabled="isLoading"
          class="rounded-control inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap border border-surface-control bg-surface px-3 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-50 sm:px-4"
          @click="generatePDF"
        >
          <i aria-hidden="true" class="pi pi-file-pdf hidden sm:inline-block"></i>
          Export PDF
        </button>
        <button
          v-if="statusFilter !== 'awaiting'"
          type="button"
          :disabled="isLoading || isRemindingAll"
          class="rounded-control inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap bg-amber-400 px-3 text-sm font-semibold text-slate-900 hover:bg-amber-500 disabled:opacity-50 sm:px-4"
          title="Remind students with unsubmitted logbooks in the active semester"
          @click="remindAll"
        >
          <i aria-hidden="true" class="pi pi-bell hidden sm:inline-block"></i>
          {{ isRemindingAll ? 'Sending reminders…' : 'Remind All' }}
        </button>
      </div>
    </header>

    <p v-if="errorMessage" class="rounded-card p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium">
      {{ errorMessage }}
    </p>

    <div role="group" aria-label="Logbook filters" class="flex flex-wrap items-center gap-3">
      <div class="group relative min-w-0 basis-full sm:grow sm:basis-64">
        <i aria-hidden="true" class="pi pi-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted group-focus-within:text-sky-700"></i>
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search by student name or matric number"
          placeholder="Search by name or matric number..."
          class="rounded-control h-11 w-full border border-surface-control bg-surface-muted pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
        >
      </div>
      <div class="flex w-full min-w-0 items-center gap-3 sm:w-auto">
        <select
          v-model="statusFilter"
          aria-label="Filter by status"
          class="rounded-control h-11 min-w-0 flex-1 cursor-pointer border border-surface-control bg-surface-muted px-3 text-sm text-text-primary focus:border-sky-700 focus:ring-1 focus:ring-sky-700 sm:w-44 sm:flex-none"
        >
          <option value="all">All statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Not Submitted">Not submitted</option>
          <option value="Late">Overdue</option>
          <option v-if="isSuperCoordinator || statusFilter === 'awaiting'" value="awaiting">Awaiting review</option>
        </select>
        <button
          v-if="!isLoading && !errorMessage && !weekEnding && statusFilter !== 'awaiting' && (overdueCount > 0 || statusFilter === 'Late')"
          type="button"
          :aria-pressed="statusFilter === 'Late'"
          class="rounded-control min-h-11 shrink-0 whitespace-nowrap border border-amber-300 bg-amber-50 px-3 text-sm font-semibold tabular-nums text-amber-900 hover:bg-amber-100 aria-pressed:border-amber-600 aria-pressed:bg-amber-200"
          @click="statusFilter = statusFilter === 'Late' ? 'all' : 'Late'"
        >
          {{ overdueCount }} overdue
        </button>
      </div>
    </div>

    <article ref="logbookPanel" class="rounded-card overflow-hidden bg-surface border border-surface-border shadow-sm relative">
      <h2 v-if="statusFilter === 'awaiting'" class="border-b border-surface-border bg-surface-muted px-4 py-3 text-base font-bold text-slate-800 md:px-6">
        Logbooks awaiting review
      </h2>
      <div v-if="weekEnding" class="flex flex-wrap items-center gap-3 px-4 py-2 text-sm text-text-muted md:px-6">
        <span>Week ending {{ weekEnding }}</span>
        <button type="button" class="font-semibold text-sky-700 underline" @click="weekEnding = ''">Show all weeks</button>
      </div>

      <div v-if="isLoading" class="py-12 md:py-16 text-center text-text-muted">
        <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
        <span class="text-sm font-medium">Loading logbooks...</span>
      </div>

      <div v-else-if="filteredStudents.length === 0" class="py-12 md:py-16 text-center text-text-muted">
        <i class="pi pi-inbox mb-2 text-3xl block"></i>
        <span class="text-sm font-medium">{{ searchQuery.trim() || weekEnding || statusFilter !== 'all' ? 'No logbook records match your filters.' : 'No logbook records found for the active semester.' }}</span>
      </div>

      <template v-else>
        <div class="block md:hidden space-y-3 p-4 md:p-0">
          <div v-for="student in paginatedStudents" :key="student.id" class="rounded-card bg-surface-muted border border-surface-border p-4">
            <div class="font-semibold text-slate-800 tracking-tight text-base">{{ student.name }}</div>
            <div class="text-xs font-medium text-text-muted mt-0.5">{{ student.matric || 'No ID' }}</div>
            <div v-if="statusFilter === 'awaiting'" class="mt-3 text-sm text-text-muted">{{ student.entries.length }} awaiting review</div>
            <div v-else class="mt-3 flex justify-between gap-3 text-sm text-text-muted">
              <span>Submitted: {{ student.submitted }} / {{ student.entries.length }}</span>
              <span>Not submitted: {{ student.outstanding }}</span>
            </div>
            <button type="button" class="rounded-control mt-4 w-full h-9 bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 transition-all" @click="openStudent(student.id, $event)">View logbooks</button>
          </div>
        </div>

        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-sm font-semibold text-text-muted bg-surface-muted border-b border-surface-border">
                <th class="w-14 px-4 py-6 text-center">#</th>
                <th class="px-8 py-6">Student</th>
                <th class="px-8 py-6">{{ statusFilter === 'awaiting' ? 'Awaiting review' : 'Progress' }}</th>
                <th v-if="statusFilter !== 'awaiting'" class="px-8 py-6">Not submitted</th>
                <th class="px-8 py-6 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-surface-border">
              <tr v-for="(student, index) in paginatedStudents" :key="student.id" class="hover:bg-surface-hover transition-colors group">
                <td class="px-4 py-6 text-center text-xs font-medium text-text-muted tabular-nums">{{ String(visibleStart + index).padStart(2, '0') }}</td>
                <td class="px-8 py-6">
                    <div class="font-semibold text-slate-800 tracking-tight text-sm">{{ student.name }}</div>
                    <div class="text-xs font-medium text-text-muted mt-1">{{ student.matric || 'No ID' }}</div>
                  </td>
                 <td class="px-8 py-6 font-medium text-slate-800 tabular-nums">{{ statusFilter === 'awaiting' ? student.entries.length : `${student.submitted} / ${student.entries.length} submitted` }}</td>
                 <td v-if="statusFilter !== 'awaiting'" class="px-8 py-6 font-medium text-text-muted tabular-nums">{{ student.outstanding }}</td>
                <td class="px-8 py-6 text-right">
                  <button type="button" class="rounded-control whitespace-nowrap h-9 px-3 bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 transition-all" @click="openStudent(student.id, $event)">View logbooks</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-border bg-surface-muted p-4 md:px-6">
          <p class="text-xs font-medium text-text-muted tabular-nums">
            Showing {{ visibleStart }}–{{ visibleEnd }} of {{ filteredStudents.length }} students
          </p>
          <div class="flex items-center justify-between sm:justify-end gap-3 md:gap-5">
            <label class="flex items-center gap-2 text-xs font-medium text-text-muted">
              <span class="hidden xs:inline">Rows</span>
              <select
                v-model.number="pageSize"
                aria-label="Rows per page"
                class="rounded-control text-xs font-medium border border-surface-control px-2 py-1.5 bg-surface-muted outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700 transition-all cursor-pointer tabular-nums"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                :disabled="currentPage === 1"
                class="rounded-control h-8 w-8 border border-surface-control bg-surface text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                @click="goToPage(currentPage - 1)"
              >
                <i class="pi pi-chevron-left text-[9px]" />
              </button>
              <span class="text-xs font-medium text-text-muted tabular-nums" aria-live="polite">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                type="button"
                aria-label="Next page"
                :disabled="currentPage === totalPages"
                class="rounded-control h-8 w-8 border border-surface-control bg-surface text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                @click="goToPage(currentPage + 1)"
              >
                <i class="pi pi-chevron-right text-[9px]" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </article>
    <Drawer
      v-model:visible="drawerVisible"
      position="right"
      modal
      dismissable
      block-scroll
      :show-close-icon="false"
      :style="{ width: 'min(100vw, 32rem)' }"
      :pt="{
        mask: { class: 'logbook-drawer-mask bg-slate-900/50' },
        root: { class: 'logbook-drawer h-full flex flex-col bg-surface shadow-2xl' },
        header: { class: 'shrink-0 border-b border-surface-border px-5 py-5 sm:px-6' },
        content: { class: 'flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6' }
      }"
      aria-label="Student weekly logbooks"
      @after-hide="drawerTrigger?.focus()"
    >
      <template #header>
        <div class="flex w-full items-start justify-between gap-4">
          <div v-if="selectedStudent" class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-muted">Student logbooks</p>
            <h2 class="mt-1 text-xl font-bold text-slate-800 break-words">{{ selectedStudent.name }}</h2>
            <p class="mt-1 text-sm text-text-muted">{{ selectedStudent.matric || 'No ID' }}</p>
          </div>
          <button type="button" autofocus aria-label="Close student logbooks" class="rounded-control shrink-0 flex h-9 w-9 items-center justify-center text-text-muted hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-sky-700" @click="drawerVisible = false">
            <i class="pi pi-times" aria-hidden="true" />
          </button>
        </div>
      </template>
      <template v-if="selectedStudent">
        <div class="rounded-card border border-surface-border bg-surface-muted p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold text-text-muted">Submission progress</p>
              <p class="mt-1 text-lg font-bold text-slate-800 tabular-nums">{{ selectedStudent.submitted }} / {{ selectedStudent.entries.length }} <span class="text-sm font-medium text-text-muted">weeks submitted</span></p>
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold text-text-muted">Not submitted</p>
              <p class="mt-1 text-lg font-bold text-amber-700 tabular-nums">{{ selectedStudent.outstanding }}</p>
            </div>
          </div>
          <button v-if="selectedStudent.outstanding > 0" type="button" class="rounded-control mt-4 h-9 px-3 bg-amber-400 text-slate-900 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50" :disabled="isRemindingStudent" @click="sendStudentReminder(selectedStudent.id)">
            <i class="pi pi-bell mr-1" /> {{ isRemindingStudent ? 'Sending...' : 'Remind student' }}
          </button>
          <p v-if="studentReminderMessage" class="mt-2 text-sm" :class="studentReminderError ? 'text-rose-700' : 'text-emerald-700'" role="status">{{ studentReminderMessage }}</p>
        </div>
        <div class="mt-6 mb-3 flex items-center justify-between gap-3">
          <h3 class="font-bold text-slate-800">Weekly logbooks</h3>
          <NuxtLink :to="{ path: '/student', query: { id: selectedStudent.id }, hash: '#student-management' }" class="text-sm font-medium text-sky-700 underline underline-offset-2">View reviews</NuxtLink>
        </div>
        <div class="overflow-hidden rounded-card border border-surface-border divide-y divide-surface-border">
          <div v-for="entry in selectedStudent.entries" :key="entry.id" class="bg-surface px-4 py-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="font-semibold text-slate-800">Week {{ entry.weekNumber }}</div>
                <div class="mt-1 text-sm text-text-muted">Ends {{ entry.weekEndDate }}</div>
                <p class="mt-1 text-sm text-text-muted">{{ entry.submittedAt ? `Submitted ${formatDate(entry.submittedAt)}` : 'Not submitted' }}</p>
              </div>
              <span class="inline-flex shrink-0" :title="entry.isStale ? 'Stale: no submission more than 7 days after the week ended.' : undefined">
                <StatusBadge :status="entry.statusLabel === 'Late' ? 'Overdue' : entry.statusLabel" />
                <span v-if="entry.isStale" class="sr-only">Stale record</span>
              </span>
            </div>
            <div v-if="!entry.isSubmitted && isSuperCoordinator" class="mt-3 flex flex-wrap gap-2">
              <button v-if="isSuperCoordinator" type="button" class="rounded-control h-9 px-3 bg-slate-900 text-white text-xs font-semibold hover:brightness-150 transition-all disabled:opacity-50" :disabled="entry.isSubmitting" @click="markSubmitted(entry)">
                <i class="pi pi-check mr-1" /> {{ entry.isSubmitting ? 'Saving...' : 'Mark Done' }}
              </button>
            </div>
          </div>
        </div>
      </template>
      <p v-else class="text-sm text-text-muted">This student's logbooks are no longer available.</p>
    </Drawer>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

import StatusBadge from '~/components/StatusBadge.vue'
import Drawer from 'primevue/drawer'

import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'
import { generateReport } from '~/utils/pdfGenerator'

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

const route = useRoute()
const statusFilter = ref(route.query.review === 'awaiting' ? 'awaiting' : route.query.status === 'Late' ? 'Late' : 'all')
const weekEnding = ref(typeof route.query.week_end === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(route.query.week_end) ? route.query.week_end : '')
const logbooksUrl = () => {
  const params = new URLSearchParams()
  if (statusFilter.value === 'awaiting') params.set('review', 'awaiting')
  if (weekEnding.value) params.set('week_end', weekEnding.value)
  return params.size ? `/api/logbooks?${params}` : '/api/logbooks'
}
const pageCache = usePageCache()
const cachedLogbooks = pageCache.read<LogbookEntry[]>(logbooksUrl())
const logbooks = ref<LogbookEntry[]>(cachedLogbooks || [])
const isLoading = ref(!cachedLogbooks)
const isRefreshing = ref(false)
const isRemindingAll = ref(false)
const errorMessage = ref('')

const searchQuery = ref('')
const pageSize = ref(15)
const pageSizeOptions = [10, 15, 20, 50]
const currentPage = ref(1)
const logbookPanel = ref<HTMLElement | null>(null)
const drawerVisible = ref(false)
const selectedStudentId = ref<string | null>(null)
const drawerTrigger = ref<HTMLElement | null>(null)
const isRemindingStudent = ref(false)
const studentReminderMessage = ref('')
const studentReminderError = ref(false)

const openStudent = (id: string, event: MouseEvent) => {
  drawerTrigger.value = event.currentTarget as HTMLElement
  selectedStudentId.value = id
  studentReminderMessage.value = ''
  studentReminderError.value = false
  drawerVisible.value = true
}

watch([statusFilter, searchQuery, weekEnding], () => {
  currentPage.value = 1
})
watch(logbooksUrl, () => { void loadLogbooks(true) })

watch(pageSize, () => {
  currentPage.value = 1
})

const loadLogbooks = async (force = false) => {
  isRefreshing.value = true
  const url = logbooksUrl()
  const cached = pageCache.read<LogbookEntry[]>(url)
  logbooks.value = cached || []
  isLoading.value = !cached
  errorMessage.value = ''

  try {
    const data = await pageCache.fetch<LogbookEntry[]>(url, { force })
    if (logbooksUrl() === url) logbooks.value = data || []
  } catch (error: unknown) {
    if (logbooksUrl() === url) errorMessage.value = error instanceof Error ? error.message : 'Unable to load logbooks.'
  } finally {
    if (logbooksUrl() === url) {
      isLoading.value = false
      isRefreshing.value = false
    }
  }
}

const sendStudentReminder = async (studentId: string) => {
  isRemindingStudent.value = true
  studentReminderMessage.value = ''
  studentReminderError.value = false
  try {
    const result = await $fetch<{ entryIds: number[] }>(`/api/logbooks/student/${encodeURIComponent(studentId)}/reminder`, { method: 'POST' })
    pageCache.invalidate('/api/logbooks')
    for (const entry of logbooks.value) {
      if (result.entryIds.includes(entry.id)) entry.reminderSent = true
    }
    if (selectedStudentId.value === studentId) studentReminderMessage.value = 'Reminder sent.'
  } catch (error: any) {
    if (selectedStudentId.value === studentId) {
      studentReminderError.value = true
      studentReminderMessage.value = error?.data?.statusMessage || 'Failed to send reminder.'
    }
  } finally {
    isRemindingStudent.value = false
  }
}

const markSubmitted = async (entry: LogbookEntry) => {
  entry.isSubmitting = true
  try {
    await $fetch(`/api/logbooks/${entry.id}/submit`, { method: 'POST' })
    pageCache.invalidate(['/api/logbooks', logbooksUrl(), '/api/dashboard'])
    entry.isSubmitted = true
    entry.submittedAt = new Date().toISOString()
    entry.statusLabel = 'Submitted'
  } catch (error: any) {
    alert('Failed to mark as submitted')
  } finally {
    entry.isSubmitting = false
  }
}

const remindAll = async () => {
  isRemindingAll.value = true
  try {
    const result = await $fetch<{ reminded: number }>('/api/logbooks/remind-all', { method: 'POST' })
    pageCache.invalidate('/api/logbooks')
    alert(`Reminders sent to ${result.reminded} student(s)`)
    await loadLogbooks()
  } catch {
    alert('Failed to send bulk reminders')
  } finally {
    isRemindingAll.value = false
  }
}

const searchedLogbooks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return !query ? logbooks.value : logbooks.value.filter(entry =>
    entry.studentName.toLowerCase().includes(query) || (entry.studentMatric || '').toLowerCase().includes(query)
  )
})

const filteredLogbooks = computed(() => searchedLogbooks.value.filter(entry => {
  const matchesStatus = ['all', 'awaiting'].includes(statusFilter.value) || entry.statusLabel === statusFilter.value
  return matchesStatus && (!weekEnding.value || entry.weekEndDate === weekEnding.value)
}))

const overdueCount = computed(() => searchedLogbooks.value.filter(entry => entry.statusLabel === 'Late').length)

const students = computed(() => {
  const grouped = new Map<string, { id: string, name: string, matric: string, entries: LogbookEntry[], submitted: number, outstanding: number }>()
  for (const entry of weekEnding.value || statusFilter.value === 'Late' ? filteredLogbooks.value : logbooks.value) {
    let student = grouped.get(entry.studentId)
    if (!student) {
      student = { id: entry.studentId, name: entry.studentName, matric: entry.studentMatric, entries: [], submitted: 0, outstanding: 0 }
      grouped.set(entry.studentId, student)
    }
    student.entries.push(entry)
    if (entry.statusLabel === 'Submitted') student.submitted++
    if (entry.statusLabel === 'Late' || entry.statusLabel === 'Not Submitted') student.outstanding++
  }
  return Array.from(grouped.values()).map(student => ({ ...student, entries: student.entries.sort((a, b) => a.weekNumber - b.weekNumber) }))
})
const filteredStudents = computed(() => {
  const matchingIds = new Set(filteredLogbooks.value.map(entry => entry.studentId))
  return students.value.filter(student => matchingIds.has(student.id))
})
const selectedStudent = computed(() => students.value.find(student => student.id === selectedStudentId.value))

const totalPages = computed(() => Math.max(1, Math.ceil(filteredStudents.value.length / pageSize.value)))
const visibleStart = computed(() =>
  filteredStudents.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)
const visibleEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredStudents.value.length))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

const goToPage = (page: number) => {
  const nextPage = Math.min(Math.max(page, 1), totalPages.value)
  if (nextPage === currentPage.value) return

  currentPage.value = nextPage
  nextTick(() => {
    logbookPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const generatePDF = () => {
  const tableData = filteredLogbooks.value.map(entry => [
    entry.studentName,
    entry.studentMatric || 'N/A',
    'Week ' + entry.weekNumber,
    entry.weekEndDate,
    entry.statusLabel
  ])

  generateReport(
    'INTRA Buddy - Weekly Logbook Compliance Report',
    ['Student Name', 'ID', 'Week', 'End Date', 'Status'],
    tableData,
    'INTRA_Compliance_Report.pdf',
    { styles: { fontSize: 8 } }
  )
}

onMounted(async () => {
  await loadLogbooks()
})
</script>

<style>
.logbook-drawer.p-drawer-enter-active,
.logbook-drawer.p-drawer-leave-active {
  transition: transform 250ms ease;
}

.logbook-drawer.p-drawer-enter-from,
.logbook-drawer.p-drawer-leave-to {
  transform: translateX(100%);
}

.logbook-drawer-mask {
  animation: logbook-backdrop-in 250ms ease both;
}

.logbook-drawer-mask:has(.p-drawer-leave-active) {
  animation: logbook-backdrop-out 250ms ease both;
}

@keyframes logbook-backdrop-in {
  from { background-color: transparent; }
  to { background-color: rgb(15 23 42 / 50%); }
}

@keyframes logbook-backdrop-out {
  from { background-color: rgb(15 23 42 / 50%); }
  to { background-color: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .logbook-drawer.p-drawer-enter-active,
  .logbook-drawer.p-drawer-leave-active {
    transition-duration: 0.01ms;
  }

  .logbook-drawer-mask,
  .logbook-drawer-mask:has(.p-drawer-leave-active) {
    animation-duration: 0.01ms;
  }
}
</style>
