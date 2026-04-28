<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Knowledge Base</h1>
      <p class="mt-1 text-slate-500">Manage FAQ content and keep embeddings in sync for AI retrieval.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <p v-if="embeddingNotice" class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {{ embeddingNotice }}
    </p>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">FAQ Entries</h2>
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

      <ul v-else-if="faqs.length > 0" class="space-y-3">
        <li v-for="faq in faqs" :key="faq.id" class="rounded-lg border border-slate-200 p-4">
          <div class="mb-2 flex items-center justify-between gap-3">
            <h3 class="font-semibold text-slate-900">{{ faq.question }}</h3>
            <div class="flex items-center gap-2">
              <button class="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100" @click="openModal(faq)">
                Edit
              </button>
              <button class="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50" @click="deleteFaq(faq.id)">
                Delete
              </button>
            </div>
          </div>

          <p class="text-sm text-slate-700">{{ faq.answer }}</p>
          <p class="mt-3 text-xs text-slate-500">
            Updated: {{ faq.updated_at ? formatDate(faq.updated_at) : 'N/A' }}
          </p>
        </li>
      </ul>

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
              rows="6"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            ></textarea>
          </label>

          <p v-if="modalErrorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ modalErrorMessage }}
          </p>

          <div class="flex items-center justify-end gap-2">
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
type FaqListRow = Omit<FaqRow, 'embedding'>

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()

const faqs = ref<FaqListRow[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const embeddingNotice = ref('')
const modalErrorMessage = ref('')

const isModalOpen = ref(false)
const editingFaqId = ref<string | null>(null)

const form = ref({
  question: '',
  answer: ''
})

const loadFaqs = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('id, question, answer, last_updated_by, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    faqs.value = data || []
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load FAQs.'
  } finally {
    isLoading.value = false
  }
}

const openModal = (faq: FaqListRow | null) => {
  modalErrorMessage.value = ''
  if (!faq) {
    editingFaqId.value = null
    form.value = { question: '', answer: '' }
  } else {
    editingFaqId.value = faq.id
    form.value = {
      question: faq.question,
      answer: faq.answer
    }
  }

  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingFaqId.value = null
  modalErrorMessage.value = ''
}

const triggerEmbeddingUpdate = async (faqId: string, question: string, answer: string) => {
  await $fetch('/api/faqs/embed', {
    method: 'POST',
    body: {
      faqId,
      text: `Q: ${question}\nA: ${answer}`
    }
  })
}

const saveFaq = async () => {
  if (!user.value) {
    return
  }

  modalErrorMessage.value = ''
  embeddingNotice.value = ''
  isSaving.value = true

  try {
    if (!form.value.question.trim() || !form.value.answer.trim()) {
      throw new Error('Question and answer are required.')
    }

    const payload = {
      question: form.value.question.trim(),
      answer: form.value.answer.trim(),
      last_updated_by: user.value.id,
      updated_at: new Date().toISOString()
    }

    let savedFaqId = editingFaqId.value

    if (editingFaqId.value) {
      const { error } = await supabase
        .from('faqs')
        .update(payload)
        .eq('id', editingFaqId.value)

      if (error) {
        throw error
      }
    } else {
      const { data, error } = await supabase
        .from('faqs')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        throw error
      }

      savedFaqId = data.id
    }

    closeModal()

    try {
      if (savedFaqId) {
        await triggerEmbeddingUpdate(savedFaqId, payload.question, payload.answer)
      }
    } catch (embedError: unknown) {
      const embedMessage = embedError instanceof Error ? embedError.message : 'Embedding update failed.'
      embeddingNotice.value = `FAQ was saved, but the search embedding could not be updated: ${embedMessage}`
    }

    await loadFaqs()
  } catch (error: unknown) {
    modalErrorMessage.value = error instanceof Error ? error.message : 'Unable to save FAQ.'
  } finally {
    isSaving.value = false
  }
}

const deleteFaq = async (id: string) => {
  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    await loadFaqs()
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
  await loadFaqs()
})
</script>
