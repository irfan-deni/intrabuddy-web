<template>
  <div class="space-y-6 md:space-y-12">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6 md:pb-8">
      <div>
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Cohort Management</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Academic semester configuration and lifecycle.</p>
      </div>
      <button
        v-if="isSuperCoordinator"
        class="bg-sky-600 text-white px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center gap-3"
        @click="openAddForm"
      >
        <i class="pi pi-plus"></i>
        New Cohort
      </button>
    </header>

    <div v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
      {{ successMessage }}
    </div>

    <article class="bg-white border border-stone-200 shadow-sm relative overflow-hidden">
      <div v-if="isLoading" class="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
        <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
      </div>

      <div v-if="isLoading" class="p-12 text-center">
        <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
      </div>

      <div v-else-if="cohorts.length === 0" class="py-12 md:py-20 text-center text-stone-400 font-black uppercase tracking-widest text-[10px]">No cohorts defined</div>

      <template v-else>
        <div class="block md:hidden space-y-3 p-4">
          <div v-for="cohort in cohorts" :key="cohort.id" class="border border-stone-200 p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ cohort.name }}</div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap" :class="cohort.is_active ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'">
                  {{ cohort.is_active ? 'Active' : 'Inactive' }}
                </span>
                <button v-if="isSuperCoordinator && !cohort.is_active" class="h-6 px-2 bg-sky-600 text-white text-[8px] font-black uppercase tracking-wider hover:brightness-110 transition-all" @click="activateCohort(cohort.id)">Set Active</button>
              </div>
            </div>
            <div class="text-[10px] font-bold text-stone-500 tabular-nums mb-3">
              {{ new Date(cohort.start_date).toLocaleDateString() }} — {{ new Date(cohort.end_date).toLocaleDateString() }}
            </div>
            <div v-if="isSuperCoordinator" class="flex items-center justify-between pt-3 border-t border-stone-100">
              <span class="text-[9px] font-bold text-stone-400">Created: {{ cohort.created_at ? new Date(cohort.created_at).toLocaleDateString() : '---' }}</span>
              <div class="flex gap-2">
                <button class="h-7 w-7 bg-slate-900 text-white flex items-center justify-center" @click="openEditForm(cohort)">
                  <i class="pi pi-pencil text-[8px]"></i>
                </button>
                <button class="h-7 w-7 border border-slate-900 text-slate-800 flex items-center justify-center" :disabled="!!cohort.is_active" @click="deleteCohort(cohort.id)">
                  <i class="pi pi-trash text-[8px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50 border-b border-stone-200">
                <th class="px-8 py-6">Cohort</th>
                <th class="px-8 py-6">Period</th>
                <th class="px-8 py-6">Status</th>
                <th class="px-8 py-6">Created</th>
                <th v-if="isSuperCoordinator" class="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 text-xs">
              <tr v-for="cohort in cohorts" :key="cohort.id" class="hover:bg-stone-50 transition-all group">
                <td class="px-8 py-6">
                  <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ cohort.name }}</div>
                </td>
                <td class="px-8 py-6">
                  <span class="font-bold text-stone-500 tabular-nums text-xs">
                    {{ new Date(cohort.start_date).toLocaleDateString() }} — {{ new Date(cohort.end_date).toLocaleDateString() }}
                  </span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter" :class="cohort.is_active ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'">
                      {{ cohort.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    <button v-if="isSuperCoordinator && !cohort.is_active" class="h-6 px-2 bg-sky-600 text-white text-[8px] font-black uppercase tracking-wider hover:brightness-110 transition-all" @click="activateCohort(cohort.id)">Set Active</button>
                  </div>
                </td>
                <td class="px-8 py-6 text-stone-400 font-bold text-[10px]">
                  {{ cohort.created_at ? new Date(cohort.created_at).toLocaleDateString() : '---' }}
                </td>
                <td v-if="isSuperCoordinator" class="px-8 py-6 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button class="h-8 w-8 bg-slate-900 text-white hover:brightness-150 transition-all" @click="openEditForm(cohort)">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button class="h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all" :disabled="!!cohort.is_active" :title="cohort.is_active ? 'Cannot delete active cohort' : ''" @click="deleteCohort(cohort.id)">
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
      <div class="bg-white w-full max-w-lg p-6 sm:p-10 border border-stone-200 shadow-2xl relative mx-4 sm:mx-0">
        <button class="absolute top-6 right-6 text-stone-400 hover:text-slate-800 transition-colors" @click="showForm = false">
          <i class="pi pi-times"></i>
        </button>

        <h2 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-8">{{ editingId ? 'Edit Cohort' : 'New Cohort' }}</h2>

        <form @submit.prevent="saveCohort" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Cohort Name</label>
            <input v-model="form.name" type="text" required placeholder="e.g., Jan-Jun 2026"
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Start Date</label>
              <input v-model="form.start_date" type="date" required
                class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">End Date</label>
              <input v-model="form.end_date" type="date" required
                class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
            </div>
          </div>

          <button type="submit" :disabled="isSaving" class="w-full bg-sky-600 text-white h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-30 mt-4">
            {{ isSaving ? 'Processing...' : editingId ? 'Update Cohort' : 'Create Cohort' }}
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

type CohortRow = Database['public']['Tables']['cohorts']['Row']

const supabase = useSupabaseClient<Database>()
const { isSuperCoordinator } = useCoordinatorPrivileges()

const cohorts = ref<CohortRow[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', start_date: '', end_date: '' })

const loadCohorts = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data, error } = await supabase
      .from('cohorts')
      .select('*')
      .order('start_date', { ascending: false })
    if (error) throw error
    cohorts.value = (data || []) as CohortRow[]
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

const openEditForm = (cohort: CohortRow) => {
  editingId.value = cohort.id
  form.value = {
    name: cohort.name,
    start_date: (cohort.start_date || '').split('T')[0] || '',
    end_date: (cohort.end_date || '').split('T')[0] || ''
  }
  showForm.value = true
  successMessage.value = ''
}

const saveCohort = async () => {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      name: form.value.name,
      start_date: form.value.start_date,
      end_date: form.value.end_date
    }

    if (editingId.value) {
      const { error } = await supabase.from('cohorts').update(payload).eq('id', editingId.value)
      if (error) throw error
    } else {
      const { error } = await supabase.from('cohorts').insert(payload)
      if (error) throw error
    }

    successMessage.value = editingId.value ? 'Cohort updated' : 'Cohort created'
    showForm.value = false
    await loadCohorts()
  } catch (error: any) {
    errorMessage.value = 'Save failed'
  } finally {
    isSaving.value = false
  }
}

const activateCohort = async (id: number) => {
  try {
    await supabase.from('cohorts').update({ is_active: false }).neq('id', id)
    await supabase.from('cohorts').update({ is_active: true }).eq('id', id)
    successMessage.value = 'Cohort activated'
    await loadCohorts()
  } catch (error: any) {
    errorMessage.value = 'Activation failed'
  }
}

const deleteCohort = async (id: number) => {
  if (!confirm('Permanently remove this cohort?')) return
  try {
    const { error } = await supabase.from('cohorts').delete().eq('id', id)
    if (error) throw error
    successMessage.value = 'Cohort removed'
    await loadCohorts()
  } catch (error: any) {
    errorMessage.value = 'Delete failed'
  }
}

onMounted(loadCohorts)
</script>
