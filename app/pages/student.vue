<template>
  <div class="app-surface-ui space-y-6 md:space-y-8">
    <PortalPageHeader
      :title="studentName && studentName !== 'Unknown Student' ? studentName : 'Student Profile'"
      :eyebrow="studentName && studentName !== 'Unknown Student' ? 'Student Profile' : undefined"
      :description="studentName && studentName !== 'Unknown Student' && studentNumber ? `ID ${studentNumber}` : undefined"
    >
      <template #leading>
        <NuxtLink to="/students" aria-label="Back to students" class="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sky-100 text-sky-800 transition-colors hover:bg-sky-200">
          <i aria-hidden="true" class="pi pi-arrow-left text-sm"></i>
        </NuxtLink>
      </template>
      <template v-if="studentId" #actions>
        <div v-if="management?.semesters.length" class="relative mr-1 min-w-0 max-w-full sm:max-w-52">
          <label for="student-semester" class="sr-only">Semester</label>
          <i aria-hidden="true" class="pi pi-calendar pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-sky-700"></i>
          <select id="student-semester" v-model.number="selectedSemesterId" class="rounded-control h-10 md:h-11 max-w-full appearance-none cursor-pointer border border-surface-control bg-surface pl-9 pr-9 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-700 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2" @change="changeSemester">
            <option v-for="semester in management.semesters" :key="semester.id" :value="semester.id">{{ semester.name }}{{ semester.is_active ? ' (active)' : '' }}</option>
          </select>
          <i aria-hidden="true" class="pi pi-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted"></i>
        </div>
        <button
          :disabled="isLoading || !!errorMessage || !management"
          class="portal-primary-action whitespace-nowrap"
          @click="downloadStudentProfile"
        >
          <i aria-hidden="true" class="pi pi-file-pdf"></i> Download PDF
        </button>
        <button
          class="rounded-control inline-flex min-h-11 items-center gap-2 whitespace-nowrap border border-surface-control bg-surface px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-surface-hover"
          @click="openAlertModal"
        >
          <i aria-hidden="true" class="pi pi-bell"></i> Send Alert
        </button>
      </template>
    </PortalPageHeader>

    <div v-if="errorMessage" class="rounded-card p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
      {{ errorMessage }}
    </div>

    <div v-if="!studentId" class="rounded-card bg-surface py-20 text-center border-2 border-dashed border-surface-border">
      <i class="pi pi-user-plus text-4xl mb-4 text-stone-100"></i>
      <p class="text-[10px] font-black text-text-muted uppercase tracking-widest">No Student Selected</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      <!-- Sidebar Info -->
      <div class="lg:col-span-4 space-y-6 lg:space-y-8">
        <article class="rounded-card bg-surface p-4 md:p-6 lg:p-8 border border-surface-border shadow-sm relative">
          <PortalSectionHeading title="Readiness Checklist" icon="pi-check-square" tone="teal" class="mb-5" />
          
          <div class="space-y-6">
            <div>
              <div class="mb-2 flex justify-between text-sm font-semibold text-text-muted">
                <span>Completion</span>
                <span>{{ checklistCompletion }}%</span>
              </div>
              <ProgressBar :value="checklistCompletion" />
            </div>

            <div v-if="isLoading" class="py-8 text-center text-text-muted">
              <i class="pi pi-spin pi-spinner text-xl text-sky-600"></i>
            </div>

            <div v-else class="space-y-4">
              <button v-for="item in checklists" :key="item.id" type="button" :disabled="isSavingOverride || !canCorrectChecklist(item)" class="rounded-control w-full text-left flex items-center gap-3 group disabled:cursor-default" :aria-label="`Correct ${item.title}`" @click="overrideChecklist(item)">
                <div class="rounded-badge h-5 w-5 flex items-center justify-center border border-surface-control group-hover:border-sky-700 transition-colors" :class="item.is_completed ? 'bg-slate-900 border-slate-900' : 'bg-surface-muted'">
                  <i v-if="item.is_completed" class="pi pi-check text-[10px] text-white"></i>
                </div>
                <div class="flex-1 flex items-center justify-between">
                  <span class="text-xs md:text-[13px] font-bold uppercase tracking-wide" :class="item.is_completed ? 'text-slate-800' : 'text-text-muted'">
                    {{ item.title }}
                  </span>
                   <i v-if="canCorrectChecklist(item)" aria-hidden="true" class="pi pi-pencil text-sm text-text-muted"></i>
                </div>
              </button>
            </div>
          </div>
        </article>

        <article class="rounded-card bg-surface p-4 md:p-6 lg:p-8 border border-surface-border shadow-sm">
          <PortalSectionHeading title="Student Documents" icon="pi-folder" class="mb-5" />
          
          <div v-if="isLoading" class="py-8 text-center text-text-muted">
            <i class="pi pi-spin pi-spinner text-xl text-sky-600"></i>
          </div>
          <div v-else-if="walletItems.length === 0" class="py-8 text-center border-t border-surface-border">
            <p class="text-xs font-bold text-text-muted uppercase tracking-wider">No Documents</p>
          </div>
          <ul v-else class="space-y-4">
            <li v-for="item in walletItems" :key="item.id" class="flex items-center gap-4 group">
              <div class="rounded-control h-10 w-10 flex items-center justify-center border border-surface-border bg-surface-muted group-hover:bg-slate-900 group-hover:text-white transition-all">
                <i class="pi pi-file-pdf"></i>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">{{ item.item_name }}</p>
                <p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">{{ item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '---' }}</p>
              </div>
              <button type="button" class="rounded-control px-3 py-2 text-[10px] font-black uppercase tracking-widest text-sky-700 hover:bg-surface-hover disabled:opacity-50" :disabled="openingWalletItemId !== null" :aria-label="`View ${item.item_name}`" @click="viewWalletItem(item)">
                {{ openingWalletItemId === item.id ? 'Opening...' : 'View' }}
              </button>
            </li>
          </ul>
          <p v-if="walletError" role="alert" class="mt-4 text-xs text-rose-700">{{ walletError }}</p>
        </article>
        <StudentManagementPanel v-if="studentId" :key="studentId" ref="managementPanel" :student-id="studentId" @loaded="managementLoaded" @changed="loadStudentData" />
      </div>

      <!-- Main Activity -->
      <div class="lg:col-span-8 space-y-6 lg:space-y-8">
        <article class="rounded-card bg-surface p-4 md:p-6 lg:p-8 border border-surface-border shadow-sm">
          <PortalSectionHeading title="Placement Applications" icon="pi-briefcase" tone="violet" class="mb-5" />
          
          <div v-if="isLoading" class="py-12 text-center text-text-muted">
            <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
          </div>
          <div v-else-if="applications.length === 0" class="rounded-card py-12 text-center bg-surface-muted">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest">Empty Application List</p>
          </div>
          <ul v-else class="divide-y divide-surface-border">
            <li v-for="application in applications" :key="application.id" class="py-5 first:pt-0 last:pb-0 hover:bg-surface-hover transition-colors">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide break-words">{{ application.company_name }}</h3>
                  <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-text-muted">
                    <span>Applied: {{ application.application_date ? new Date(application.application_date).toLocaleDateString() : '---' }}</span>
                    <span v-if="application.position">Position: {{ application.position }}</span>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2 sm:ml-4">
                  <StatusBadge :status="application.status ?? undefined" />
                  <button
                    v-if="canCorrectApplication(application)"
                    :disabled="isSavingOverride"
                    class="rounded-control shrink-0 h-10 w-10 flex items-center justify-center bg-slate-900 text-white transition-all"
                    :aria-label="`Correct application for ${application.company_name}`"
                    title="Override status"
                    @click="openApplicationOverride(application)"
                  >
                    <i class="pi pi-pencil text-[8px]"></i>
                  </button>
                </div>
              </div>
              <p v-if="application.semester_id == null" class="mt-2 text-sm text-text-muted">Legacy record without a semester. Only a Super Coordinator can correct its status.</p>
              <div v-if="application.override_reason" class="mt-2 pt-2 border-t border-surface-border text-[8px] font-black text-amber-700 uppercase tracking-wider">
                Override: {{ application.override_reason }}
              </div>
            </li>
          </ul>
        </article>

        <StudentLogbooks v-if="studentId" :key="studentId" :student-id="studentId" :logbooks="management?.logbooks ?? logbookEntries" :management="management" :loading="isLoading" @changed="refreshManagement" />
      </div>
    <div v-if="walletPreviewUrl" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4" @click.self="closeWalletPreview">
      <div role="dialog" aria-modal="true" aria-labelledby="wallet-preview-title" class="rounded-dialog bg-surface w-full max-w-5xl h-[85dvh] flex flex-col p-4 sm:p-6">
        <div class="flex items-center justify-between gap-4 mb-4">
          <h2 id="wallet-preview-title" class="font-black text-slate-800 truncate">{{ walletPreviewName }}</h2>
          <button type="button" class="rounded-control px-4 py-2 text-sm font-bold hover:bg-surface-hover" @click="closeWalletPreview">Close</button>
        </div>
        <iframe v-if="walletPreviewType === 'application/pdf'" :src="walletPreviewUrl" title="Document preview" class="w-full flex-1 border border-surface-border"></iframe>
        <div v-else class="flex-1 min-h-0 overflow-auto flex items-center justify-center"><img :src="walletPreviewUrl" :alt="walletPreviewName" class="max-w-full max-h-full object-contain"></div>
      </div>
    </div>
    <!-- Checklist Override Modal -->
    <div v-if="showChecklistOverride" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-md p-6 sm:p-8 border border-surface-border shadow-2xl relative">
        <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="showChecklistOverride = false">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-6">{{ checklistOverrideTarget?.is_completed ? 'Revert Checklist Item' : 'Override Checklist Item' }}</h2>
        <p class="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">{{ checklistOverrideTarget?.title }}</p>
        <form @submit.prevent="confirmChecklistOverride" class="space-y-6">
          <div class="space-y-2">
            <label for="checklist-correction-reason" class="text-[9px] font-black text-text-muted uppercase tracking-widest">{{ checklistOverrideTarget?.is_completed ? 'Revert Reason' : 'Override Reason' }}</label>
            <textarea id="checklist-correction-reason" v-model="checklistOverrideReason" rows="3" required maxlength="2000" placeholder="Explain why this item is being manually overridden..."
              class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <div class="flex gap-4">
            <button type="button" class="rounded-control flex-1 h-12 border border-surface-control text-text-muted font-black text-[10px] uppercase tracking-widest hover:bg-surface-hover transition-all" @click="showChecklistOverride = false">Cancel</button>
            <button type="submit" :disabled="isSavingOverride" class="rounded-control flex-1 h-12 bg-sky-700 text-white font-black text-[10px] uppercase tracking-widest hover:bg-sky-800 transition-all disabled:opacity-30">
              {{ isSavingOverride ? 'Saving...' : 'Confirm Override' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Job Application Override Modal -->
    <div v-if="showAppOverride" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-md p-6 sm:p-8 border border-surface-border shadow-2xl relative">
        <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="showAppOverride = false">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-6">Override Application Status</h2>
        <p class="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">{{ appOverrideTarget?.company_name }}</p>
        <form @submit.prevent="confirmAppOverride" class="space-y-6">
          <div class="space-y-2">
            <label for="application-correction-status" class="text-[9px] font-black text-text-muted uppercase tracking-widest">New Status</label>
            <select id="application-correction-status" v-model="appOverrideStatus" required
              class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all cursor-pointer text-slate-800">
              <option value="Pending">Pending</option>
              <option value="Interview">Interview</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer Declined">Offer Declined</option>
            </select>
          </div>
          <div class="space-y-2">
            <label for="application-correction-reason" class="text-[9px] font-black text-text-muted uppercase tracking-widest">Override Reason</label>
            <textarea id="application-correction-reason" v-model="appOverrideReason" rows="3" required maxlength="2000" placeholder="Explain why this status is being overridden..."
              class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <div class="flex gap-4">
            <button type="button" class="rounded-control flex-1 h-12 border border-surface-control text-text-muted font-black text-[10px] uppercase tracking-widest hover:bg-surface-hover transition-all" @click="showAppOverride = false">Cancel</button>
            <button type="submit" :disabled="isSavingOverride" class="rounded-control flex-1 h-12 bg-sky-700 text-white font-black text-[10px] uppercase tracking-widest hover:bg-sky-800 transition-all disabled:opacity-30">
              {{ isSavingOverride ? 'Saving...' : 'Confirm Override' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Send Alert Modal -->
    <div v-if="isAlertModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
      <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-md p-6 sm:p-8 border border-surface-border shadow-2xl relative">
        <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="isAlertModalOpen = false">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Send Alert</h2>
        <p class="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">Dispatch a manual alert to this student.</p>
        <div class="rounded-card mb-6 p-4 bg-surface-muted border border-surface-border">
          <p class="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Recipient</p>
          <p class="text-sm font-black text-slate-800 uppercase tracking-tight">{{ studentName }}</p>
        </div>
        <form @submit.prevent="sendAlert" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Title</label>
            <input v-model="alertTitle" type="text" required placeholder="e.g., Urgent Reminder"
              class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Message</label>
            <textarea v-model="alertBody" rows="4" required placeholder="Enter alert message..."
              class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none text-slate-800"></textarea>
          </div>
          <div class="flex gap-4">
            <button type="button" class="rounded-control flex-1 h-12 border border-surface-control text-text-muted font-black text-[10px] uppercase tracking-widest hover:bg-surface-hover transition-all" @click="isAlertModalOpen = false">Cancel</button>
            <button type="submit" :disabled="isSendingAlert" class="rounded-control flex-1 h-12 bg-sky-700 text-white font-black text-[10px] uppercase tracking-widest hover:bg-sky-800 transition-all disabled:opacity-30">
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
import { generateReport } from '~/utils/pdfGenerator'
import type { StudentManagement } from '~/types/student-management'

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
  semester_id: number | null
}

const supabase = useSupabaseClient<Database>()
const pageCache = usePageCache()
const route = useRoute()
const { isSuperCoordinator } = useCoordinatorPrivileges()
const management = ref<StudentManagement | null>(null)
const selectedSemesterId = ref<number | null>(null)
const managementPanel = ref<{ refresh: () => Promise<void>; selectSemester: (id: number) => Promise<void> } | null>(null)
const refreshManagement = () => { void managementPanel.value?.refresh() }
const changeSemester = () => { if (selectedSemesterId.value !== null) void managementPanel.value?.selectSemester(selectedSemesterId.value) }
const canCorrectChecklist = (item: ChecklistItem) => !!management.value?.capabilities.correctRecords && item.semester_id === management.value.semesterId
const canCorrectApplication = (item: ApplicationRow) => !!management.value?.capabilities.correctRecords &&
  (item.semester_id === management.value.semesterId || (item.semester_id === null && isSuperCoordinator.value))
const managementLoaded = (value: StudentManagement | null) => {
  closeWalletPreview()
  management.value = value
  if (value) selectedSemesterId.value = value.semesterId
  showChecklistOverride.value = false
  showAppOverride.value = false
  if (value) void loadStudentData()
}

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
const studentNumber = ref<string | null>(null)

const checklists = ref<ChecklistItem[]>([])
const applications = ref<ApplicationRow[]>([])
const logbookEntries = ref<LogbookRow[]>([])
const walletItems = ref<WalletItemRow[]>([])
const openingWalletItemId = ref<number | null>(null)
const walletError = ref('')
const walletPreviewUrl = ref('')
const walletPreviewName = ref('')
const walletPreviewType = ref('')
let walletPreviewRequest = 0

const closeWalletPreview = () => {
  walletPreviewRequest++
  if (walletPreviewUrl.value) URL.revokeObjectURL(walletPreviewUrl.value)
  walletPreviewUrl.value = ''
}

const viewWalletItem = async (item: WalletItemRow) => {
  walletError.value = ''
  if (!studentId.value) return
  closeWalletPreview()
  const request = walletPreviewRequest
  openingWalletItemId.value = item.id
  try {
    const response = await fetch(`/api/students/${encodeURIComponent(studentId.value)}/wallet/${item.id}`, { cache: 'no-store' })
    if (!response.ok) throw new Error('Document unavailable')
    const blob = await response.blob()
    if (request !== walletPreviewRequest) return
    walletPreviewType.value = blob.type
    walletPreviewName.value = item.item_name
    walletPreviewUrl.value = URL.createObjectURL(blob)
  } catch {
    if (request === walletPreviewRequest) walletError.value = 'Unable to open this document. It may be unavailable or you may not have access.'
  } finally {
    openingWalletItemId.value = null
  }
}

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
  studentNumber.value = null
  checklists.value = []
  applications.value = []
  logbookEntries.value = []
  walletItems.value = []

  try {
    const [profileRes, chkRes, appRes, logRes, walletRes] = await Promise.all([
      supabase.from('users').select('full_name, student_id').eq('id', studentId.value).single(),
      supabase.from('student_checklists').select('id, is_completed, checklist_item_id, override_reason, updated_by_admin').eq('student_id', studentId.value),
      supabase.from('job_applications').select('*').eq('student_id', studentId.value).order('application_date', { ascending: false }),
      supabase.from('weekly_logbook_tracking').select('*').eq('student_id', studentId.value).order('week_number', { ascending: true }),
      supabase.from('digital_wallet_items').select('*').eq('student_id', studentId.value).order('uploaded_at', { ascending: false })
    ])

    studentName.value = profileRes.data?.full_name || 'Unknown Student'
    studentNumber.value = profileRes.data?.student_id || null

    if (appRes.data) applications.value = (appRes.data as ApplicationRow[]).filter(a => !management.value?.semesterId || a.semester_id === management.value.semesterId || a.semester_id == null)
    if (logRes.data) logbookEntries.value = (logRes.data as LogbookRow[]).filter(l => !management.value?.semesterId || l.semester_id === management.value.semesterId)
    if (walletRes.data) walletItems.value = walletRes.data as WalletItemRow[]

    if (chkRes.data) {
      const templateIds = chkRes.data.map(c => c.checklist_item_id).filter(Boolean) as number[]
      if (templateIds.length > 0) {
        const { data: templates } = await supabase.from('checklist_templates').select('id, title, semester_id').in('id', templateIds)
        const templateMap = new Map(templates?.map(template => [template.id, template]))
        checklists.value = chkRes.data.map(c => ({
          id: c.id,
          title: templateMap.get(c.checklist_item_id || 0)?.title || 'Task',
          is_completed: c.is_completed,
          semester_id: templateMap.get(c.checklist_item_id || 0)?.semester_id ?? null
        })).filter(c => !management.value?.semesterId || c.semester_id === management.value.semesterId)
      }
    }

  } catch (error: any) {
    errorMessage.value = 'Sync failed'
  } finally {
    isLoading.value = false
  }
}

const overrideChecklist = async (item: ChecklistItem) => {
   if (!canCorrectChecklist(item)) return
  checklistOverrideTarget.value = item
  checklistOverrideReason.value = ''
  showChecklistOverride.value = true
}

const confirmChecklistOverride = async () => {
  if (!checklistOverrideTarget.value || !studentId.value) return
  isSavingOverride.value = true
  try {
    const target = checklistOverrideTarget.value
    await $fetch(`/api/students/${studentId.value}/checklists/${target.id}`, {
      method: 'PATCH',
      body: { is_completed: !target.is_completed, reason: checklistOverrideReason.value, semester_id: management.value?.semesterId }
    })
    showChecklistOverride.value = false
    pageCache.clear()
    await loadStudentData()
    await managementPanel.value?.refresh()
  } catch (error: any) {
    alert(error?.data?.statusMessage || 'Override failed')
    await managementPanel.value?.refresh()
  } finally {
    isSavingOverride.value = false
  }
}

const openApplicationOverride = (application: ApplicationRow) => {
  if (!canCorrectApplication(application)) return
  appOverrideTarget.value = application
  appOverrideStatus.value = application.status || 'Pending'
  appOverrideReason.value = ''
  showAppOverride.value = true
}

const confirmAppOverride = async () => {
  if (!appOverrideTarget.value || !studentId.value) return
  isSavingOverride.value = true
  try {
    await $fetch(`/api/students/${studentId.value}/applications/${appOverrideTarget.value.id}`, {
      method: 'PATCH',
      body: { status: appOverrideStatus.value, reason: appOverrideReason.value, semester_id: management.value?.semesterId }
    })
    showAppOverride.value = false
    pageCache.clear()
    await loadStudentData()
    await managementPanel.value?.refresh()
  } catch (error: any) {
    alert(error?.data?.statusMessage || 'Override failed')
    await managementPanel.value?.refresh()
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

const downloadStudentProfile = () => {
  if (isLoading.value || errorMessage.value || !management.value) return

  const acceptedApp = applications.value.find(a => a.status === 'Accepted')
  const placementCompany = acceptedApp?.company_name || 'Not Placed'
  const semesterName = management.value.semesters.find(s => s.id === management.value?.semesterId)?.name || 'Not available'
  const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString() : '---'
  const reviewByLogbookId = new Map(management.value.reviews.map(review => [review.logbook_id, review.status]))

  const rows: [string, string][] = [
    ['Name', studentName.value],
    ['Student ID', studentNumber.value || '---'],
    ['Semester', semesterName],
    ['Placement Company', placementCompany],
    ['Readiness Checklist', `${checklistCompletion.value}%`],
    ['Logbooks Submitted', `${logbookEntries.value.filter(e => e.is_submitted).length} of ${logbookEntries.value.length}`]
  ]

  const extraTables = [
    {
      headers: ['Applications / Company', 'Position', 'Status', 'Applied'],
      data: applications.value.length
        ? applications.value.map(app => [app.company_name, app.position || '---', app.status || 'Unknown', formatDate(app.application_date)])
        : [['No applications', '', '', '']]
    },
    {
      headers: ['Readiness Checklist / Item', 'Status'],
      data: checklists.value.length
        ? checklists.value.map(item => [item.title, item.is_completed ? 'Completed' : 'Incomplete'])
        : [['No checklist items', '']]
    },
    {
      headers: ['Logbooks / Week', 'Period End', 'Submission', 'Review'],
      data: logbookEntries.value.length
        ? logbookEntries.value.map(entry => [
            `Week ${entry.week_number}`,
            formatDate(entry.week_end_date),
            entry.is_submitted ? 'Submitted' : 'Not submitted',
            reviewByLogbookId.get(entry.id) === 'reviewed' ? 'Reviewed'
              : reviewByLogbookId.get(entry.id) === 'corrections_requested' ? 'Corrections requested' : 'Not reviewed'
          ])
        : [['No logbooks', '', '', '']]
    },
    {
      headers: ['Student Documents', 'Uploaded'],
      data: walletItems.value.length
        ? walletItems.value.map(item => [item.item_name, formatDate(item.uploaded_at)])
        : [['No documents', '']]
    }
  ]

  const safeName = studentName.value.replace(/[^a-zA-Z0-9_-]/g, '_')

  generateReport(
    `Student Profile - ${studentName.value}`,
    ['Category', 'Details'],
    rows,
    `${safeName}_Profile.pdf`,
    { columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }, extraTables }
  )
}

onMounted(async () => {
  await loadStudentData()
})
watch(studentId, () => { closeWalletPreview(); management.value = null; selectedSemesterId.value = null; studentName.value = ''; void loadStudentData() })
onBeforeUnmount(closeWalletPreview)
</script>
