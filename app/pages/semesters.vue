<template>
  <div class="app-surface-ui space-y-6 md:space-y-8">
    <PortalPageHeader title="Semester Management" icon="pi-calendar" description="Academic semester configuration and lifecycle.">
      <template v-if="isSuperCoordinator" #actions>
        <button type="button" class="portal-primary-action" @click="openAddForm">
          <i aria-hidden="true" class="pi pi-plus"></i>
          New Semester
        </button>
      </template>
    </PortalPageHeader>

    <div v-if="errorMessage" class="rounded-card p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="rounded-card p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
      {{ successMessage }}
    </div>

    <article class="rounded-card bg-surface border border-surface-border shadow-sm relative overflow-hidden">
      <div v-if="isLoading" class="rounded-card absolute inset-0 bg-surface/70 z-10 flex items-center justify-center backdrop-blur-sm">
        <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
      </div>

      <div v-if="isLoading" class="p-12 text-center">
        <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
      </div>

      <div v-else-if="semesters.length === 0" class="py-12 md:py-20 text-center text-text-muted font-black uppercase tracking-widest text-[10px]">No semesters defined</div>

      <template v-else>
        <div class="block xl:hidden space-y-3 p-4">
          <div v-for="sem in sortedSemesters" :key="sem.id" class="rounded-card bg-surface border border-surface-border border-l-4 p-4" :class="sem.is_active ? 'border-l-emerald-600' : 'border-l-transparent'">
            <div class="flex items-start justify-between mb-3">
              <div class="font-bold text-slate-800 text-base">{{ sem.name }}</div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                <span class="rounded-badge px-2 py-1 text-xs font-semibold whitespace-nowrap" :class="sem.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-muted text-text-muted'">
                  {{ sem.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            <div class="text-sm text-text-muted tabular-nums mb-3">
              {{ formatPeriod(sem.start_date, sem.end_date) }}
            </div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-sm font-medium text-text-muted">Registration</span>
              <span v-if="registrationBlockReason(sem.end_date, today)" class="text-sm font-medium text-text-muted">
                Closed · {{ registrationBlockReason(sem.end_date, today) }}
              </span>
              <button v-else type="button" role="switch" :aria-checked="sem.registration_open" :aria-label="`Registration for ${sem.name}`" :disabled="!isSuperCoordinator || updatingRegistrationId !== null" class="inline-flex min-h-10 items-center gap-2 rounded-control text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:opacity-50" @click="toggleRegistration(sem)">
                <span aria-hidden="true" class="relative h-6 w-11 rounded-full transition-colors" :class="sem.registration_open ? 'bg-sky-700' : 'bg-slate-500'"><span class="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" :class="sem.registration_open ? 'translate-x-[22px]' : 'translate-x-0.5'"></span></span>
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="sem.registration_open ? 'bg-teal-100 text-teal-950' : 'bg-slate-200 text-slate-800'">{{ updatingRegistrationId === sem.id ? 'Saving...' : sem.registration_open ? 'Open' : 'Closed' }}</span>
              </button>
            </div>
            <div class="mb-3">
              <div class="text-sm font-semibold tabular-nums text-slate-800">{{ countItems(sem)[0]?.value }} {{ countItems(sem)[0]?.label.toLowerCase() }}</div>
              <div class="mt-1 text-xs leading-relaxed text-text-muted tabular-nums">{{ countItems(sem).slice(1).map(item => `${item.value} ${item.label.toLowerCase()}`).join(' · ') }}</div>
            </div>
            <div v-if="isSuperCoordinator" class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-surface-border">
              <span class="text-[9px] font-bold text-text-muted">Created: {{ formatDate(sem.created_at) }}</span>
              <div class="flex gap-2">
                <button v-if="!sem.is_active" class="rounded-control min-h-10 px-3 bg-sky-700 text-white text-sm font-semibold whitespace-nowrap hover:bg-sky-800 transition-all disabled:opacity-50" :disabled="activatingId !== null" @click="activateSemester(sem)">
                  {{ activatingId === sem.id ? 'Activating...' : 'Set Active' }}
                </button>
                <button class="h-10 w-10 border border-surface-control text-text-muted hover:bg-surface-hover flex items-center justify-center rounded-control" title="Edit semester" @click="openEditForm(sem)">
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button v-if="sem.is_active" class="rounded-control h-10 w-10 border border-surface-border text-text-muted opacity-50 cursor-not-allowed flex items-center justify-center" disabled title="Cannot delete active semester">
                  <i class="pi pi-trash text-sm"></i>
                </button>
                <button v-else class="rounded-control h-10 w-10 border border-slate-900 text-slate-800 flex items-center justify-center disabled:opacity-50" :disabled="deletingId !== null" title="Review deletion" @click="openDelete(sem)">
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="hidden xl:block overflow-x-auto">
          <table class="w-full min-w-[960px] text-left">
            <thead>
              <tr class="app-table-header">
                <th class="px-4">Semester</th>
                <th class="px-4">Period</th>
                <th class="px-4">Associated data</th>
                <th class="px-4 w-28">Status</th>
                <th class="px-4">Registration</th>
                <th v-if="isSuperCoordinator" class="px-4 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-border text-xs">
              <tr v-for="sem in sortedSemesters" :key="sem.id" class="hover:bg-surface-hover transition-colors group">
                <td class="px-4 py-5 min-w-[150px]" :class="sem.is_active ? 'shadow-[inset_4px_0_0_0_#059669]' : ''">
                  <div class="font-bold text-slate-800 text-sm">{{ sem.name }}</div>
                  <div class="text-xs text-text-muted mt-1">Created {{ formatDate(sem.created_at) }}</div>
                </td>
                <td class="px-4 py-5 whitespace-nowrap">
                  <div class="font-medium text-text-muted tabular-nums text-sm leading-relaxed">{{ formatPeriod(sem.start_date, sem.end_date) }}</div>
                </td>
                <td class="px-4 py-5 min-w-[220px]">
                  <div class="text-sm font-semibold text-slate-800 tabular-nums">{{ countItems(sem)[0]?.value }} {{ countItems(sem)[0]?.label.toLowerCase() }}</div>
                  <div class="mt-1 text-xs leading-relaxed text-text-muted tabular-nums">{{ countItems(sem).slice(1).map(item => `${item.value} ${item.label.toLowerCase()}`).join(' · ') }}</div>
                </td>
                <td class="px-4 py-5">
                  <span class="rounded-badge px-2 py-1 text-xs font-semibold whitespace-nowrap" :class="sem.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-muted text-text-muted'">
                    {{ sem.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-5">
                  <span v-if="registrationBlockReason(sem.end_date, today)" class="text-xs font-medium text-text-muted">
                    Closed · {{ registrationBlockReason(sem.end_date, today) }}
                  </span>
                  <button v-else type="button" role="switch" :aria-checked="sem.registration_open" :aria-label="`Registration for ${sem.name}`" :disabled="!isSuperCoordinator || updatingRegistrationId !== null" class="inline-flex min-h-10 items-center gap-2 rounded-control text-xs font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:opacity-50" @click="toggleRegistration(sem)">
                    <span aria-hidden="true" class="relative h-6 w-11 rounded-full transition-colors" :class="sem.registration_open ? 'bg-sky-700' : 'bg-slate-500'"><span class="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" :class="sem.registration_open ? 'translate-x-[22px]' : 'translate-x-0.5'"></span></span>
                    <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="sem.registration_open ? 'bg-teal-100 text-teal-950' : 'bg-slate-200 text-slate-800'">{{ updatingRegistrationId === sem.id ? 'Saving...' : sem.registration_open ? 'Open' : 'Closed' }}</span>
                  </button>
                </td>
                <td v-if="isSuperCoordinator" class="px-4 py-5">
                  <div class="flex items-center justify-center gap-2">
                    <button type="button" class="h-10 w-10 border border-surface-control text-text-muted hover:bg-surface-hover rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700" :aria-label="`More actions for ${sem.name}`" :aria-expanded="actionSemester?.id === sem.id" aria-controls="semester-actions" @click="toggleActions(sem, $event)">
                      <i aria-hidden="true" class="pi pi-ellipsis-h"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </article>

    <Teleport to="body">
      <div v-if="actionSemester" id="semester-actions" ref="actionMenu" class="fixed z-[150] w-48 rounded-card border border-surface-border bg-surface p-1 shadow-xl" :style="actionMenuStyle">
        <button v-if="!actionSemester.is_active" type="button" class="rounded-control w-full px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none disabled:opacity-50" :disabled="activatingId !== null" @click="runSemesterAction('activate')">Set active</button>
        <button type="button" class="rounded-control w-full px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none" @click="runSemesterAction('edit')">Edit semester</button>
        <button type="button" class="rounded-control w-full px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none disabled:opacity-50" :disabled="actionSemester.is_active || deletingId !== null" :title="actionSemester.is_active ? 'Cannot delete active semester' : undefined" @click="runSemesterAction('delete')">{{ actionSemester.is_active ? 'Cannot delete active semester' : 'Delete semester' }}</button>
      </div>

      <div v-if="showForm" class="app-surface-ui fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
        <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-lg p-6 sm:p-10 border border-surface-border shadow-2xl relative mx-4 sm:mx-0">
          <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="showForm = false">
            <i class="pi pi-times"></i>
          </button>

          <h2 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-8">{{ editingId ? 'Edit Semester' : 'New Semester' }}</h2>

          <form @submit.prevent="saveSemester" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Semester Name</label>
              <input v-model="form.name" type="text" required placeholder="e.g., Jan-Jun 2026"
                class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Start Date</label>
                <input v-model="form.start_date" type="date" required
                  class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">End Date</label>
                <input v-model="form.end_date" type="date" required
                  class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
              </div>
            </div>

            <button type="submit" :disabled="isSaving" class="rounded-control w-full bg-sky-700 text-white h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sky-800 transition-all disabled:opacity-30 mt-4">
              {{ isSaving ? 'Processing...' : editingId ? 'Update Semester' : 'Create Semester' }}
            </button>
          </form>
        </div>
      </div>

      <div v-if="showDelete && deleteTarget" class="app-surface-ui fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
        <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-lg p-6 sm:p-10 border border-surface-border shadow-2xl relative mx-4 sm:mx-0">
          <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="closeDelete">
            <i class="pi pi-times"></i>
          </button>

          <h2 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">Delete Semester</h2>
          <p class="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">{{ deleteTarget.name }}</p>

          <div class="grid grid-cols-2 gap-3 mb-6">
            <div v-for="item in countItems(deleteTarget)" :key="item.label" class="rounded-control bg-surface-muted border border-surface-border px-4 py-3">
              <div class="text-[9px] font-black uppercase tracking-widest text-text-muted">{{ item.label }}</div>
              <div class="text-lg font-black tabular-nums text-slate-800">{{ item.value }}</div>
            </div>
          </div>

          <div v-if="!deleteTarget.deletion.allowed" class="rounded-card p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
            {{ deleteTarget.deletion.message }}
          </div>
          <div v-else-if="deleteTarget.counts.templates > 0" class="rounded-card p-4 bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest">
            Deleting this semester will also remove {{ deleteTarget.counts.templates }} requirement {{ deleteTarget.counts.templates === 1 ? 'template' : 'templates' }}.
          </div>
          <div v-else class="rounded-card p-4 bg-surface-muted border border-surface-border text-text-muted text-[10px] font-black uppercase tracking-widest">
            This semester has no related records.
          </div>

          <p v-if="deleteError" class="mt-4 text-[10px] font-black uppercase tracking-widest text-rose-700">{{ deleteError }}</p>

          <div class="flex gap-3 mt-6">
            <button type="button" class="rounded-control flex-1 h-12 border border-surface-control text-text-muted font-black text-[10px] uppercase tracking-widest hover:bg-surface-hover transition-all" @click="closeDelete">
              {{ deleteTarget.deletion.allowed ? 'Cancel' : 'Close' }}
            </button>
            <button
              v-if="deleteTarget.deletion.allowed"
              type="button"
              class="rounded-control flex-1 h-12 bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-800 transition-all disabled:opacity-50"
              :disabled="deletingId !== null"
              @click="confirmDelete"
            >
              {{ deletingId === deleteTarget.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'
import { campusDate, registrationBlockReason } from '~~/shared/utils/semester-registration'

definePageMeta({
  requiredRole: 'coordinator'
})

type SemesterRow = Database['public']['Tables']['semesters']['Row']
type SemesterCounts = {
  students: number
  templates: number
  logbooks: number
  applications: number
  audits: number
}
type SemesterOverview = SemesterRow & {
  counts: SemesterCounts
  deletion: { allowed: boolean; message: string | null }
}
type SemestersResponse = { semesters: SemesterOverview[] }
type CountItem = { label: string; value: number }

const pageCache = usePageCache()
const activeSemesterName = useState<string | null>('active-semester-name', () => null)
const { isSuperCoordinator } = useCoordinatorPrivileges()

const semesters = ref<SemesterOverview[]>([])
const today = ref(campusDate())
let campusDateTimer: ReturnType<typeof setInterval> | undefined
const sortedSemesters = computed(() => [...semesters.value].sort((a, b) => Number(b.is_active) - Number(a.is_active)))
const isLoading = ref(false)
const isSaving = ref(false)
const activatingId = ref<number | null>(null)
const updatingRegistrationId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const actionSemester = ref<SemesterOverview | null>(null)
const actionMenu = ref<HTMLElement | null>(null)
const actionTrigger = ref<HTMLButtonElement | null>(null)
const actionMenuStyle = ref<Record<string, string>>({})

const closeActions = (restoreFocus = false) => {
  const trigger = actionTrigger.value
  actionSemester.value = null
  actionTrigger.value = null
  if (restoreFocus) nextTick(() => trigger?.focus())
}

const toggleActions = async (semester: SemesterOverview, event: MouseEvent) => {
  if (actionSemester.value?.id === semester.id) return closeActions()
  const trigger = event.currentTarget as HTMLButtonElement
  const rect = trigger.getBoundingClientRect()
  actionTrigger.value = trigger
  actionMenuStyle.value = {
    left: `${Math.max(8, Math.min(rect.right - 192, window.innerWidth - 200))}px`,
    top: `${rect.bottom + 8}px`
  }
  actionSemester.value = semester
  await nextTick()
  if (!actionMenu.value) return
  const height = actionMenu.value.offsetHeight
  if (rect.bottom + 8 + height > window.innerHeight - 8) {
    actionMenuStyle.value.top = `${Math.max(8, rect.top - height - 8)}px`
  }
  actionMenu.value.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true })
}

const runSemesterAction = (action: 'activate' | 'edit' | 'delete') => {
  const semester = actionSemester.value
  if (!semester) return
  closeActions()
  if (action === 'activate') void activateSemester(semester)
  else if (action === 'edit') openEditForm(semester)
  else openDelete(semester)
}

const handleActionPointer = (event: PointerEvent) => {
  const target = event.target as Node
  if (actionSemester.value && !actionMenu.value?.contains(target) && !actionTrigger.value?.contains(target)) closeActions()
}
const handleActionKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && actionSemester.value) {
    event.preventDefault()
    closeActions(true)
  }
}
const handleActionScroll = () => {
  if (!actionSemester.value || !actionTrigger.value || !actionMenu.value) return
  const rect = actionTrigger.value.getBoundingClientRect()
  const height = actionMenu.value.offsetHeight
  actionMenuStyle.value = {
    left: `${Math.max(8, Math.min(rect.right - 192, window.innerWidth - 200))}px`,
    top: `${rect.bottom + 8 + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 8) : rect.bottom + 8}px`
  }
}
const errorMessage = ref('')
const successMessage = ref('')

const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', start_date: '', end_date: '' })

const showDelete = ref(false)
const deleteTarget = ref<SemesterOverview | null>(null)
const deleteError = ref('')

const errorText = (error: any, fallback: string) =>
  error?.data?.statusMessage || error?.statusMessage || fallback

const countItems = (semester: SemesterOverview): CountItem[] => {
  const label = (count: number, singular: string, plural: string) => count === 1 ? singular : plural
  return [
    { label: label(semester.counts.students, 'Student', 'Students'), value: semester.counts.students },
    { label: label(semester.counts.templates, 'Requirement', 'Requirements'), value: semester.counts.templates },
    { label: label(semester.counts.logbooks, 'Logbook', 'Logbooks'), value: semester.counts.logbooks },
    { label: label(semester.counts.applications, 'Application', 'Applications'), value: semester.counts.applications }
  ]
}

const loadSemesters = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await $fetch<SemestersResponse>('/api/semesters')
    semesters.value = (data.semesters || []).map(semester => ({
      ...semester,
      counts: semester.counts || { students: 0, templates: 0, logbooks: 0, applications: 0, audits: 0 },
      deletion: semester.deletion || { allowed: !semester.is_active, message: null }
    }))
    activeSemesterName.value = semesters.value.find(semester => semester.is_active)?.name || ''
  } catch (error: any) {
    errorMessage.value = errorText(error, 'Unable to load semesters')
  } finally {
    isLoading.value = false
  }
}

const openAddForm = () => {
  editingId.value = null
  form.value = { name: '', start_date: '', end_date: '' }
  showForm.value = true
  successMessage.value = ''
}

const openEditForm = (sem: SemesterOverview) => {
  editingId.value = sem.id
  form.value = {
    name: sem.name,
    start_date: (sem.start_date || '').split('T')[0] || '',
    end_date: (sem.end_date || '').split('T')[0] || ''
  }
  showForm.value = true
  successMessage.value = ''
}

const saveSemester = async () => {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      name: form.value.name,
      start_date: form.value.start_date,
      end_date: form.value.end_date
    }

    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'semester.save', payload: { ...payload, id: editingId.value } } })

    successMessage.value = editingId.value ? 'Semester updated' : 'Semester created'
    pageCache.clear()
    showForm.value = false
    await loadSemesters()
  } catch (error: any) {
    errorMessage.value = errorText(error, 'Save failed')
  } finally {
    isSaving.value = false
  }
}

const activateSemester = async (sem: SemesterOverview) => {
  if (!confirm(`Activate "${sem.name}"? This becomes the default semester across the portal.`)) return

  activatingId.value = sem.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'semester.activate', payload: { id: sem.id } } })
    successMessage.value = 'Semester activated'
    pageCache.clear()
    await loadSemesters()
  } catch (error: any) {
    errorMessage.value = errorText(error, 'Activation failed')
  } finally {
    activatingId.value = null
  }
}

const toggleRegistration = async (sem: SemesterOverview) => {
  today.value = campusDate()
  if (!isSuperCoordinator.value || updatingRegistrationId.value !== null || registrationBlockReason(sem.end_date, today.value)) return
  updatingRegistrationId.value = sem.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updated = await $fetch<{ id: number; registration_open: boolean }>(`/api/semesters/${sem.id}/registration`, {
      method: 'PATCH',
      body: { registration_open: !sem.registration_open }
    })
    sem.registration_open = updated.registration_open
    successMessage.value = `Registration ${updated.registration_open ? 'opened' : 'closed'} for ${sem.name}`
    pageCache.clear()
  } catch (error: any) {
    errorMessage.value = errorText(error, 'Unable to update registration')
  } finally {
    updatingRegistrationId.value = null
  }
}

const openDelete = (sem: SemesterOverview) => {
  if (sem.is_active) return
  deleteTarget.value = sem
  deleteError.value = ''
  showDelete.value = true
  successMessage.value = ''
}

const closeDelete = () => {
  showDelete.value = false
  deleteTarget.value = null
  deleteError.value = ''
}

const confirmDelete = async () => {
  const target = deleteTarget.value
  if (!target || !target.deletion.allowed) return

  deletingId.value = target.id
  deleteError.value = ''

  try {
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'semester.delete', payload: { id: target.id } } })
    successMessage.value = 'Semester removed'
    pageCache.clear()
    closeDelete()
    await loadSemesters()
  } catch (error: any) {
    deleteError.value = errorText(error, 'Delete failed')
  } finally {
    deletingId.value = null
  }
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '---'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date))
}

const formatPeriod = (start: string | null | undefined, end: string | null | undefined) => {
  if (!start && !end) return 'Dates not set'
  if (!start) return `Until ${formatDate(end)}`
  if (!end) return `From ${formatDate(start)}`
  return `${formatDate(start)} – ${formatDate(end)}`
}

onMounted(() => {
  campusDateTimer = setInterval(() => { today.value = campusDate() }, 30_000)
  void loadSemesters()
  document.addEventListener('pointerdown', handleActionPointer)
  document.addEventListener('keydown', handleActionKey)
  window.addEventListener('scroll', handleActionScroll, true)
  window.addEventListener('resize', handleActionScroll)
})
onUnmounted(() => {
  clearInterval(campusDateTimer)
  document.removeEventListener('pointerdown', handleActionPointer)
  document.removeEventListener('keydown', handleActionKey)
  window.removeEventListener('scroll', handleActionScroll, true)
  window.removeEventListener('resize', handleActionScroll)
})
</script>
