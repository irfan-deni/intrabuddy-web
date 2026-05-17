<template>
  <div class="space-y-6 md:space-y-10">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6 md:pb-8">
      <div>
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Chatbot Logs</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Review student chatbot interactions and identify knowledge gaps.</p>
      </div>
    </header>

    <p v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </p>

    <div class="relative group">
      <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-sky-600 transition-colors"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search questions or answers..."
        class="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-none outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all text-xs font-black uppercase tracking-widest text-slate-800 placeholder:text-stone-400"
      >
    </div>

    <article class="bg-white border border-stone-200 shadow-sm relative overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-stone-50/50 p-6">
        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Conversation History</h2>
        <div class="flex items-center gap-3">
          <select
            v-model="matchFilter"
            class="text-[10px] font-black border border-stone-200 rounded-none px-4 py-2 bg-white uppercase tracking-widest outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all cursor-pointer"
          >
            <option value="all">All Conversations</option>
            <option value="matched">Matched to FAQ</option>
            <option value="unmatched">Unmatched</option>
          </select>
          <span class="text-[8px] font-black text-stone-400 uppercase tracking-widest tabular-nums">{{ filteredConversations.length }} Records</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div v-if="isLoading" class="py-12 md:py-16 text-center text-stone-400">
          <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
          <span class="text-[10px] font-black uppercase tracking-widest">Loading conversations...</span>
        </div>

        <div v-else-if="filteredConversations.length === 0" class="py-12 md:py-20 text-center text-stone-400 font-black uppercase tracking-widest text-[10px]">No conversations found</div>

        <template v-else>
          <div class="block md:hidden space-y-3">
            <div v-for="conv in filteredConversations" :key="conv.id" class="border border-stone-200 p-4">
              <div class="flex items-start justify-between mb-2">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ conv.student_name || 'Unknown' }}</div>
                <span v-if="conv.matched_faq_id" class="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ml-2">Matched #{{ conv.matched_faq_id }}</span>
                <span v-else class="px-2 py-0.5 bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ml-2">Unmatched</span>
              </div>
              <div class="font-bold text-slate-800 text-xs mb-1">{{ conv.question }}</div>
              <p v-if="conv.answer" class="text-[9px] text-stone-400 line-clamp-2 mb-2">{{ conv.answer }}</p>
              <div class="text-right text-[9px] font-black text-stone-400 tabular-nums pt-2 border-t border-stone-100">
                {{ conv.created_at ? new Date(conv.created_at).toLocaleString() : '---' }}
              </div>
            </div>
          </div>

          <table class="hidden md:table w-full text-left">
            <thead>
              <tr class="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50 border-b border-stone-200">
                <th class="px-8 py-6">Student</th>
                <th class="px-8 py-6">Question</th>
                <th class="px-8 py-6">Matched FAQ</th>
                <th class="px-8 py-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 text-xs">
              <tr v-for="conv in filteredConversations" :key="conv.id" class="hover:bg-stone-50 transition-all group">
                <td class="px-8 py-6">
                  <div class="font-black text-slate-800 uppercase tracking-tight text-xs whitespace-nowrap">{{ conv.student_name || 'Unknown' }}</div>
                </td>
                <td class="px-8 py-6 max-w-xs">
                  <p class="font-bold text-slate-800 text-xs truncate">{{ conv.question }}</p>
                  <p v-if="conv.answer" class="text-[9px] text-stone-400 mt-1 line-clamp-1">{{ conv.answer }}</p>
                </td>
                <td class="px-8 py-6">
                  <span v-if="conv.matched_faq_id" class="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-tighter">Matched #{{ conv.matched_faq_id }}</span>
                  <span v-else class="px-2 py-0.5 bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-tighter">Unmatched</span>
                </td>
                <td class="px-8 py-6 text-right text-stone-400 font-black tabular-nums text-[10px]">
                  {{ conv.created_at ? new Date(conv.created_at).toLocaleString() : '---' }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

type ConversationRow = Database['public']['Tables']['chatbot_conversations']['Row']

const supabase = useSupabaseClient<Database>()

type ConversationDisplay = ConversationRow & { student_name: string | null }

const conversations = ref<ConversationDisplay[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')
const matchFilter = ref('all')

const filteredConversations = computed(() => {
  let list = conversations.value
  if (matchFilter.value === 'matched') {
    list = list.filter(c => c.matched_faq_id !== null)
  } else if (matchFilter.value === 'unmatched') {
    list = list.filter(c => c.matched_faq_id === null)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c =>
      (c.question && c.question.toLowerCase().includes(q)) ||
      (c.answer && c.answer.toLowerCase().includes(q))
    )
  }
  return list
})

const loadConversations = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    const rows = (data || []) as ConversationRow[]
    const studentIds = rows.map(r => r.student_id).filter(Boolean) as string[]

    let nameMap: Record<string, string> = {}
    if (studentIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', studentIds)
      if (users) {
        users.forEach(u => { nameMap[u.id] = u.full_name })
      }
    }

    conversations.value = rows.map(r => ({
      ...r,
      student_name: r.student_id ? (nameMap[r.student_id] || 'Unknown') : null
    }))
  } catch (error: any) {
    errorMessage.value = 'Sync failed'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadConversations)
</script>
