<template>
  <div class="space-y-10">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
      <div>
        <h1 class="text-4xl font-black text-brand-navy tracking-tight uppercase">Knowledge Base</h1>
        <p class="text-text-muted mt-2 font-bold uppercase text-[10px] tracking-widest">Self-service FAQ library for internship candidates.</p>
      </div>
      <button
        v-if="isSuperCoordinator"
        class="bg-brand-azure text-brand-navy px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center gap-3"
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
      <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-azure transition-colors"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search articles..."
        class="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-none outline-none focus:border-brand-azure transition-all text-xs font-black uppercase tracking-widest text-brand-navy placeholder:text-slate-300"
      >
    </div>

    <!-- Category Filter Pills -->
    <div class="flex flex-wrap gap-2" v-if="categories.length > 0">
      <button
        class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all"
        :class="activeCategory === null ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-text-veryMuted border-slate-100 hover:border-brand-navy hover:text-brand-navy'"
        @click="activeCategory = null"
      >
        All
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all"
        :class="activeCategory === cat.id ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-text-veryMuted border-slate-100 hover:border-brand-navy hover:text-brand-navy'"
        @click="activeCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
      <div v-if="isLoading" class="md:col-span-2 py-20 text-center flex flex-col items-center gap-4">
        <i class="pi pi-spin pi-spinner text-3xl text-brand-azure"></i>
        <span class="text-[10px] font-black uppercase tracking-widest text-brand-navy">Syncing Library</span>
      </div>
      
      <div v-else-if="filteredFaqs.length === 0" class="md:col-span-2 py-24 text-center border-2 border-dashed border-slate-100">
        <i class="pi pi-question-circle text-5xl mb-6 text-slate-100"></i>
        <p class="text-[10px] font-black text-text-veryMuted uppercase tracking-widest">No articles found</p>
      </div>

      <div 
        v-for="faq in filteredFaqs" 
        :key="faq.id" 
        class="bg-white p-8 border border-slate-100 hover:border-brand-azure transition-all group flex flex-col relative"
      >
        <div v-if="isSuperCoordinator" class="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button class="h-8 w-8 flex items-center justify-center bg-brand-navy text-white" @click="editFaq(faq)">
            <i class="pi pi-pencil text-[10px]"></i>
          </button>
          <button class="h-8 w-8 flex items-center justify-center border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white" @click="confirmDelete(faq.id)">
            <i class="pi pi-trash text-[10px]"></i>
          </button>
        </div>

        <div class="mb-6">
          <span class="inline-flex px-2 py-1 bg-brand-navy text-white text-[9px] font-black uppercase tracking-tighter mb-4">
            {{ getCategoryName(faq.category_id) }}
          </span>
          <h3 class="text-base font-black text-brand-navy uppercase tracking-tight leading-tight">{{ faq.question }}</h3>
        </div>
        
        <p class="text-xs text-text-muted font-medium leading-relaxed mb-6 flex-1 line-clamp-4">{{ faq.answer }}</p>

        <div v-if="faq.keywords && faq.keywords.length > 0" class="flex flex-wrap gap-1.5 mb-6">
          <span
            v-for="tag in faq.keywords"
            :key="tag"
            class="px-2 py-0.5 bg-slate-100 text-brand-navy text-[8px] font-black uppercase tracking-tight cursor-pointer hover:bg-brand-navy hover:text-white transition-colors"
            @click="searchQuery = tag"
          >
            {{ tag }}
          </span>
        </div>

        <div class="pt-6 border-t border-slate-50 flex items-center justify-between text-[9px] font-black text-text-veryMuted uppercase tracking-widest">
          <span>Article #{{ faq.id }}</span>
          <span>Last Updated: {{ faq.updated_at ? new Date(faq.updated_at).toLocaleDateString() : '---' }}</span>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal || editingId" class="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="bg-white w-full max-w-lg p-6 sm:p-10 border border-slate-100 shadow-2xl relative mx-4 sm:mx-0">
        <button class="absolute top-6 right-6 text-slate-300 hover:text-brand-navy transition-colors" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        
        <h2 class="text-xl font-black text-brand-navy uppercase tracking-widest mb-8">{{ editingId ? 'Update Article' : 'New Knowledge Base Entry' }}</h2>
        
        <form @submit.prevent="saveFaq" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Classification</label>
            <select v-model="form.category_id" required class="w-full bg-white border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-brand-azure outline-none transition-all cursor-pointer text-brand-navy">
              <option :value="null">Select Category...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Inquiry / Question</label>
            <input v-model="form.question" type="text" required class="w-full bg-white border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-brand-azure outline-none transition-all text-brand-navy">
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Resolution / Answer</label>
            <textarea v-model="form.answer" rows="6" required class="w-full bg-white border border-slate-100 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-brand-azure outline-none transition-all resize-none leading-relaxed text-brand-navy"></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Tags (comma-separated)</label>
            <input v-model="form.keywordsStr" type="text" placeholder="e.g., deadline, requirements, form"
              class="w-full bg-white border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-brand-azure outline-none transition-all text-brand-navy placeholder:text-slate-300">
          </div>
          
          <button type="submit" :disabled="isSaving" class="w-full bg-brand-azure text-brand-navy h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-30 mt-4">
            {{ isSaving ? 'Processing...' : 'Sync Entry' }}
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
const searchQuery = ref('')
const errorMessage = ref('')

const activeCategory = ref<number | null>(null)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ category_id: null as number | null, question: '', answer: '', keywordsStr: '' })

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

    faqs.value = faqRes.data || []
    categories.value = catRes.data || []
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
