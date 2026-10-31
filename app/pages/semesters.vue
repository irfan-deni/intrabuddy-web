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
                <button v-if="isSuperCoordinator && !sem.is_active" class="rounded-control h-6 px-2 bg-sky-700 text-white text-[8px] font-black uppercase tracking-wider hover:bg-sky-800 transition-all" @click="activateSemester(sem.id)">Set Active</button>
              </div>
            </div>
            <div class="text-[10px] font-bold text-text-muted tabular-nums mb-3">
              {{ formatDate(sem.start_date) }} — {{ formatDate(sem.end_date) }}
            </div>
            <div v-if="isSuperCoordinator" class="flex items-center justify-between pt-3 border-t border-surface-border">
              <span class="text-[9px] font-bold text-text-muted">Created: {{ formatDate(sem.created_at) }}</span>
              <div class="flex gap-2">
                <button class="h-7 w-7 border border-surface-control text-text-muted hover:bg-surface-hover flex items-center justify-center rounded-control" @click="openEditForm(sem)">
                  <i class="pi pi-pencil text-[8px]"></i>
                </button>
                <button v-if="sem.is_active" class="rounded-control h-7 w-7 border border-surface-border text-text-muted opacity-50 cursor-not-allowed flex items-center justify-center" disabled title="Cannot delete active semester">
                  <i class="pi pi-trash text-[8px]"></i>
                </button>
                <button v-else class="rounded-control h-7 w-7 border border-slate-900 text-slate-800 flex items-center justify-center" @click="deleteSemester(sem.id)">
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
                <th class="px-8 py-6">Status</th>
                <th class="px-8 py-6">Created</th>
                <th v-if="isSuperCoordinator" class="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-border text-xs">
              <tr v-for="sem in semesters" :key="sem.id" class="hover:bg-surface-hover transition-all group">
                <td class="px-8 py-6">
                  <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ sem.name }}</div>
                </td>
                <td class="px-8 py-6">
                  <span class="font-bold text-text-muted tabular-nums text-xs">
                    {{ formatDate(sem.start_date) }} — {{ formatDate(sem.end_date) }}
                  </span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center gap-2">
                    <span class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter" :class="sem.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-muted text-text-muted'">
                      {{ sem.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    <button v-if="isSuperCoordinator && !sem.is_active" class="rounded-control h-6 px-2 bg-sky-700 text-white text-[8px] font-black uppercase tracking-wider hover:bg-sky-800 transition-all" @click="activateSemester(sem.id)">Set Active</button>
                  </div>
                </td>
                <td class="px-8 py-6 text-text-muted font-bold text-[10px]">
                  {{ formatDate(sem.created_at) }}
                </td>
                <td v-if="isSuperCoordinator" class="px-8 py-6 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button class="h-8 w-8 border border-surface-control text-text-muted hover:bg-surface-hover rounded-control transition-all" @click="openEditForm(sem)">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button v-if="sem.is_active" class="h-8 w-8 border border-surface-border text-text-muted opacity-50 cursor-not-allowed flex items-center justify-center rounded-control" disabled title="Cannot delete active semester">
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                    <button v-else class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all" @click="deleteSemester(sem.id)">
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
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

definePageMeta({
  requiredRole: 'coordinator'
})

type SemesterRow = Database['public']['Tables']['semesters']['Row']

const supabase = useSupabaseClient<Database>()
const pageCache = usePageCache()
const activeSemesterName = useState<string | null>('active-semester-name', () => null)
const { isSuperCoordinator } = useCoordinatorPrivileges()

const semesters = ref<SemesterRow[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', start_date: '', end_date: '' })

const loadSemesters = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .order('start_date', { ascending: false })
    if (error) throw error
    semesters.value = (data || []) as SemesterRow[]
    activeSemesterName.value = semesters.value.find(semester => semester.is_active)?.name || ''
  } catch (error: any) {
    errorMessage.value = 'Sync failed'
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

const openEditForm = (sem: SemesterRow) => {
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
    errorMessage.value = 'Save failed'
  } finally {
    isSaving.value = false
  }
}

const activateSemester = async (id: number) => {
  try {
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'semester.activate', payload: { id } } })
    successMessage.value = 'Semester activated'
    pageCache.clear()
    await loadSemesters()
  } catch (error: any) {
    errorMessage.value = 'Activation failed'
  }
}

const deleteSemester = async (id: number) => {
  if (!confirm('Permanently remove this semester?')) return
  try {
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'semester.delete', payload: { id } } })
    successMessage.value = 'Semester removed'
    pageCache.clear()
    await loadSemesters()
  } catch (error: any) {
    errorMessage.value = 'Delete failed'
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
