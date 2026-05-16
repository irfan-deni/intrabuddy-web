<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Master Checklist</h1>
      <p class="mt-1 text-slate-500">Manage pre-internship checklist templates for the active cohort.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <p v-if="successMessage" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {{ successMessage }}
    </p>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Checklist Items</h2>
        <button
          v-if="isSuperCoordinator"
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          @click="openAddForm"
        >
          <i class="pi pi-plus mr-2"></i> Add Item
        </button>
      </div>

      <div v-if="isLoading" class="py-8 text-center text-slate-400">
        <i class="pi pi-spin pi-spinner mr-2" />
        Loading templates...
      </div>

      <div v-else-if="templates.length === 0" class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No checklist templates found for this cohort.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th class="px-4 py-3 font-medium">Order</th>
              <th class="px-4 py-3 font-medium">Title</th>
              <th class="px-4 py-3 font-medium">Required</th>
              <th v-if="isSuperCoordinator" class="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in templates" :key="item.id" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3">{{ item.display_order }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-slate-900">{{ item.title }}</div>
                <div class="text-xs text-slate-500 truncate max-w-sm">{{ item.description }}</div>
              </td>
              <td class="px-4 py-3">
                <span v-if="item.required" class="text-cyan-600 font-medium"><i class="pi pi-check"></i> Yes</span>
                <span v-else class="text-slate-400">No</span>
              </td>
              <td v-if="isSuperCoordinator" class="px-4 py-3 text-right">
                <button
                  class="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition mr-2"
                  title="Edit"
                  @click="openEditForm(item)"
                >
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  class="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                  title="Delete"
                  @click="deleteTemplate(item.id)"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <!-- Simple Add/Edit Form below the table -->
    <article v-if="showForm" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-slate-900">{{ editingId ? 'Edit Checklist Item' : 'Add New Item' }}</h2>
      <form class="space-y-4" @submit.prevent="saveTemplate">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block text-sm font-medium text-slate-700">
            Title
            <input
              v-model="form.title"
              type="text"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Display Order
            <input
              v-model="form.display_order"
              type="number"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
          </label>
        </div>

        <label class="block text-sm font-medium text-slate-700">
          Description (optional)
          <textarea
            v-model="form.description"
            rows="2"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          ></textarea>
        </label>

        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input v-model="form.required" type="checkbox" class="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded">
          Required for Placement
        </label>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            :disabled="isSaving"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save Item' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="showForm = false"
          >
            Cancel
          </button>
        </div>
      </form>
    </article>
  </section>
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
    // 1. Get active cohort
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('id')
      .eq('is_active', true)
      .single()
      
    if (cohortError) throw cohortError
    
    activeCohortId.value = cohort.id
    
    // 2. Fetch templates for this cohort
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('cohort_id', cohort.id)
      .order('display_order', { ascending: true })
      
    if (error) throw error
    
    templates.value = data || []
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load templates.'
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
      const { error } = await supabase
        .from('checklist_templates')
        .update(payload)
        .eq('id', editingId.value)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('checklist_templates')
        .insert(payload)
      if (error) throw error
    }
    
    successMessage.value = 'Checklist template saved successfully.'
    showForm.value = false
    await loadTemplates()
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save template.'
  } finally {
    isSaving.value = false
  }
}

const deleteTemplate = async (id: number) => {
  if (!confirm('Are you sure you want to delete this checklist item?')) return
  
  try {
    const { error } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    
    successMessage.value = 'Checklist template deleted.'
    await loadTemplates()
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to delete template.'
  }
}

onMounted(() => {
  void loadTemplates()
})
</script>
