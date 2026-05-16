<template>
  <div class="space-y-10">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">FAQ Base</h1>
        <p class="text-slate-500 mt-1.5">Manage the knowledge base for student self-service.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
          @click="openAddModal"
        >
          <i class="pi pi-plus text-xs"></i>
          New Article
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-sm">
      <i class="pi pi-exclamation-circle text-lg"></i>
      {{ errorMessage }}
    </div>

    <!-- Search Bar -->
    <div class="bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm">
      <div class="relative w-full">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search articles by title or keywords..."
          class="w-full pl-11 pr-4 py-3 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
        >
      </div>
    </div>

    <!-- FAQ Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-if="isLoading" class="md:col-span-2 py-20 text-center text-slate-400 flex flex-col items-center gap-3">
        <i class="pi pi-spin pi-spinner text-3xl text-slate-200"></i>
        <p class="text-sm">Loading articles...</p>
      </div>
      
      <div v-else-if="filteredFaqs.length === 0" class="md:col-span-2 py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
        <i class="pi pi-question-circle text-4xl mb-4 text-slate-200"></i>
        <p class="text-sm font-medium text-slate-400">No articles found matching your search.</p>
      </div>

      <div 
        v-for="faq in filteredFaqs" 
        :key="faq.id" 
        class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all group flex flex-col"
      >
        <div class="flex justify-between items-start gap-4 mb-4">
          <div class="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
            <i class="pi pi-file-text"></i>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600" @click="openEditModal(faq)">
              <i class="pi pi-pencil text-xs"></i>
            </button>
            <button class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600" @click="openDeleteDialog(faq)">
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
        </div>

        <h3 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{{ faq.question }}</h3>
        <p class="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">{{ faq.answer }}</p>

        <div class="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
            {{ faq.category || 'General' }}
          </span>
          <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            ID: {{ faq.id.toString().padStart(3, '0') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

type FaqRow = Database['public']['Tables']['faqs']['Row']

const supabase = useSupabaseClient<Database>()
const faqs = ref<FaqRow[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const errorMessage = ref('')

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs.value
  const query = searchQuery.value.toLowerCase()
  return faqs.value.filter(f => 
    f.question.toLowerCase().includes(query) || 
    f.answer.toLowerCase().includes(query)
  )
})

const fetchFaqs = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data, error } = await supabase.from('faqs').select('*').order('created_at', { ascending: false })
    if (error) throw error
    faqs.value = data || []
  } catch (error: any) {
    errorMessage.value = 'Failed to load FAQ base'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchFaqs)

const openAddModal = () => alert('New Article Modal')
const openEditModal = (faq: FaqRow) => alert(`Edit: ${faq.question}`)
const openDeleteDialog = (faq: FaqRow) => {
  if (confirm('Delete article?')) alert('Deleted')
}
</script>
