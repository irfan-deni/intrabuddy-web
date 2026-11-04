<template>
  <div class="app-surface-ui space-y-6 md:space-y-8">
    <header class="flex flex-col md:flex-row flex-wrap md:items-end justify-between gap-6">
      <div>
        <h1 class="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">Semester Management</h1>
        <p class="mt-2 text-sm font-normal leading-relaxed text-text-muted">Academic semester configuration and lifecycle.</p>
      </div>
      <button
        v-if="isSuperCoordinator"
        class="bg-sky-700 text-white px-6 py-3 rounded-control text-sm font-semibold hover:bg-sky-800 transition-all flex items-center gap-3"
        @click="openAddForm"
      >
        <i class="pi pi-plus"></i>
        New Semester
      </button>
    </header>

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
        <div class="block md:hidden space-y-3 p-4">
          <div v-for="sem in semesters" :key="sem.id" class="rounded-card bg-surface-muted border border-surface-border p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ sem.name }}</div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                <span class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap" :class="sem.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-muted text-text-muted'">
                  {{ sem.is_active ? 'Active' : 'Inactive' }}
                </span>
                <button
                  v-if="isSuperCoordinator && !sem.is_active"
                  class="rounded-control h-6 px-2 bg-sky-700 text-white text-[8px] font-black uppercase tracking-wider hover:bg-sky-800 transition-all disabled:opacity-50"
                  :disabled="activatingId !== null"
                  @click="activateSemester(sem)"
                >
                  {{ activatingId === sem.id ? 'Activating...' : 'Set Active' }}
                </button>
              </div>
            </div>
            <div class="text-[10px] font-bold text-text-muted tabular-nums mb-3">
              {{ formatDate(sem.start_date) }} — {{ formatDate(sem.end_date) }}
            </div>
            <div class="grid grid-cols-2 gap-2 mb-3">
              <div v-for="item in countItems(sem)" :key="item.label" class="rounded-control bg-surface border border-surface-border px-2 py-1.5">
                <div class="text-[8px] font-black uppercase tracking-widest text-text-muted">{{ item.label }}</div>
                <div class="text-xs font-black tabular-nums text-slate-800">{{ item.value }}</div>
              </div>
            </div>
            <div v-if="isSuperCoordinator" class="flex items-center justify-between pt-3 border-t border-surface-border">
              <span class="text-[9px] font-bold text-text-muted">Created: {{ formatDate(sem.created_at) }}</span>
              <div class="flex gap-2">
                <button class="h-7 w-7 border border-surface-control text-text-muted hover:bg-surface-hover flex items-center justify-center rounded-control" title="Edit semester" @click="openEditForm(sem)">
                  <i class="pi pi-pencil text-[8px]"></i>
                </button>
                <button v-if="sem.is_active" class="rounded-control h-7 w-7 border border-surface-border text-text-muted opacity-50 cursor-not-allowed flex items-center justify-center" disabled title="Cannot delete active semester">
                  <i class="pi pi-trash text-[8px]"></i>
                </button>
                <button v-else class="rounded-control h-7 w-7 border border-slate-900 text-slate-800 flex items-center justify-center disabled:opacity-50" :disabled="deletingId !== null" title="Review deletion" @click="openDelete(sem)">
                  <i class="pi pi-trash text-[8px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] bg-surface-muted border-b border-surface-border">
                <th class="px-8 py-6">Semester</th>
                <th class="px-8 py-6">Period</th>
                <th class="px-8 py-6">Records</th>
                <th class="px-8 py-6">Status</th>
                <th v-if="isSuperCoordinator" class="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-border text-xs">
              <tr v-for="sem in semesters" :key="sem.id" class="hover:bg-surface-hover transition-all group">
                <td class="px-8 py-6">
                  <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ sem.name }}</div>
                  <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">Created {{ formatDate(sem.created_at) }}</div>
                </td>
                <td class="px-8 py-6">
                  <span class="font-bold text-text-muted tabular-nums text-xs">
                    {{ formatDate(sem.start_date) }} — {{ formatDate(sem.end_date) }}
                  </span>
                </td>
                <td class="px-8 py-6">
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-bold uppercase tracking-tighter text-text-muted">
                    <span v-for="item in countItems(sem)" :key="item.label">
                      <span class="text-slate-800 tabular-nums">{{ item.value }}</span> {{ item.label }}
                    </span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center gap-2">
                    <span class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter" :class="sem.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-muted text-text-muted'">
                      {{ sem.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    <button
                      v-if="isSuperCoordinator && !sem.is_active"
                      class="rounded-control h-6 px-2 bg-sky-700 text-white text-[8px] font-black uppercase tracking-wider hover:bg-sky-800 transition-all disabled:opacity-50"
                      :disabled="activatingId !== null"
                      @click="activateSemester(sem)"
                    >
                      {{ activatingId === sem.id ? 'Activating...' : 'Set Active' }}
                    </button>
                  </div>
                </td>
                <td v-if="isSuperCoordinator" class="px-8 py-6 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button class="h-8 w-8 border border-surface-control text-text-muted hover:bg-surface-hover rounded-control transition-all" title="Edit semester" @click="openEditForm(sem)">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button v-if="sem.is_active" class="h-8 w-8 border border-surface-border text-text-muted opacity-50 cursor-not-allowed flex items-center justify-center rounded-control" disabled title="Cannot delete active semester">
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                    <button v-else class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50" :disabled="deletingId !== null" title="Review deletion" @click="openDelete(sem)">
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </article>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
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

    <div v-if="showDelete && deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
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
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

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
const isLoading = ref(false)
const isSaving = ref(false)
const activatingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
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

onMounted(loadSemesters)
</script>
