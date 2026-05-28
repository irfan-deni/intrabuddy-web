<template>
  <div class="relative min-h-screen">
    <div class="space-y-12 pb-24">
      <!-- Header with Search & Add -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-stone-200 pb-6 md:pb-10">
        <div class="flex-1 max-w-xl">
          <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Student Directory</h1>
          <p class="text-stone-500 mt-2 mb-4 font-bold uppercase text-[10px] tracking-widest">Manage student placements, milestones, and records.</p>
          <div class="relative group">
            <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-sky-600 transition-colors"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by name or matric number..."
              class="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-none outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select v-model="semesterFilter" @change="fetchStudents" class="bg-white border border-stone-200 px-4 md:px-5 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 cursor-pointer shadow-sm min-w-0 sm:min-w-[180px]">
            <option value="">Active Semester</option>
            <option v-for="c in semesters" :key="c.id" :value="c.id">{{ c.name }}</option>
            <option value="all">All Semesters</option>
          </select>
          <select v-model="statusFilter" class="bg-white border border-stone-200 px-4 md:px-5 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 cursor-pointer shadow-sm">
            <option value="all">Status: All</option>
            <option value="Accepted">Status: Placed</option>
            <option value="Searching">Status: Searching</option>
            <option value="Pending">Status: Pending</option>
          </select>
          
          <button
            class="bg-indigo-600 text-white px-4 md:px-6 py-3 md:py-4 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            @click="generatePDF"
          >
            <i class="pi pi-file-pdf"></i>
            Export Student Directory
          </button>
          <button 
            v-if="isSuperCoordinator"
            class="bg-sky-600 text-white px-6 md:px-8 py-3 md:py-4 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10"
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
        <div v-else-if="filteredStudents.length === 0" class="py-12 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">No matching records found</div>
        <div v-for="student in filteredStudents" :key="student.id" class="bg-white border border-stone-200 p-4 cursor-pointer hover:border-sky-600 transition-all" @click="selectStudent(student)">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="h-10 w-10 bg-stone-50 border border-stone-200 flex items-center justify-center font-black text-stone-400 text-xs flex-shrink-0">
                {{ student.full_name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm truncate">{{ student.full_name }}</div>
                <div class="text-[9px] font-bold text-stone-400 tabular-nums uppercase truncate mt-0.5">{{ student.student_id || 'NOT_ASSIGNED' }}</div>
              </div>
            </div>
            <button class="h-8 w-8 bg-stone-100 text-stone-400 hover:bg-sky-600 hover:text-slate-800 flex items-center justify-center flex-shrink-0 ml-2" @click.stop="selectStudent(student)">
              <i class="pi pi-chevron-right text-[10px]"></i>
            </button>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-stone-100">
            <div class="flex items-center gap-2">
              <span :class="[
                'px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border',
                student.placementStatus === 'Accepted' ? 'bg-emerald-500 text-white border-emerald-500' : 
                student.placementStatus === 'Searching' ? 'bg-amber-400 text-slate-900 border-amber-400' : 'bg-white text-stone-400 border-stone-200'
              ]">{{ student.placementStatus || 'Searching' }}</span>
              <span class="text-[9px] font-black text-stone-400 tabular-nums">{{ student.completionPercent }}%</span>
            </div>
            <div class="flex items-center gap-2">
              <button v-if="isSuperCoordinator" class="h-7 w-7 bg-slate-900 text-white flex items-center justify-center" @click.stop="editStudent(student)">
                <i class="pi pi-pencil text-[8px]"></i>
              </button>
              <button v-if="isSuperCoordinator" class="h-7 w-7 border border-slate-900 text-slate-800 flex items-center justify-center" @click.stop="deleteStudent(student.id)">
                <i class="pi pi-trash text-[8px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Table -->
      <article class="hidden md:block bg-white border border-stone-200 shadow-sm relative">
        <div v-if="isLoading" class="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-3xl text-sky-600"></i>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50 border-b border-stone-200">
                <th class="px-10 py-6">Identity</th>
                <th class="px-10 py-6">Placement Status</th>
                <th class="px-10 py-6">Milestone Progress</th>
                <th class="px-10 py-6">Documents</th>
                <th class="px-10 py-6 text-right">Records</th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-stone-100">
              <tr v-if="filteredStudents.length === 0 && !isLoading" class="text-center">
                <td colspan="5" class="px-10 py-24 text-[10px] font-black text-stone-400 uppercase tracking-widest">No matching records found</td>
              </tr>
              <tr v-for="student in filteredStudents" :key="student.id" class="group hover:bg-stone-50 transition-all cursor-pointer" @click="selectStudent(student)">
                <td class="px-10 py-8">
                  <div class="flex items-center gap-4">
                    <div class="h-10 w-10 bg-stone-50 border border-stone-200 flex items-center justify-center font-black text-stone-400 group-hover:bg-slate-900 group-hover:text-white transition-all text-xs">
                      {{ student.full_name.charAt(0) }}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-black text-slate-800 uppercase tracking-tight group-hover:underline underline-offset-4 decoration-2 text-xs">{{ student.full_name }}</span>
                      <span class="text-[8px] font-bold text-stone-400 tabular-nums uppercase">{{ student.student_id || 'NOT_ASSIGNED' }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-10 py-8">
                  <span :class="[
                    'px-3 py-1 text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap',
                    student.placementStatus === 'Accepted' ? 'bg-emerald-500 text-white border-emerald-500' : 
                    student.placementStatus === 'Searching' ? 'bg-amber-400 text-slate-900 border-amber-400' : 'bg-white text-stone-400 border-stone-200'
                  ]">
                    {{ student.placementStatus || 'Searching' }}
                  </span>
                </td>
                <td class="px-10 py-8">
                  <div class="flex items-center gap-4">
                    <div class="flex-1 h-1 bg-stone-100 max-w-[100px] overflow-hidden">
                      <div class="h-full bg-sky-600 transition-all duration-1000" :style="{ width: student.completionPercent + '%' }"></div>
                    </div>
                    <span class="text-[9px] font-black text-slate-800 tabular-nums">{{ student.completionPercent }}%</span>
                  </div>
                </td>
                <td class="px-10 py-8">
                  <div class="flex items-center gap-2 text-stone-400">
                    <i class="pi pi-file text-[10px]"></i>
                    <span class="text-[9px] font-black tabular-nums">{{ student.documentCount }} Items</span>
                  </div>
                </td>
                <td class="px-10 py-8 text-right">
                  <div class="flex items-center justify-end gap-2 transition-all" @click.stop>
                    <button v-if="isSuperCoordinator" class="h-8 w-8 bg-slate-900 text-white hover:brightness-150 flex items-center justify-center" @click="editStudent(student)">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button v-if="isSuperCoordinator" class="h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center" @click="deleteStudent(student.id)">
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                    <button class="h-8 w-8 bg-stone-100 text-stone-400 hover:bg-sky-600 hover:text-slate-800 flex items-center justify-center" @click="selectStudent(student)">
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

    <!-- Sliding Sidebar Profile -->
    <Transition name="slide">
      <div v-if="selectedStudent" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[100] border-l border-stone-200 overflow-y-auto">
        <div class="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 md:px-12 py-6 md:py-10 border-b border-stone-100 flex items-center justify-between">
          <div class="flex items-center gap-4 md:gap-6">
            <button class="h-10 w-10 border border-stone-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all" @click="selectedStudent = null">
              <i class="pi pi-arrow-left text-[10px]"></i>
            </button>
            <h2 class="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest">Student Profile</h2>
          </div>
          <NuxtLink :to="`/student?id=${selectedStudent.id}`" class="text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-slate-800 hover:underline transition-all whitespace-nowrap">
            Full Profile
          </NuxtLink>
        </div>

        <div class="p-6 md:p-12 space-y-6 md:space-y-12">
          <div class="bg-slate-900 p-6 md:p-10 text-white flex flex-col gap-6 md:gap-8">
            <div class="flex flex-col gap-2">
              <span class="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Identity Record</span>
              <h3 class="text-2xl md:text-3xl font-black uppercase tracking-tight">{{ selectedStudent.full_name }}</h3>
              <span class="text-xs font-bold text-stone-400 tabular-nums uppercase">{{ selectedStudent.student_id }}</span>
            </div>
            
            <div class="grid grid-cols-3 gap-6 md:gap-8 pt-6 md:pt-8 border-t border-white/10">
              <div>
                <p class="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-2">Email Access</p>
                <p class="text-xs font-bold truncate text-stone-400">{{ selectedStudent.email || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-2">Phone Number</p>
                <p class="text-xs font-bold trunate text-stone-400">{{ selectedStudent.phone_number || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-2">Market Status</p>
                <p class="text-xs font-black uppercase tracking-tighter">{{ selectedStudent.placementStatus }}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 md:gap-6">
            <div class="border border-stone-200 p-4 md:p-6 flex flex-col gap-4">
              <span class="text-[9px] font-black text-stone-400 uppercase tracking-widest">Checklist State</span>
              <div class="flex items-end justify-between">
                <span class="text-2xl md:text-3xl font-black text-slate-800 tabular-nums">{{ selectedStudent.completionPercent }}%</span>
                <div class="h-8 md:h-10 w-1 bg-sky-600"></div>
              </div>
            </div>
            <div class="border border-stone-200 p-4 md:p-6 flex flex-col gap-4">
              <span class="text-[9px] font-black text-stone-400 uppercase tracking-widest">Vault Items</span>
              <div class="flex items-end justify-between">
                <span class="text-2xl md:text-3xl font-black text-slate-800 tabular-nums">{{ selectedStudent.documentCount }}</span>
                <div class="h-8 md:h-10 w-1 bg-stone-200"></div>
              </div>
            </div>
          </div>

          <div class="bg-stone-50 p-6 md:p-8 text-center border border-stone-200">
            <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 leading-relaxed">
              For detailed logbook tracking and document validation, please proceed to the full profile view.
            </p>
            <NuxtLink :to="`/student?id=${selectedStudent.id}`" class="inline-block bg-sky-600 text-white px-6 md:px-8 py-3 text-[9px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all">
              Launch Detailed View
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Overlay for Sidebar -->
    <div v-if="selectedStudent" class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90]" @click="selectedStudent = null"></div>

    <!-- Enrollment Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 p-4 sm:p-6">
      <div class="bg-white w-full max-w-lg p-6 sm:p-12 shadow-2xl relative border border-stone-200 mx-4 sm:mx-0">
        <button class="absolute top-8 right-8 text-stone-400 hover:text-slate-800 transition-colors" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-widest mb-10">{{ editingId ? 'Update Record' : 'Enroll Student' }}</h2>
        <form @submit.prevent="saveStudent" class="space-y-8">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Full Name</label>
            <input v-model="form.full_name" type="text" required class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all">
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Matric Number</label>
              <input v-model="form.student_id" type="text" class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all tabular-nums">
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Email Address</label>
              <input v-model="form.email" type="email" required class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all">
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Phone Number</label>
            <input v-model="form.phone_number" type="text" placeholder="+60 12-345 6789" class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all">
          </div>
          <button type="submit" :disabled="isSaving" class="w-full bg-sky-600 text-white h-16 font-black text-[10px] uppercase tracking-[0.4em] hover:brightness-110 transition-all disabled:opacity-30">
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
const students = ref<Array<Record<string, any>>>([])
const semesters = ref<Database['public']['Tables']['semesters']['Row'][]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const semesterFilter = ref<number | string>('')

const showModal = ref(false)
const selectedStudent = ref<Record<string, any> | null>(null)
const editingId = ref<string | null>(null)
const form = ref({ full_name: '', student_id: '', email: '', phone_number: '' })

const filteredStudents = computed(() => {
  let list = students.value
  if (statusFilter.value !== 'all') list = list.filter(s => s.placementStatus === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.full_name.toLowerCase().includes(q) || (s.student_id && s.student_id.toLowerCase().includes(q)))
  }
  return list
})

const fetchStudents = async () => {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (semesterFilter.value) params.set('semester_id', String(semesterFilter.value))
    const qs = params.toString()
    const { students: data } = await $fetch<{ students: any[] }>(`/api/students${qs ? `?${qs}` : ''}`)
    students.value = data || []
  } catch (error) {
    console.error('Fetch failed')
  } finally {
    isLoading.value = false
  }
}

const fetchSemesters = async () => {
  const { data } = await supabase.from('semesters').select('*').order('created_at', { ascending: false })
  semesters.value = data || []
}

const selectStudent = (student: any) => {
  selectedStudent.value = student
}

const saveStudent = async () => {
  isSaving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/students/${editingId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/students', { method: 'POST', body: form.value })
    }
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
  editingId.value = student.id
  form.value = { full_name: student.full_name, student_id: student.student_id || '', email: student.email || '', phone_number: student.phone_number || '' }
  showModal.value = true
}

const deleteStudent = async (id: string) => {
  if (confirm('Permanently remove record?')) {
    try {
      await $fetch(`/api/students/${id}`, { method: 'DELETE' })
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

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>