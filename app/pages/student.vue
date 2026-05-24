<template>
  <div class="space-y-6 md:space-y-12">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6 md:pb-8">
      <div>
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Student Dossier</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Comprehensive performance and compliance tracking.</p>
      </div>
      <div v-if="studentId" class="flex items-center gap-3">
        <div class="h-12 px-6 bg-stone-50 border border-stone-200 flex items-center gap-2">
          <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest">Status:</span>
          <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest">{{ isLoading ? 'Syncing...' : 'Active' }}</span>
        </div>
        <button
          class="h-12 px-6 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
          @click="openAlertModal"
        >
          <i class="pi pi-bell mr-2"></i> Send Alert
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </div>

    <div v-if="!studentId" class="py-20 text-center border-2 border-dashed border-stone-200">
      <i class="pi pi-user-plus text-4xl mb-4 text-stone-100"></i>
      <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest">No Student Selected</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
      <!-- Sidebar Info -->
      <div class="lg:col-span-4 space-y-6 lg:space-y-10">
        <article class="bg-white p-4 md:p-6 lg:p-8 border border-stone-200 shadow-sm relative">
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
              <label v-for="item in checklists" :key="item.id" class="flex items-center gap-3 group cursor-pointer" @click="overrideChecklist(item)">
                <div class="h-5 w-5 flex items-center justify-center border-stone-400 group-hover:border-sky-600 transition-colors" :class="item.is_completed ? 'bg-slate-900 border-slate-900' : 'bg-white'">
                  <i v-if="item.is_completed" class="pi pi-check text-[10px] text-white"></i>
                </div>
                <div class="flex-1 flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase tracking-widest" :class="item.is_completed ? 'text-slate-800' : 'text-stone-400'">
                    {{ item.title }}
                  </span>
                  <i v-if="isSuperCoordinator" class="pi pi-pencil text-[8px] text-stone-300 opacity-0 group-hover:opacity-100 transition-all"></i>
                </div>
              </label>
            </div>
          </div>
        </article>

        <article class="bg-white p-4 md:p-6 lg:p-8 border border-stone-200 shadow-sm">
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
      <div class="lg:col-span-8 space-y-6 lg:space-y-10">
        <article class="bg-white p-4 md:p-6 lg:p-8 border border-stone-200 shadow-sm overflow-hidden">
          <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 lg:mb-8">Placement Applications</h2>
          
          <div v-if="isLoading" class="py-12 text-center text-stone-400">
            <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
          </div>
          <div v-else-if="applications.length === 0" class="py-12 text-center bg-stone-50/50">
            <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest">Empty Application List</p>
          </div>
          <ul v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <li v-for="application in applications" :key="application.id" class="p-6 border border-stone-200 hover:border-sky-600 transition-all group relative">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">{{ application.company_name }}</h3>
                <div class="flex items-center gap-2">
                  <StatusBadge :status="application.status ?? undefined" />
                  <button
                    v-if="isSuperCoordinator"
                    class="h-6 w-6 flex items-center justify-center bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-all"
                    title="Override status"
                    @click="openApplicationOverride(application)"
                  >
                    <i class="pi pi-pencil text-[8px]"></i>
                  </button>
                </div>
              </div>
              <p class="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Date Applied: {{ application.application_date ? new Date(application.application_date).toLocaleDateString() : '---' }}</p>
              <p v-if="application.position" class="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Position: {{ application.position }}</p>
              <div v-if="application.override_reason" class="mt-2 pt-2 border-t border-stone-100 text-[8px] font-black text-amber-700 uppercase tracking-wider">
                Override: {{ application.override_reason }}
              </div>
            </li>
          </ul>
        </article>

        <article class="bg-white p-4 md:p-6 lg:p-8 border border-stone-200 shadow-sm">
          <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-6 lg:mb-8">Weekly Logbook Status</h2>

          <div class="block md:hidden space-y-3">
            <div v-for="entry in logbookEntries" :key="entry.id" class="flex items-center justify-between p-4 bg-stone-50 border border-stone-200">
              <div>
                <div class="font-black text-slate-800 uppercase tracking-widest text-xs">Week {{ entry.week_number }}</div>
                <div class="text-[9px] font-bold text-stone-400 mt-1 tabular-nums">{{ entry.week_end_date }}</div>
              </div>
              <StatusBadge :positive="!!entry.is_submitted" />
            </div>
            <div v-if="logbookEntries.length === 0" class="py-8 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">No entries</div>
          </div>
          
          <div class="hidden md:block overflow-x-auto">
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
                    <StatusBadge :positive="!!entry.is_submitted" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    <!-- Checklist Override Modal -->
    <div v-if="showChecklistOverride" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="bg-white w-full max-w-md p-6 sm:p-8 border border-stone-200 shadow-2xl relative">
        <button class="absolute top-6 right-6 text-stone-400 hover:text-slate-800 transition-colors" @click="showChecklistOverride = false">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-6">{{ checklistOverrideTarget?.is_completed ? 'Revert Checklist Item' : 'Override Checklist Item' }}</h2>
        <p class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-6">{{ checklistOverrideTarget?.title }}</p>
        <form @submit.prevent="confirmChecklistOverride" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">{{ checklistOverrideTarget?.is_completed ? 'Revert Reason' : 'Override Reason' }}</label>
            <textarea v-model="checklistOverrideReason" rows="3" required placeholder="Explain why this item is being manually overridden..."
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <div class="flex gap-4">
            <button type="button" class="flex-1 h-12 border border-stone-200 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all" @click="showChecklistOverride = false">Cancel</button>
            <button type="submit" :disabled="isSavingOverride" class="flex-1 h-12 bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-30">
              {{ isSavingOverride ? 'Saving...' : 'Confirm Override' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Job Application Override Modal -->
    <div v-if="showAppOverride" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="bg-white w-full max-w-md p-6 sm:p-8 border border-stone-200 shadow-2xl relative">
        <button class="absolute top-6 right-6 text-stone-400 hover:text-slate-800 transition-colors" @click="showAppOverride = false">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-6">Override Application Status</h2>
        <p class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-6">{{ appOverrideTarget?.company_name }}</p>
        <form @submit.prevent="confirmAppOverride" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">New Status</label>
            <select v-model="appOverrideStatus" required
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all cursor-pointer text-slate-800">
              <option value="Pending">Pending</option>
              <option value="Interview">Interview</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer Declined">Offer Declined</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Override Reason</label>
            <textarea v-model="appOverrideReason" rows="3" required placeholder="Explain why this status is being overridden..."
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <div class="flex gap-4">
            <button type="button" class="flex-1 h-12 border border-stone-200 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all" @click="showAppOverride = false">Cancel</button>
            <button type="submit" :disabled="isSavingOverride" class="flex-1 h-12 bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-30">
              {{ isSavingOverride ? 'Saving...' : 'Confirm Override' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Send Alert Modal -->
    <div v-if="isAlertModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="bg-white w-full max-w-md p-6 sm:p-8 border border-stone-200 shadow-2xl relative">
        <button class="absolute top-6 right-6 text-stone-400 hover:text-slate-800 transition-colors" @click="isAlertModalOpen = false">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Send Alert</h2>
        <p class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-6">Dispatch a manual alert to this student.</p>
        <div class="mb-6 p-4 bg-stone-50 border border-stone-200">
          <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Recipient</p>
          <p class="text-sm font-black text-slate-800 uppercase tracking-tight">{{ studentName }}</p>
        </div>
        <form @submit.prevent="sendAlert" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Title</label>
            <input v-model="alertTitle" type="text" required placeholder="e.g., Urgent Reminder"
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Message</label>
            <textarea v-model="alertBody" rows="4" required placeholder="Enter alert message..."
              class="w-full bg-white border border-stone-200 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <div class="flex gap-4">
            <button type="button" class="flex-1 h-12 border border-stone-200 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all" @click="isAlertModalOpen = false">Cancel</button>
            <button type="submit" :disabled="isSendingAlert" class="flex-1 h-12 bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-30">
              {{ isSendingAlert ? 'Sending...' : 'Send Alert' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import StatusBadge from '~/components/StatusBadge.vue'
import ProgressBar from '~/components/ProgressBar.vue'
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

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
const { isSuperCoordinator } = useCoordinatorPrivileges()

const studentId = computed(() => route.query.id as string || null)

const isLoading = ref(false)
const errorMessage = ref('')
const isSavingOverride = ref(false)

// Alert modal state
const isAlertModalOpen = ref(false)
const alertTitle = ref('')
const alertBody = ref('')
const isSendingAlert = ref(false)
const studentName = ref('')

const checklists = ref<ChecklistItem[]>([])
const applications = ref<ApplicationRow[]>([])
const logbookEntries = ref<LogbookRow[]>([])
const walletItems = ref<WalletItemRow[]>([])

const checklistCompletion = computed(() => {
  if (!checklists.value.length) return 0
  const done = checklists.value.filter(c => c.is_completed).length
  return Math.round((done / checklists.value.length) * 100)
})

// Checklist override state
const showChecklistOverride = ref(false)
const checklistOverrideTarget = ref<ChecklistItem | null>(null)
const checklistOverrideReason = ref('')

// Application override state
const showAppOverride = ref(false)
const appOverrideTarget = ref<ApplicationRow | null>(null)
const appOverrideStatus = ref('Pending')
const appOverrideReason = ref('')

const loadStudentData = async () => {
  if (!studentId.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: profile } = await supabase.from('users').select('full_name').eq('id', studentId.value).single()
    studentName.value = profile?.full_name || 'Unknown Student'

    const [chkRes, appRes, logRes, walletRes] = await Promise.all([
      supabase.from('student_checklists').select('id, is_completed, checklist_item_id, override_reason, updated_by_admin').eq('student_id', studentId.value),
      supabase.from('job_applications').select('*').eq('student_id', studentId.value).order('application_date', { ascending: false }),
      supabase.from('weekly_logbook_tracking').select('*').eq('student_id', studentId.value).order('week_number', { ascending: true }),
      supabase.from('digital_wallet_items').select('*').eq('student_id', studentId.value).order('uploaded_at', { ascending: false })
    ])

    if (appRes.data) applications.value = appRes.data as ApplicationRow[]
    if (logRes.data) logbookEntries.value = logRes.data as LogbookRow[]
    if (walletRes.data) walletItems.value = walletRes.data as WalletItemRow[]

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

const overrideChecklist = async (item: ChecklistItem) => {
  if (!isSuperCoordinator.value) return
  checklistOverrideTarget.value = item
  checklistOverrideReason.value = ''
  showChecklistOverride.value = true
}

const confirmChecklistOverride = async () => {
  if (!checklistOverrideTarget.value || !studentId.value) return
  isSavingOverride.value = true
  try {
    const { data: user } = await supabase.auth.getUser()
    const adminId = user?.user?.id || null
    const target = checklistOverrideTarget.value
    const nowCompleted = !target.is_completed
    const { error } = await supabase.from('student_checklists').update({
      is_completed: nowCompleted,
      completed_at: nowCompleted ? new Date().toISOString() : null,
      override_reason: nowCompleted ? checklistOverrideReason.value : null,
      updated_by_admin: adminId
    }).eq('id', target.id)

    if (error) throw error
    showChecklistOverride.value = false
    await loadStudentData()
  } catch (error: any) {
    alert('Override failed')
  } finally {
    isSavingOverride.value = false
  }
}

const openApplicationOverride = (application: ApplicationRow) => {
  appOverrideTarget.value = application
  appOverrideStatus.value = application.status || 'Pending'
  appOverrideReason.value = ''
  showAppOverride.value = true
}

const confirmAppOverride = async () => {
  if (!appOverrideTarget.value) return
  isSavingOverride.value = true
  try {
    const { data: user } = await supabase.auth.getUser()
    const adminId = user?.user?.id || null
    const { error } = await supabase.from('job_applications').update({
      status: appOverrideStatus.value,
      override_reason: appOverrideReason.value,
      updated_by_admin: adminId,
      updated_at: new Date().toISOString()
    }).eq('id', appOverrideTarget.value.id)

    if (error) throw error
    showAppOverride.value = false
    await loadStudentData()
  } catch (error: any) {
    alert('Override failed')
  } finally {
    isSavingOverride.value = false
  }
}

const openAlertModal = () => {
  alertTitle.value = ''
  alertBody.value = ''
  isAlertModalOpen.value = true
}

const sendAlert = async () => {
  if (!studentId.value || !alertTitle.value || !alertBody.value) return
  isSendingAlert.value = true
  try {
    await $fetch('/api/notifications', {
      method: 'POST',
      body: {
        recipient_id: studentId.value,
        title: alertTitle.value,
        body: alertBody.value,
        type: 'manual_alert'
      }
    })
    isAlertModalOpen.value = false
    alert('Alert sent')
  } catch {
    alert('Failed to send alert')
  } finally {
    isSendingAlert.value = false
  }
}

onMounted(async () => {
  await loadStudentData()
})
</script>
