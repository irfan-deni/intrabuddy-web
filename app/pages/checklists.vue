<template>
  <div class="space-y-12">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
      <div>
        <h1 class="text-4xl font-black text-brand-navy tracking-tight uppercase">Master Checklist</h1>
        <p class="text-text-muted mt-2 font-bold uppercase text-[10px] tracking-widest">Global requirements template for the active cohort.</p>
      </div>
      <button
        v-if="isSuperCoordinator"
        class="bg-brand-cyan text-brand-navy px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center gap-3"
        @click="openAddForm"
      >
        <i class="pi pi-plus"></i>
        New Requirement
      </button>
    </header>

    <div v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="p-4 bg-brand-navy text-white text-[10px] font-black uppercase tracking-widest">
      {{ successMessage }}
    </div>

    <article class="bg-white border border-slate-100 shadow-sm relative overflow-hidden">
      <div v-if="isLoading" class="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
        <i class="pi pi-spin pi-spinner text-2xl text-brand-cyan"></i>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black text-text-veryMuted uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
              <th class="px-8 py-6">Order</th>
              <th class="px-8 py-6">Requirement Title</th>
              <th class="px-8 py-6">Mandatory</th>
              <th v-if="isSuperCoordinator" class="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 text-xs">
            <tr v-if="templates.length === 0 && !isLoading">
              <td colspan="4" class="px-8 py-20 text-center text-text-veryMuted font-black uppercase tracking-widest">No templates defined</td>
            </tr>
            <tr v-for="item in templates" :key="item.id" class="hover:bg-slate-50 transition-all group">
              <td class="px-8 py-6 font-black text-text-veryMuted tabular-nums">{{ item.display_order }}</td>
              <td class="px-8 py-6">
                <div class="font-black text-brand-navy uppercase tracking-tight">{{ item.title }}</div>
                <div class="text-[9px] font-bold text-text-veryMuted uppercase tracking-tighter mt-1">{{ item.description || 'No additional details' }}</div>
              </td>
              <td class="px-8 py-6">
                <span v-if="item.required" class="px-2 py-0.5 bg-brand-navy text-white text-[9px] font-black uppercase tracking-tighter">Required</span>
                <span v-else class="text-text-veryMuted font-bold uppercase text-[9px]">Optional</span>
              </td>
              <td v-if="isSuperCoordinator" class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button class="h-8 w-8 flex items-center justify-center bg-brand-navy text-white hover:brightness-150 transition-all" @click="openEditForm(item)">
                    <i class="pi pi-pencil text-[10px]"></i>
                  </button>
                  <button class="h-8 w-8 flex items-center justify-center border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white transition-all" @click="deleteTemplate(item.id)">
                    <i class="pi pi-trash text-[10px]"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <!-- Modal Form -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/80 backdrop-blur-sm p-6">
      <div class="bg-white w-full max-w-lg p-10 border border-slate-100 shadow-2xl relative">
        <button class="absolute top-6 right-6 text-slate-300 hover:text-brand-navy transition-colors" @click="showForm = false">
          <i class="pi pi-times"></i>
        </button>
        
        <h2 class="text-xl font-black text-brand-navy uppercase tracking-widest mb-8">{{ editingId ? 'Edit Requirement' : 'New Requirement' }}</h2>
        
        <form @submit.prevent="saveTemplate" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="md:col-span-3 space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Title</label>
              <input v-model="form.title" type="text" required class="w-full bg-white border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-brand-cyan outline-none transition-all text-brand-navy">
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Order</label>
              <input v-model="form.display_order" type="number" required class="w-full bg-white border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-brand-cyan outline-none transition-all tabular-nums text-brand-navy">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full bg-white border border-slate-100 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-brand-cyan outline-none transition-all resize-none text-brand-navy"></textarea>
          </div>

          <div class="flex items-center gap-3 group cursor-pointer" @click="form.required = !form.required">
            <div class="h-5 w-5 border border-brand-navy flex items-center justify-center transition-all" :class="form.required ? 'bg-brand-navy' : 'bg-white'">
              <i v-if="form.required" class="pi pi-check text-[10px] text-white"></i>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-brand-navy">Mandatory for all students</span>
          </div>
          
          <button type="submit" :disabled="isSaving" class="w-full bg-brand-cyan text-brand-navy h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-30 mt-4">
            {{ isSaving ? 'Processing...' : 'Save Template' }}
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

type TemplateRow = Database['public']['Tables']['checklist_templates']['Row']

const supabase = useSupabaseClient<Database>()
const { isSuperCoordinator } = useCoordinatorPrivileges()

const templates = ref<TemplateRow[]>([])
const activeCohortId = ref<number | null>(null)

const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const showForm = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  title: '',
  description: '',
  display_order: 1,
  required: true
})

const loadTemplates = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('id')
      .eq('is_active', true)
      .single()
      
    if (cohortError) throw cohortError
    activeCohortId.value = cohort.id
    
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('cohort_id', cohort.id)
      .order('display_order', { ascending: true })
      
    if (error) throw error
    templates.value = data || []
  } catch (error: any) {
    errorMessage.value = 'Sync failed'
  } finally {
    isLoading.value = false
  }
}

const openAddForm = () => {
  editingId.value = null
  form.value = {
    title: '',
    description: '',
    display_order: templates.value.length + 1,
    required: true
  }
  showForm.value = true
  successMessage.value = ''
}

const openEditForm = (item: TemplateRow) => {
  editingId.value = item.id
  form.value = {
    title: item.title,
    description: item.description || '',
    display_order: item.display_order || 0,
    required: item.required ?? true
  }
  showForm.value = true
  successMessage.value = ''
}

const saveTemplate = async () => {
  if (!activeCohortId.value) return
  
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const payload = {
      title: form.value.title,
      description: form.value.description || null,
      display_order: form.value.display_order,
      required: form.value.required,
      cohort_id: activeCohortId.value
    }
    
    if (editingId.value) {
      const { error } = await supabase.from('checklist_templates').update(payload).eq('id', editingId.value)
      if (error) throw error
    } else {
      const { error } = await supabase.from('checklist_templates').insert(payload)
      if (error) throw error
    }
    
    successMessage.value = 'Template updated'
    showForm.value = false
    await loadTemplates()
  } catch (error: any) {
    errorMessage.value = 'Save failed'
  } finally {
    isSaving.value = false
  }
}

const deleteTemplate = async (id: number) => {
  if (!confirm('Discard template?')) return
  
  try {
    const { error } = await supabase.from('checklist_templates').delete().eq('id', id)
    if (error) throw error
    successMessage.value = 'Template removed'
    await loadTemplates()
  } catch (error: any) {
    errorMessage.value = 'Delete failed'
  }
}

onMounted(() => {
  void loadTemplates()
})
</script>
