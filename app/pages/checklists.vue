<template>
  <div class="app-surface-ui space-y-6 md:space-y-8">
    <header class="flex flex-col md:flex-row flex-wrap md:items-end justify-between gap-6">
      <div>
        <h1 class="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">Submission Requirements</h1>
        <p class="mt-2 text-sm font-normal leading-relaxed text-text-muted">Global requirements template for the active semester.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button
          class="bg-sky-700 text-white px-4 py-3 rounded-control text-sm font-semibold whitespace-nowrap hover:bg-sky-800 transition-all flex items-center gap-2"
          title="Export Non-Compliance Report"
          aria-label="Export Non-Compliance Report"
          @click="downloadNonComplianceReport"
        >
          <i class="pi pi-file-pdf"></i>
          Export PDF
        </button>
        <button
          v-if="isSuperCoordinator"
          class="bg-surface-muted border border-surface-control text-text-muted px-6 py-3 rounded-control text-sm font-semibold hover:bg-surface-hover transition-all flex items-center gap-3"
          @click="importTemplate"
        >
          <i class="pi pi-copy"></i>
          Import Template
        </button>
        <button
          v-if="isSuperCoordinator"
          class="bg-sky-700 text-white px-6 py-3 rounded-control text-sm font-semibold hover:bg-sky-800 transition-all flex items-center gap-3"
          @click="openAddForm"
        >
          <i class="pi pi-plus"></i>
          New Requirement
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="rounded-card p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest flex items-center justify-between gap-4">
      <span>{{ errorMessage }}</span>
      <button type="button" class="rounded-control shrink-0 border border-rose-300 px-3 py-2 hover:bg-rose-100 transition-colors" @click="loadTemplates(true)">Retry</button>
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

      <div v-else-if="templates.length === 0" class="py-12 md:py-20 text-center text-text-muted font-black uppercase tracking-widest text-[10px]">No templates defined</div>

      <template v-else>
        <div class="block md:hidden space-y-3 p-4">
          <div
            v-for="(item, index) in templates" :key="item.id"
            :draggable="!!isSuperCoordinator"
            class="rounded-card bg-surface-muted border border-surface-border p-4"
            :class="{ 'opacity-50': draggedItemIndex === index }"
            @dragstart="onDragStart(index)"
            @dragenter.prevent="onDragEnter(index)"
            @dragover.prevent
            @drop="onDrop(index)"
            @dragend="onDragEnd"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ item.title }}</div>
                <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">{{ item.description || 'No additional details' }}</div>
              </div>
              <div class="flex flex-col items-end gap-2 flex-shrink-0">
                <span v-if="item.required" class="rounded-badge px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-tighter">Required</span>
                <span v-else class="text-text-muted font-bold uppercase text-[9px]">Optional</span>
                <div v-if="isSuperCoordinator" class="flex gap-2 mt-2">
                  <button class="rounded-control h-7 w-7 bg-slate-900 text-white flex items-center justify-center" @click="openEditForm(item)">
                    <i class="pi pi-pencil text-[8px]"></i>
                  </button>
                  <button class="rounded-control h-7 w-7 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center" @click="deleteTemplate(item.id)">
                    <i class="pi pi-trash text-[8px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] bg-surface-muted border-b border-surface-border">
                <th v-if="isSuperCoordinator" class="px-4 py-6 w-12"></th>
                <th class="px-8 py-6">Order</th>
                <th class="px-8 py-6">Requirement Title</th>
                <th class="px-8 py-6">Mandatory</th>
                <th v-if="isSuperCoordinator" class="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-border text-xs">
              <tr
                v-for="(item, index) in templates" :key="item.id"
                :draggable="!!isSuperCoordinator"
                class="hover:bg-surface-hover transition-all group"
                :class="{ 'opacity-50': draggedItemIndex === index, 'ring-2 ring-sky-500': draggedOverItemIndex === index && draggedItemIndex !== null }"
                @dragstart="onDragStart(index)"
                @dragenter.prevent="onDragEnter(index)"
                @dragover.prevent
                @drop="onDrop(index)"
                @dragend="onDragEnd"
              >
                <td v-if="isSuperCoordinator" class="px-4 py-6">
                  <span class="inline-flex cursor-move text-text-muted hover:text-slate-800 transition-colors">
                    <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
                      <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                      <circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
                    </svg>
                  </span>
                </td>
                <td class="px-8 py-6 font-black text-text-muted tabular-nums">{{ item.display_order }}</td>
                <td class="px-8 py-6">
                  <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ item.title }}</div>
                  <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">{{ item.description || 'No additional details' }}</div>
                </td>
                <td class="px-8 py-6">
                  <span v-if="item.required" class="rounded-badge px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-tighter">Required</span>
                  <span v-else class="text-text-muted font-bold uppercase text-[9px]">Optional</span>
                </td>
                <td v-if="isSuperCoordinator" class="px-8 py-6 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button class="rounded-control h-8 w-8 bg-slate-900 text-white hover:brightness-150 transition-all" @click="openEditForm(item)">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all" @click="deleteTemplate(item.id)">
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

    <!-- Modal Form -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-lg p-6 sm:p-10 border border-surface-border shadow-2xl relative mx-4 sm:mx-0">
        <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="showForm = false">
          <i class="pi pi-times"></i>
        </button>
        
        <h2 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-8">{{ editingId ? 'Edit Requirement' : 'New Requirement' }}</h2>
        
        <form @submit.prevent="saveTemplate" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="md:col-span-3 space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Title</label>
              <input v-model="form.title" type="text" required class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Order</label>
              <input v-model="form.display_order" type="number" required class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all tabular-nums text-slate-800">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>

          <div class="flex items-center gap-3 group cursor-pointer" @click="form.required = !form.required">
            <div class="rounded-badge h-5 w-5 border-2 border-slate-500 flex items-center justify-center transition-all" :class="form.required ? 'bg-slate-900 border-slate-900' : 'bg-surface-muted'">
              <i v-if="form.required" class="pi pi-check text-[10px] text-white"></i>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-800">Mandatory for all students</span>
          </div>
          
          <button type="submit" :disabled="isSaving" class="rounded-control w-full bg-sky-700 text-white h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sky-800 transition-all disabled:opacity-30 mt-4">
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
import { generateReport } from '~/utils/pdfGenerator'

definePageMeta({
  requiredRole: 'coordinator'
})

type TemplateRow = Database['public']['Tables']['checklist_templates']['Row']
type ChecklistResponse = { semesterId: number | null; templates: TemplateRow[] }

const supabase = useSupabaseClient<Database>()
const pageCache = usePageCache()
const { isSuperCoordinator } = useCoordinatorPrivileges()

const cachedChecklists = pageCache.read<ChecklistResponse>('/api/checklists')
const templates = ref<TemplateRow[]>(cachedChecklists?.templates || [])
const activeSemesterId = ref<number | null>(cachedChecklists?.semesterId || null)

const isLoading = ref(!cachedChecklists)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const showForm = ref(false)
const isImporting = ref(false)
const draggedItemIndex = ref<number | null>(null)
const draggedOverItemIndex = ref<number | null>(null)
const editingId = ref<number | null>(null)

const form = ref({
  title: '',
  description: '',
  display_order: 1,
  required: true
})

const loadFromSupabase = async (): Promise<ChecklistResponse> => {
  const { data: semesters, error: semesterError } = await supabase
    .from('semesters')
    .select('id')
    .eq('is_active', true)
    .limit(1)

  if (semesterError) throw semesterError
  const semester = semesters?.[0]
  if (!semester) return { semesterId: null, templates: [] }

  const { data: templates, error } = await supabase
    .from('checklist_templates')
    .select('*')
    .eq('semester_id', semester.id)
    .order('display_order', { ascending: true })

  if (error) throw error
  return { semesterId: semester.id, templates: templates || [] }
}

const loadTemplates = async (force = false) => {
  const cached = pageCache.read<ChecklistResponse>('/api/checklists')
  if (cached) {
    templates.value = cached.templates
    activeSemesterId.value = cached.semesterId
  }
  isLoading.value = !cached
  errorMessage.value = ''
  
  try {
    let data: ChecklistResponse
    if (!cached || force) {
      // Preserve the original first-load path; navigation prefetches can still
      // populate this cache through the server endpoint when available.
      data = await loadFromSupabase()
      pageCache.set('/api/checklists', data)
    } else {
      try {
        data = await pageCache.fetch<ChecklistResponse>('/api/checklists')
      } catch {
        // Keep the visible snapshot if the optional refresh endpoint fails.
        data = cached
      }
    }
    activeSemesterId.value = data.semesterId
    templates.value = data.templates
    if (!data.semesterId) {
      errorMessage.value = 'No active semester set'
      return
    }
  } catch {
    errorMessage.value = 'Unable to load checklist templates. Please try again.'
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
  if (!activeSemesterId.value) return
  
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const payload = {
      title: form.value.title,
      description: form.value.description || null,
      display_order: form.value.display_order,
      required: form.value.required,
      semester_id: activeSemesterId.value
    }
    
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'template.save', payload: { ...payload, id: editingId.value } } })
    
    successMessage.value = 'Template updated'
    showForm.value = false
    pageCache.invalidate('/api/checklists')
    await loadTemplates(true)
  } catch (error: any) {
    errorMessage.value = 'Save failed'
  } finally {
    isSaving.value = false
  }
}

const deleteTemplate = async (id: number) => {
  if (!confirm('Discard template?')) return
  
  try {
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'template.delete', payload: { id } } })
    successMessage.value = 'Template removed'
    pageCache.invalidate('/api/checklists')
    await loadTemplates(true)
  } catch (error: any) {
    errorMessage.value = 'Delete failed'
  }
}

const importTemplate = async () => {
  if (!activeSemesterId.value) return
  if (!confirm('Are you sure you want to import requirements from the previous semester? This will add to your current list.')) return

  isImporting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await $fetch<{ imported: number }>('/api/administration/configuration', { method: 'POST', body: { action: 'template.import', payload: { semester_id: activeSemesterId.value } } })
    successMessage.value = `Imported ${result.imported} template(s) from previous semester`
    pageCache.invalidate('/api/checklists')
    await loadTemplates(true)
  } catch (err: any) {
    errorMessage.value = err.message || 'Import failed'
  } finally {
    isImporting.value = false
  }
}

const onDragStart = (index: number) => {
  draggedItemIndex.value = index
}

const onDragEnter = (index: number) => {
  if (index !== draggedItemIndex.value) draggedOverItemIndex.value = index
}

const onDrop = async (index: number) => {
  if (draggedItemIndex.value === null || draggedItemIndex.value === index) { onDragEnd(); return }

  const items = [...templates.value]
  const moved = items.splice(draggedItemIndex.value, 1)[0]
  if (!moved) { onDragEnd(); return }
  items.splice(index, 0, moved)

  items.forEach((item, i) => { item.display_order = i + 1 })
  templates.value = items

  onDragEnd()

  try {
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'template.reorder', payload: { semester_id: activeSemesterId.value, ids: templates.value.map(item => item.id) } } })
    pageCache.invalidate('/api/checklists')
  } catch {
    errorMessage.value = 'Failed to save order'
    pageCache.invalidate('/api/checklists')
    await loadTemplates(true)
  }
}

const onDragEnd = () => {
  draggedItemIndex.value = null
  draggedOverItemIndex.value = null
}

const downloadNonComplianceReport = async () => {
  if (!activeSemesterId.value) return

  const { data: studentSemesters } = await supabase
    .from('student_semesters')
    .select('student_id')
    .eq('semester_id', activeSemesterId.value)

  const enrolledIds = (studentSemesters || []).map(s => s.student_id).filter(Boolean) as string[]
  if (!enrolledIds.length) { alert('No students enrolled in active semester'); return }

  const [{ data: requiredTpls }, { data: profiles }, { data: checklists }] = await Promise.all([
    supabase.from('checklist_templates').select('id, title').eq('semester_id', activeSemesterId.value).eq('required', true),
    supabase.from('users').select('id, full_name, student_id').eq('role', 'student').in('id', enrolledIds),
    supabase.from('student_checklists').select('student_id, checklist_item_id, is_completed').in('student_id', enrolledIds)
  ])

  const rows: string[][] = []
  for (const student of profiles || []) {
    const studentItems = checklists?.filter(c => c.student_id === student.id) || []
    const missing = (requiredTpls || []).filter(t => {
      const item = studentItems.find(c => c.checklist_item_id === t.id)
      return !item || !item.is_completed
    })
    if (missing.length) {
      rows.push([student.full_name, student.student_id || '---', missing.map(t => t.title).join(', '), 'Non-Compliant'])
    }
  }

  if (!rows.length) { alert('All students are compliant'); return }

  generateReport('Cohort Readiness Report - Non-Compliance', ['Student Name', 'ID', 'Missing Milestones', 'Status'], rows, 'Cohort_Readiness_Report.pdf', { columnStyles: { 0: { fontStyle: 'bold' } } })
}

onMounted(() => {
  void loadTemplates()
})
</script>
