<template>
  <div class="app-surface-ui relative min-h-screen">
    <div class="space-y-6 md:space-y-8 pb-24">
      <!-- Header with Search & Add -->
      <header class="flex flex-col md:flex-row flex-wrap md:items-end justify-between gap-6">
        <div class="w-full xl:flex-1 xl:min-w-[280px] max-w-xl">
          <h1 class="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">Student Directory</h1>
          <p class="mt-2 text-sm font-normal leading-relaxed text-text-muted xl:whitespace-nowrap">Manage student placements, milestones, and records.</p>
          <div class="relative group mt-4">
            <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-sky-700 transition-colors"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by name or matric number..."
              class="w-full pl-14 pr-6 py-4 bg-surface-muted border border-surface-control text-text-primary placeholder:text-text-muted rounded-control outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <select v-model="semesterFilter" @change="fetchStudents()" class="rounded-control bg-surface-muted border border-surface-control text-text-primary px-4 md:px-5 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700 cursor-pointer shadow-sm min-w-0 sm:min-w-[180px]">
            <option value="">Active Semester</option>
            <option v-for="c in semesters" :key="c.id" :value="c.id">{{ c.name }}</option>
            <option value="all">All Semesters</option>
          </select>
          <select v-model="statusFilter" class="rounded-control bg-surface-muted border border-surface-control text-text-primary px-4 md:px-5 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700 cursor-pointer shadow-sm">
            <option value="all">Status: All</option>
            <option value="unplaced">Status: Unplaced</option>
            <option value="Accepted">Status: Placed</option>
            <option value="Searching">Status: Searching</option>
            <option value="Pending">Status: Pending</option>
          </select>
          
          <button
            :disabled="isRefreshing"
            class="rounded-control bg-slate-600 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
            @click="fetchStudents(true)"
          >
            <i aria-hidden="true" :class="['pi pi-refresh', { 'pi-spin': isRefreshing }]"></i>
            Refresh
          </button>
          <button
            class="rounded-control bg-sky-700 text-white px-4 py-3 text-sm font-semibold whitespace-nowrap hover:bg-sky-800 transition-all flex items-center justify-center gap-2"
            title="Export Student Directory"
            aria-label="Export Student Directory"
            @click="generatePDF"
          >
            <i class="pi pi-file-pdf"></i>
            Export PDF
          </button>
          <button 
            v-if="isSuperCoordinator"
            class="rounded-control bg-sky-700 text-white px-4 py-3 text-sm font-semibold whitespace-nowrap hover:bg-sky-800 transition-all flex items-center justify-center gap-2"
            @click="openAddModal"
          >
            <i class="pi pi-user-plus"></i>
            Enroll Student
          </button>
        </div>
      </header>

      <!-- Mobile Cards -->
      <div class="block md:hidden space-y-3">
        <div v-if="isLoading" class="py-12 text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
        </div>
        <div v-else-if="filteredStudents.length === 0" class="py-12 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">No matching records found</div>
        <div v-for="student in filteredStudents" :key="student.id" class="rounded-card bg-surface border border-surface-border p-4 cursor-pointer hover:border-sky-700 transition-all" @click="selectStudent(student)">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="rounded-control h-10 w-10 bg-surface-muted border border-surface-border flex items-center justify-center font-black text-text-muted text-xs flex-shrink-0">
                {{ student.full_name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm truncate">{{ student.full_name }}</div>
                <div class="text-[9px] font-bold text-text-muted tabular-nums uppercase truncate mt-0.5">{{ student.student_id || 'NOT_ASSIGNED' }}</div>
              </div>
            </div>
            <button class="rounded-control h-8 w-8 bg-surface-muted text-text-muted hover:bg-surface-hover hover:text-text-primary flex items-center justify-center flex-shrink-0 ml-2" @click.stop="selectStudent(student)">
              <i class="pi pi-chevron-right text-[10px]"></i>
            </button>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-surface-border">
            <div class="flex items-center gap-2">
              <span :class="[
                'rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border',
                student.placementStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                student.placementStatus === 'Searching' ? 'bg-amber-400 text-slate-900 border-amber-400' : 'bg-surface-muted text-text-muted border-surface-border'
              ]">{{ student.placementStatus || 'Searching' }}</span>
              <span class="text-[9px] font-black text-text-muted tabular-nums">{{ student.completionPercent }}%</span>
            </div>
            <div class="flex items-center gap-2">
              <button v-if="isSuperCoordinator" class="rounded-control h-7 w-7 bg-slate-900 text-white flex items-center justify-center" @click.stop="editStudent(student)">
                <i class="pi pi-pencil text-[8px]"></i>
              </button>
              <button v-if="isSuperCoordinator" class="rounded-control h-7 w-7 border border-slate-900 text-slate-800 flex items-center justify-center" @click.stop="deleteStudent(student.id)">
                <i class="pi pi-trash text-[8px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Table -->
      <article class="rounded-card overflow-hidden hidden md:block bg-surface border border-surface-border shadow-sm relative">
        <div v-if="isLoading" class="rounded-card absolute inset-0 bg-surface/70 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-3xl text-sky-600"></i>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] bg-surface-muted border-b border-surface-border">
                <th class="w-14 px-4 py-6 text-center">#</th>
                <th class="px-10 py-6">Identity</th>
                <th class="px-10 py-6">Placement Status</th>
                <th class="px-10 py-6">Milestone Progress</th>
                <th class="px-10 py-6">Documents</th>
                <th class="px-10 py-6 text-right">Records</th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-surface-border">
              <tr v-if="filteredStudents.length === 0 && !isLoading" class="text-center">
                <td colspan="6" class="px-10 py-24 text-[10px] font-black text-text-muted uppercase tracking-widest">No matching records found</td>
              </tr>
              <tr v-for="(student, index) in filteredStudents" :key="student.id" class="group hover:bg-surface-hover transition-all cursor-pointer" :class="index % 2 ? 'bg-surface-muted' : 'bg-surface'" @click="selectStudent(student)">
                <td class="px-4 py-8 text-center text-[9px] font-black text-text-muted tabular-nums">{{ String(index + 1).padStart(2, '0') }}</td>
                <td class="px-10 py-8">
                  <div class="flex items-center gap-4">
                    <div class="rounded-control h-10 w-10 bg-surface-muted border border-surface-border flex items-center justify-center font-black text-text-muted group-hover:bg-slate-900 group-hover:text-white transition-all text-xs">
                      {{ student.full_name.charAt(0) }}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-black text-slate-800 uppercase tracking-tight group-hover:underline underline-offset-4 decoration-2 text-xs">{{ student.full_name }}</span>
                      <span class="text-[8px] font-bold text-text-muted tabular-nums uppercase">{{ student.student_id || 'NOT_ASSIGNED' }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-10 py-8">
                  <span :class="[
                    'rounded-badge px-3 py-1 text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap',
                    student.placementStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    student.placementStatus === 'Searching' ? 'bg-amber-400 text-slate-900 border-amber-400' : 'bg-surface-muted text-text-muted border-surface-border'
                  ]">
                    {{ student.placementStatus || 'Searching' }}
                  </span>
                </td>
                <td class="px-10 py-8">
                  <div class="flex items-center gap-4">
                    <div class="flex-1 h-1 bg-surface-border max-w-[100px] overflow-hidden">
                      <div class="h-full bg-sky-600 transition-all duration-1000" :style="{ width: student.completionPercent + '%' }"></div>
                    </div>
                    <span class="text-[9px] font-black text-slate-800 tabular-nums">{{ student.completionPercent }}%</span>
                  </div>
                </td>
                <td class="px-10 py-8">
                  <div class="flex items-center gap-2 text-text-muted">
                    <i class="pi pi-file text-[10px]"></i>
                    <span class="text-[9px] font-black tabular-nums">{{ student.documentCount }} Items</span>
                  </div>
                </td>
                <td class="px-10 py-8 text-right">
                  <div class="flex items-center justify-end gap-2 transition-all" @click.stop>
                    <button v-if="isSuperCoordinator" class="rounded-control h-8 w-8 bg-slate-900 text-white hover:brightness-150 flex items-center justify-center" @click="editStudent(student)">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button v-if="isSuperCoordinator" class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center" @click="deleteStudent(student.id)">
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                    <button class="rounded-control h-8 w-8 bg-surface-muted text-text-muted hover:bg-surface-hover hover:text-text-primary flex items-center justify-center" @click="selectStudent(student)">
                      <i class="pi pi-chevron-right text-[10px]"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <!-- Enrollment Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 p-4 sm:p-6">
      <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-lg p-6 sm:p-12 shadow-2xl relative border border-surface-border mx-4 sm:mx-0">
        <button class="rounded-control absolute top-8 right-8 text-text-muted hover:text-slate-800 transition-colors" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-widest mb-10">{{ editingId ? 'Update Record' : 'Enroll Student' }}</h2>
        <form @submit.prevent="saveStudent" class="space-y-8">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Full Name</label>
            <input v-model="form.full_name" type="text" required class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-text-primary text-xs font-black uppercase focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all">
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Matric Number</label>
              <input v-model="form.student_id" type="text" class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-text-primary text-xs font-black uppercase focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all tabular-nums">
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Email Address</label>
              <input v-model="form.email" type="email" required class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-text-primary text-xs font-black uppercase focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all">
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Phone Number</label>
            <input v-model="form.phone_number" type="text" placeholder="+60 12-345 6789" class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-text-primary placeholder:text-text-muted text-xs font-black uppercase focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all">
          </div>
          <label v-if="editingId" class="block text-sm font-medium text-text-muted">Correction reason
            <textarea v-model="editReason" required maxlength="2000" rows="2" class="rounded-control mt-2 w-full bg-surface-muted border border-surface-control text-text-primary p-3" />
          </label>
          <button type="submit" :disabled="isSaving" class="rounded-control w-full bg-sky-700 text-white h-16 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-sky-800 transition-all disabled:opacity-30">
            {{ isSaving ? 'Syncing...' : 'Confirm Enrollment' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'
import { generateReport } from '~/utils/pdfGenerator'

definePageMeta({
  requiredRole: 'coordinator'
})

import type { Database } from '~/types/supabase'

const { isSuperCoordinator } = useCoordinatorPrivileges()

const supabase = useSupabaseClient<Database>()
const route = useRoute()
const pageCache = usePageCache()
const cachedStudents = pageCache.read<{ students: Array<Record<string, any>> }>('/api/students')
const students = ref<Array<Record<string, any>>>(cachedStudents?.students || [])
const semesters = ref<Database['public']['Tables']['semesters']['Row'][]>([])
const isLoading = ref(!cachedStudents)
const isRefreshing = ref(false)
const isSaving = ref(false)
const searchQuery = ref('')
const statusFilter = ref(['unplaced', 'Accepted', 'Searching', 'Pending'].includes(String(route.query.status)) ? String(route.query.status) : 'all')
const semesterFilter = ref<number | string>('')
const editReason = ref('')

const showModal = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ full_name: '', student_id: '', email: '', phone_number: '' })

const filteredStudents = computed(() => {
  let list = students.value
  if (statusFilter.value === 'unplaced') list = list.filter(s => !['Accepted', 'Interview'].includes(s.placementStatus))
  else if (statusFilter.value !== 'all') list = list.filter(s => s.placementStatus === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.full_name.toLowerCase().includes(q) || (s.student_id && s.student_id.toLowerCase().includes(q)))
  }
  return list
})

const fetchStudents = async (force = false) => {
  isRefreshing.value = true
  const params = new URLSearchParams()
  if (semesterFilter.value) params.set('semester_id', String(semesterFilter.value))
  const qs = params.toString()
  const url = `/api/students${qs ? `?${qs}` : ''}`
  const cached = pageCache.read<{ students: any[] }>(url)
  if (cached) students.value = cached.students || []
  isLoading.value = !cached
  try {
    const { students: data } = await pageCache.fetch<{ students: any[] }>(url, { force })
    if (String(semesterFilter.value || '') === (params.get('semester_id') || '')) students.value = data || []
  } catch (error) {
    console.error('Fetch failed')
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

const fetchSemesters = async () => {
  const { data } = await supabase.from('semesters').select('*').order('created_at', { ascending: false })
  semesters.value = data || []
}

const selectStudent = (student: any) => {
  navigateTo({ path: '/student', query: { id: student.id } })
}

const saveStudent = async () => {
  isSaving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/students/${editingId.value}`, { method: 'PUT', body: { ...form.value, reason: editReason.value, ...(semesterFilter.value && semesterFilter.value !== 'all' ? { semester_id: semesterFilter.value } : {}) } })
    } else {
      await $fetch('/api/students', { method: 'POST', body: form.value })
    }
    pageCache.clear()
    await fetchStudents()
    closeModal()
  } catch (error: any) {
    console.error('Save failed:', error)
    console.error('Error data:', error?.data)
    console.error('Error response:', error?.response)
    alert(JSON.stringify(error?.data || error?.message || error, null, 2))
  } finally {
    isSaving.value = false
  }
}

const editStudent = (student: any) => {
  editReason.value = ''
  editingId.value = student.id
  form.value = { full_name: student.full_name, student_id: student.student_id || '', email: student.email || '', phone_number: student.phone_number || '' }
  showModal.value = true
}

const deleteStudent = async (id: string) => {
  if (confirm('Permanently remove record?')) {
    try {
      await $fetch(`/api/students/${id}`, { method: 'DELETE' })
      pageCache.clear()
      await fetchStudents()
    } catch (error) {
      alert('Delete failed')
    }
  }
}

const openAddModal = () => {
  editingId.value = null
  form.value = { full_name: '', student_id: '', email: '', phone_number: '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
}

const generatePDF = () => {
  const tableData = filteredStudents.value.map(s => [
    s.full_name,
    s.student_id || 'N/A',
    s.placementStatus || 'Searching',
    s.completionPercent + '%',
    String(s.documentCount)
  ])

  generateReport(
    'INTRA Buddy - Student Directory Report',
    ['Student Name', 'ID', 'Placement', 'Progress', 'Documents'],
    tableData,
    'INTRA_Student_Directory_Report.pdf',
    { styles: { fontSize: 8 } }
  )
}

onMounted(async () => {
  await Promise.all([fetchSemesters(), fetchStudents()])
})
</script>
