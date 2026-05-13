<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Knowledge Base</h1>
      <p class="mt-1 text-slate-500">Manage FAQ content and guidelines.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">FAQ Categories</h2>
        <button
          class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          @click="openModal(null)"
        >
          Add FAQ
        </button>
      </div>

      <div v-if="isLoading" class="py-8 text-center text-slate-400">
        <i class="pi pi-spin pi-spinner mr-2" />
        Loading FAQs...
      </div>

      <div v-else-if="groupedFaqs.length > 0" class="space-y-8">
        <div v-for="group in groupedFaqs" :key="group.category.id || 'uncategorized'">
          <h3 class="mb-3 border-b border-slate-100 pb-2 text-lg font-bold text-slate-800">
            {{ group.category.name }}
          </h3>
          <ul class="space-y-3">
            <li v-for="faq in group.faqs" :key="faq.id" class="rounded-lg border border-slate-200 p-4">
              <div class="mb-2 flex items-center justify-between gap-3">
                <h4 class="font-semibold text-slate-900">{{ faq.question }}</h4>
                <div class="flex items-center gap-2">
                  <span v-if="faq.is_published" class="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Published</span>
                  <span v-else class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Draft</span>
                  
                  <button class="ml-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100" @click="openModal(faq)">
                    Edit
                  </button>
                  <button class="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50" @click="deleteFaq(faq.id)">
                    Delete
                  </button>
                </div>
              </div>

              <p class="text-sm text-slate-700">{{ faq.answer }}</p>
              
              <div class="mt-3 flex items-center justify-between">
                <div class="flex gap-1">
                  <span v-for="kw in faq.keywords" :key="kw" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                    {{ kw }}
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  Updated: {{ faq.updated_at ? formatDate(faq.updated_at) : 'N/A' }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p v-else class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No FAQ entries yet.
      </p>
    </article>

    <div v-if="isModalOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div class="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <header class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ editingFaqId ? 'Edit FAQ' : 'Add FAQ' }}
          </h2>
          <button class="rounded-md p-2 text-slate-500 transition hover:bg-slate-100" @click="closeModal">
            <i class="pi pi-times" />
          </button>
        </header>

        <form class="space-y-4" @submit.prevent="saveFaq">
          <label class="block text-sm font-medium text-slate-700">
            Category
            <select
              v-model.number="form.category_id"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option disabled value="0">Select a category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </label>

          <label class="block text-sm font-medium text-slate-700">
            Question
            <input
              v-model="form.question"
              type="text"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
          </label>

          <label class="block text-sm font-medium text-slate-700">
            Answer
            <textarea
              v-model="form.answer"
              rows="4"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            ></textarea>
          </label>

          <label class="block text-sm font-medium text-slate-700">
            Keywords (comma-separated)
            <input
              v-model="form.keywords"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
          </label>

          <label class="flex items-center gap-3 text-sm text-slate-700 mt-2">
            <input v-model="form.is_published" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
            Publish (Visible to students)
          </label>

          <p v-if="modalErrorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ modalErrorMessage }}
          </p>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" @click="closeModal">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSaving ? 'Saving...' : 'Save FAQ' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

type FaqRow = Database['public']['Tables']['faqs']['Row']
type CategoryRow = Database['public']['Tables']['faq_categories']['Row']

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()

const faqs = ref<FaqRow[]>([])
const categories = ref<CategoryRow[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const modalErrorMessage = ref('')

const isModalOpen = ref(false)
const editingFaqId = ref<number | null>(null)

const form = ref({
  category_id: 0,
  question: '',
  answer: '',
  keywords: '',
  is_published: true
})

const groupedFaqs = computed(() => {
  const groups = new Map<number, { category: CategoryRow, faqs: FaqRow[] }>()

  categories.value.forEach(cat => {
    groups.set(cat.id, { category: cat, faqs: [] })
  })

  faqs.value.forEach(faq => {
    const catId = faq.category_id
    if (catId && groups.has(catId)) {
      groups.get(catId)!.faqs.push(faq)
    }
  })

  // Filter out empty groups and return
  return Array.from(groups.values()).filter(g => g.faqs.length > 0)
})

const loadData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [catRes, faqRes] = await Promise.all([
      supabase.from('faq_categories').select('*').order('display_order', { ascending: true }),
      supabase.from('faqs').select('*').order('updated_at', { ascending: false })
    ])

    if (catRes.error) throw catRes.error
    if (faqRes.error) throw faqRes.error

    categories.value = catRes.data || []
    faqs.value = faqRes.data || []
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load FAQs.'
  } finally {
    isLoading.value = false
  }
}

const openModal = (faq: FaqRow | null) => {
  modalErrorMessage.value = ''
  if (!faq) {
    editingFaqId.value = null
    form.value = {
      category_id: categories.value.length > 0 ? categories.value[0].id : 0,
      question: '',
      answer: '',
      keywords: '',
      is_published: true
    }
  } else {
    editingFaqId.value = faq.id
    form.value = {
      category_id: faq.category_id || 0,
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords ? faq.keywords.join(', ') : '',
      is_published: faq.is_published ?? true
    }
  }

  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingFaqId.value = null
  modalErrorMessage.value = ''
}

const saveFaq = async () => {
  if (!user.value) return

  modalErrorMessage.value = ''
  isSaving.value = true

  try {
    if (!form.value.question.trim() || !form.value.answer.trim()) {
      throw new Error('Question and answer are required.')
    }
    if (form.value.category_id === 0) {
      throw new Error('Please select a category.')
    }

    const keywordsArray = form.value.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)

    const payload = {
      category_id: form.value.category_id,
      question: form.value.question.trim(),
      answer: form.value.answer.trim(),
      keywords: keywordsArray,
      is_published: form.value.is_published,
      created_by: user.value.id,
      updated_at: new Date().toISOString()
    }

    if (editingFaqId.value) {
      const { error } = await supabase
        .from('faqs')
        .update(payload)
        .eq('id', editingFaqId.value)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('faqs')
        .insert(payload)

      if (error) throw error
    }

    closeModal()
    await loadData()
  } catch (error: unknown) {
    modalErrorMessage.value = error instanceof Error ? error.message : 'Unable to save FAQ.'
  } finally {
    isSaving.value = false
  }
}

const deleteFaq = async (id: number) => {
  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) throw error

    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete FAQ.'
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

onMounted(async () => {
  await loadData()
})
</script>
