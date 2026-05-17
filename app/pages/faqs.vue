<template>
  <div class="space-y-6 md:space-y-10">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6 md:pb-8">
      <div>
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Knowledge Base</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Self-service FAQ library for internship candidates.</p>
      </div>
      <button
        v-if="isSuperCoordinator"
        class="bg-sky-600 text-white px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center gap-3"
        @click="openAddModal"
      >
        <i class="pi pi-plus"></i>
        New Article
      </button>
    </header>

    <div v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </div>

    <div class="relative group">
      <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-sky-600 transition-colors"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search articles..."
        class="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-none outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all text-xs font-black uppercase tracking-widest text-slate-800 placeholder:text-stone-400"
      >
    </div>

    <!-- Category Filter Pills + Management -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all"
        :class="activeCategory === null ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-stone-400 border-stone-200 hover:border-slate-900 hover:text-slate-800'"
        @click="activeCategory = null"
      >
        All
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all"
        :class="activeCategory === cat.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-stone-400 border-stone-200 hover:border-slate-900 hover:text-slate-800'"
        @click="activeCategory = cat.id"
      >
        {{ cat.name }}
      </button>
      <button
        v-if="isSuperCoordinator"
        class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-dashed border-stone-300 text-stone-400 hover:border-slate-900 hover:text-slate-800 transition-all"
        @click="showCategoryForm = true"
      >
        <i class="pi pi-pencil mr-1"></i> Manage
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative">
      <div v-if="isLoading" class="md:col-span-2 py-20 text-center flex flex-col items-center gap-4">
        <i class="pi pi-spin pi-spinner text-3xl text-sky-600"></i>
        <span class="text-[10px] font-black uppercase tracking-widest text-slate-800">Syncing Library</span>
      </div>
      
      <div v-else-if="filteredFaqs.length === 0" class="md:col-span-2 py-24 text-center border-2 border-dashed border-stone-200">
        <i class="pi pi-question-circle text-5xl mb-6 text-stone-100"></i>
        <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest">No articles found</p>
      </div>

      <div 
        v-for="faq in filteredFaqs" 
        :key="faq.id" 
        class="bg-white p-4 md:p-6 lg:p-8 border border-stone-200 hover:border-sky-600 transition-all group flex flex-col relative"
      >
        <div v-if="isSuperCoordinator" class="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button class="h-8 w-8 flex items-center justify-center bg-slate-900 text-white" @click="editFaq(faq)">
            <i class="pi pi-pencil text-[10px]"></i>
          </button>
          <button class="h-8 w-8 flex items-center justify-center border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white" @click="confirmDelete(faq.id)">
            <i class="pi pi-trash text-[10px]"></i>
          </button>
        </div>

        <div class="mb-6">
          <span class="inline-flex px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-tighter mb-4">
            {{ getCategoryName(faq.category_id) }}
          </span>
          <h3 class="text-base font-black text-slate-800 uppercase tracking-tight leading-tight">{{ faq.question }}</h3>
        </div>
        
        <p class="text-xs text-stone-500 font-medium leading-relaxed mb-6 flex-1 line-clamp-4">{{ faq.answer }}</p>

        <div v-if="faq.keywords && faq.keywords.length > 0" class="flex flex-wrap gap-1.5 mb-6">
          <span
            v-for="tag in faq.keywords"
            :key="tag"
            class="px-2 py-0.5 bg-stone-100 text-slate-800 text-[8px] font-black uppercase tracking-tight cursor-pointer hover:bg-slate-900 hover:text-white transition-colors"
            @click="searchQuery = tag"
          >
            {{ tag }}
          </span>
        </div>

        <div class="pt-6 border-t border-stone-100 flex items-center justify-between text-[9px] font-black text-stone-400 uppercase tracking-widest">
          <span>Article #{{ faq.id }}</span>
          <span>Last Updated: {{ faq.updated_at ? new Date(faq.updated_at).toLocaleDateString() : '---' }}</span>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal || editingId" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="bg-white w-full max-w-lg p-6 sm:p-10 border border-stone-200 shadow-2xl relative mx-4 sm:mx-0">
        <button class="absolute top-6 right-6 text-stone-400 hover:text-slate-800 transition-colors" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        
        <h2 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-8">{{ editingId ? 'Update Article' : 'New Knowledge Base Entry' }}</h2>
        
        <form @submit.prevent="saveFaq" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Classification</label>
            <select v-model="form.category_id" required class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all cursor-pointer text-slate-800">
              <option :value="null">Select Category...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Inquiry / Question</label>
            <input v-model="form.question" type="text" required class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Resolution / Answer</label>
            <textarea v-model="form.answer" rows="6" required class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all resize-none leading-relaxed text-slate-800"></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Tags (comma-separated)</label>
            <input v-model="form.keywordsStr" type="text" placeholder="e.g., deadline, requirements, form"
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800 placeholder:text-stone-400">
          </div>
          
          <button type="submit" :disabled="isSaving" class="w-full bg-sky-600 text-white h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-30 mt-4">
            {{ isSaving ? 'Processing...' : 'Sync Entry' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Category Management Modal -->
    <div v-if="showCategoryForm" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="bg-white w-full max-w-lg p-6 sm:p-10 border border-stone-200 shadow-2xl relative mx-4 sm:mx-0">
        <button class="absolute top-6 right-6 text-stone-400 hover:text-slate-800 transition-colors" @click="showCategoryForm = false">
          <i class="pi pi-times"></i>
        </button>

        <h2 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-8">Manage Categories</h2>

        <div class="space-y-4 mb-8">
          <div v-for="cat in categories" :key="cat.id" class="flex items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200">
            <div>
              <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ cat.name }}</span>
              <p v-if="cat.description" class="text-[9px] font-bold text-stone-400 uppercase tracking-tighter mt-1">{{ cat.description }}</p>
            </div>
            <button class="h-8 w-8 flex items-center justify-center border border-red-400 text-red-400 hover:bg-red-500 hover:text-white transition-all" @click="deleteCategory(cat.id)">
              <i class="pi pi-trash text-[10px]"></i>
            </button>
          </div>
          <div v-if="categories.length === 0" class="py-8 text-center text-stone-400 font-black uppercase tracking-widest text-[10px]">No categories defined</div>
        </div>

        <form @submit.prevent="saveCategory" class="space-y-4 border-t border-stone-200 pt-6">
          <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4">Add Category</h3>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Name</label>
            <input v-model="catForm.name" type="text" required placeholder="e.g., Placement Requirements"
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Description</label>
            <input v-model="catForm.description" type="text" placeholder="Brief description"
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
          </div>
          <button type="submit" :disabled="isSavingCat"
            class="w-full bg-sky-600 text-white h-12 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-30">
            {{ isSavingCat ? 'Adding...' : 'Add Category' }}
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

type FaqRow = Database['public']['Tables']['faqs']['Row']
type CategoryRow = Database['public']['Tables']['faq_categories']['Row']

const supabase = useSupabaseClient<Database>()
const { isSuperCoordinator } = useCoordinatorPrivileges()

const faqs = ref<FaqRow[]>([])
const categories = ref<CategoryRow[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const isSavingCat = ref(false)
const searchQuery = ref('')
const errorMessage = ref('')

const activeCategory = ref<number | null>(null)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ category_id: null as number | null, question: '', answer: '', keywordsStr: '' })

// Category management
const showCategoryForm = ref(false)
const catForm = ref({ name: '', description: '' })

const saveCategory = async () => {
  isSavingCat.value = true
  try {
    const { error } = await supabase.from('faq_categories').insert({
      name: catForm.value.name,
      description: catForm.value.description || null,
      display_order: categories.value.length + 1
    })
    if (error) throw error
    catForm.value = { name: '', description: '' }
    const { data } = await supabase.from('faq_categories').select('*').order('display_order', { ascending: true })
    if (data) categories.value = data as CategoryRow[]
  } catch (error: any) {
    alert('Failed to add category')
  } finally {
    isSavingCat.value = false
  }
}

const deleteCategory = async (id: number) => {
  if (!confirm('Remove this category? Articles in this category will become uncategorized.')) return
  try {
    await supabase.from('faqs').update({ category_id: null }).eq('category_id', id)
    await supabase.from('faq_categories').delete().eq('id', id)
    const { data } = await supabase.from('faq_categories').select('*').order('display_order', { ascending: true })
    if (data) categories.value = data as CategoryRow[]
  } catch (error: any) {
    alert('Delete failed')
  }
}

const filteredFaqs = computed(() => {
  let list = faqs.value
  if (activeCategory.value !== null) {
    list = list.filter(f => f.category_id === activeCategory.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(f => 
      f.question.toLowerCase().includes(query) || 
      f.answer.toLowerCase().includes(query)
    )
  }
  return list
})

const getCategoryName = (id: number | null) => {
  if (!id) return 'General'
  return categories.value.find(c => c.id === id)?.name || 'Misc'
}

const fetchInitialData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [faqRes, catRes] = await Promise.all([
      supabase.from('faqs').select('*').order('updated_at', { ascending: false }),
      supabase.from('faq_categories').select('*').order('display_order', { ascending: true })
    ])

    if (faqRes.error) throw faqRes.error
    if (catRes.error) throw catRes.error

    faqs.value = (faqRes.data || []) as FaqRow[]
    categories.value = (catRes.data || []) as CategoryRow[]
  } catch (error: any) {
    errorMessage.value = 'Database sync failed'
  } finally {
    isLoading.value = false
  }
}

const saveFaq = async () => {
  isSaving.value = true
  try {
    const keywords = form.value.keywordsStr
      ? form.value.keywordsStr.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : []
    const payload = {
      category_id: form.value.category_id,
      question: form.value.question,
      answer: form.value.answer,
      keywords,
      updated_at: new Date().toISOString()
    }

    if (editingId.value) {
      const { error } = await supabase.from('faqs').update(payload).eq('id', editingId.value)
      if (error) throw error
    } else {
      const { error } = await supabase.from('faqs').insert(payload)
      if (error) throw error
    }
    await fetchInitialData()
    closeModal()
  } catch (error: any) {
    alert('Save failed')
  } finally {
    isSaving.value = false
  }
}

const openAddModal = () => {
  showModal.value = true
  editingId.value = null
  form.value = { category_id: categories.value[0]?.id || null, question: '', answer: '', keywordsStr: '' }
}

const editFaq = (faq: FaqRow) => {
  editingId.value = faq.id
  form.value = {
    category_id: faq.category_id,
    question: faq.question,
    answer: faq.answer,
    keywordsStr: (faq.keywords || []).join(', ')
  }
}

const confirmDelete = async (id: number) => {
  if (confirm('Archive entry?')) {
    try {
      await supabase.from('faqs').delete().eq('id', id)
      await fetchInitialData()
    } catch (error: any) {
      alert('Delete failed')
    }
  }
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
  form.value = { category_id: null, question: '', answer: '', keywordsStr: '' }
}

onMounted(fetchInitialData)
</script>
