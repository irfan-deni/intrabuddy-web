<template>
  <div class="space-y-12">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-8">
      <div>
        <h1 class="text-4xl font-black text-slate-800 tracking-tight uppercase">Student Dossier</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Comprehensive performance and compliance tracking.</p>
      </div>
      <div v-if="studentId" class="flex items-center gap-4">
        <div class="h-12 px-6 bg-stone-50 border border-stone-200 flex items-center gap-2">
          <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest">Status:</span>
          <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest">{{ isLoading ? 'Syncing...' : 'Active' }}</span>
        </div>
      </div>
    </header>

    <div v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </div>

    <div v-if="!studentId" class="py-20 text-center border-2 border-dashed border-stone-200">
      <i class="pi pi-user-plus text-4xl mb-4 text-stone-100"></i>
      <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest">No Student Selected</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Sidebar Info -->
      <div class="lg:col-span-4 space-y-10">
        <article class="bg-white p-8 border border-stone-200 shadow-sm relative">
          <div class="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <i class="pi pi-check-square text-6xl text-sky-600"></i>
          </div>
          
          <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6">Readiness Checklist</h2>
          
          <div class="space-y-6">
            <div>
              <div class="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                <span>Completion</span>
                <span>{{ checklistCompletion }}%</span>
              </div>
              <ProgressBar :value="checklistCompletion" />
            </div>

            <div v-if="isLoading" class="py-8 text-center text-stone-400">
              <i class="pi pi-spin pi-spinner text-xl text-sky-600"></i>
            </div>
            
            <div v-else class="space-y-4">
              <label v-for="item in checklists" :key="item.id" class="flex items-center gap-3 group cursor-default">
                <div class="h-5 w-5 flex items-center justify-center border-stone-400 group-hover:border-slate-900 transition-colors" :class="item.is_completed ? 'bg-slate-900 border-slate-900' : 'bg-white'">
                  <i v-if="item.is_completed" class="pi pi-check text-[10px] text-white"></i>
                </div>
                <span class="text-[10px] font-bold uppercase tracking-widest" :class="item.is_completed ? 'text-slate-800' : 'text-stone-400'">
                  {{ item.title }}
                </span>
              </label>
            </div>
          </div>
        </article>

        <article class="bg-white p-8 border border-stone-200 shadow-sm">
          <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6">Digital Wallet</h2>
          
          <div v-if="isLoading" class="py-8 text-center text-stone-400">
            <i class="pi pi-spin pi-spinner text-xl text-sky-600"></i>
          </div>
          <div v-else-if="walletItems.length === 0" class="py-8 text-center border-t border-stone-100">
            <p class="text-[9px] font-bold text-stone-400 uppercase tracking-widest">No Documents</p>
          </div>
          <ul v-else class="space-y-4">
            <li v-for="item in walletItems" :key="item.id" class="flex items-center gap-4 group">
              <div class="h-10 w-10 flex items-center justify-center border border-stone-200 bg-stone-50 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <i class="pi pi-file-pdf"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{{ item.item_name }}</p>
                <p class="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">{{ item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '---' }}</p>
              </div>
            </li>
          </ul>
        </article>
      </div>

      <!-- Main Activity -->
      <div class="lg:col-span-8 space-y-10">
        <article class="bg-white p-8 border border-stone-200 shadow-sm overflow-hidden">
          <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Placement Applications</h2>
          
          <div v-if="isLoading" class="py-12 text-center text-stone-400">
            <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
          </div>
          <div v-else-if="applications.length === 0" class="py-12 text-center bg-stone-50/50">
            <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest">Empty Application List</p>
          </div>
          <ul v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <li v-for="application in applications" :key="application.id" class="p-6 border border-stone-200 hover:border-sky-600 transition-all group">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">{{ application.company_name }}</h3>
                <StatusBadge :status="application.status" />
              </div>
              <p class="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Date Applied: {{ application.application_date ? new Date(application.application_date).toLocaleDateString() : '---' }}</p>
            </li>
          </ul>
        </article>

        <article class="bg-white p-8 border border-stone-200 shadow-sm">
          <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Weekly Logbook Status</h2>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-black text-stone-500 uppercase tracking-widest border-b border-stone-200">
                  <th class="pb-4">Week</th>
                  <th class="pb-4">Period End</th>
                  <th class="pb-4 text-right">Compliance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                <tr v-for="entry in logbookEntries" :key="entry.id" class="text-xs hover:bg-stone-50 transition-colors">
                  <td class="py-4 font-black text-slate-800 uppercase tracking-widest">Week {{ entry.week_number }}</td>
                  <td class="py-4 font-bold text-stone-400 tabular-nums uppercase">{{ entry.week_end_date }}</td>
                  <td class="py-4 text-right">
                    <StatusBadge :positive="entry.is_submitted" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import StatusBadge from '~/components/StatusBadge.vue'
import ProgressBar from '~/components/ProgressBar.vue'

definePageMeta({
  requiredRole: 'coordinator'
})

type ApplicationRow = Database['public']['Tables']['job_applications']['Row']
type LogbookRow = Database['public']['Tables']['weekly_logbook_tracking']['Row']
type WalletItemRow = Database['public']['Tables']['digital_wallet_items']['Row']

type ChecklistItem = {
  id: number
  title: string
  is_completed: boolean | null
}

const supabase = useSupabaseClient<Database>()
const route = useRoute()

const studentId = computed(() => route.query.id as string || null)

const isLoading = ref(false)
const errorMessage = ref('')

const checklists = ref<ChecklistItem[]>([])
const applications = ref<ApplicationRow[]>([])
const logbookEntries = ref<LogbookRow[]>([])
const walletItems = ref<WalletItemRow[]>([])

const checklistCompletion = computed(() => {
  if (!checklists.value.length) return 0
  const done = checklists.value.filter(c => c.is_completed).length
  return Math.round((done / checklists.value.length) * 100)
})

const loadStudentData = async () => {
  if (!studentId.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [chkRes, appRes, logRes, walletRes] = await Promise.all([
      supabase.from('student_checklists').select('id, is_completed, checklist_item_id').eq('student_id', studentId.value),
      supabase.from('job_applications').select('*').eq('student_id', studentId.value).order('application_date', { ascending: false }),
      supabase.from('weekly_logbook_tracking').select('*').eq('student_id', studentId.value).order('week_number', { ascending: true }),
      supabase.from('digital_wallet_items').select('*').eq('student_id', studentId.value).order('uploaded_at', { ascending: false })
    ])

    if (appRes.data) applications.value = appRes.data
    if (logRes.data) logbookEntries.value = logRes.data
    if (walletRes.data) walletItems.value = walletRes.data

    if (chkRes.data) {
      const templateIds = chkRes.data.map(c => c.checklist_item_id).filter(Boolean) as number[]
      if (templateIds.length > 0) {
        const { data: tpls } = await supabase.from('checklist_templates').select('id, title').in('id', templateIds)
        
        checklists.value = chkRes.data.map(c => {
          const title = tpls?.find(t => t.id === c.checklist_item_id)?.title || 'Task'
          return {
            id: c.id,
            title,
            is_completed: c.is_completed
          }
        })
      }
    }

  } catch (error: any) {
    errorMessage.value = 'Sync failed'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadStudentData()
})
</script>
