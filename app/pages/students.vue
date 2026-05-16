<template>
  <div class="space-y-8">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
      <div>
        <h1 class="text-4xl font-black text-black tracking-tight uppercase">Students</h1>
        <p class="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Directory of current cohort placements.</p>
      </div>
      <button
        v-if="isSuperCoordinator"
        class="bg-black text-white px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center gap-3"
        @click="showAddModal = true"
      >
        <i class="pi pi-plus"></i>
        New Enrollment
      </button>
    </header>

    <!-- Filter Bar -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-1 group">
        <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter records..."
          class="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-none outline-none focus:border-black transition-all text-xs font-black uppercase tracking-widest placeholder:text-slate-200"
        >
      </div>

      <select v-model="statusFilter" class="bg-white border border-slate-100 rounded-none px-6 py-4 text-xs font-black text-black uppercase tracking-widest outline-none cursor-pointer focus:border-black transition-all">
        <option value="all">All Statuses</option>
        <option value="Searching">Searching</option>
        <option value="Pending">Pending</option>
        <option value="Interview">Interview</option>
        <option value="Accepted">Accepted</option>
      </select>
    </div>

    <!-- Students Table -->
    <div class="bg-white border border-slate-100 overflow-hidden relative">
      <div v-if="isLoading" class="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
        <i class="pi pi-spin pi-spinner text-2xl text-black"></i>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
              <th class="px-8 py-6">Identity</th>
              <th class="px-8 py-6">Progress</th>
              <th class="px-8 py-6 text-center">Status</th>
              <th class="px-8 py-6 text-right">Docs</th>
              <th v-if="isSuperCoordinator" class="px-8 py-6"></th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-slate-50 text-xs">
            <tr v-if="students.length === 0 && !isLoading">
              <td colspan="5" class="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest">No matching records</td>
            </tr>
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="hover:bg-slate-50 transition-all cursor-pointer group"
              @click="navigateTo(`/student?id=${student.id}`)"
            >
              <td class="px-8 py-6">
                <div class="flex flex-col">
                  <span class="font-black text-black uppercase tracking-tight">{{ student.full_name }}</span>
                  <span class="text-[9px] font-bold text-slate-400 tabular-nums uppercase">{{ student.student_id || '---' }}</span>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="flex-1 h-1 bg-slate-100 rounded-none overflow-hidden max-w-[120px]">
                    <div 
                      class="h-full bg-black rounded-none transition-all duration-700" 
                      :style="{ width: student.completionPercent + '%' }"
                    ></div>
                  </div>
                  <span class="text-[9px] font-black text-slate-400 tabular-nums">{{ student.completionPercent }}%</span>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="flex justify-center">
                  <span :class="[
                    'px-3 py-1 border font-black uppercase text-[9px] tracking-tighter',
                    student.placementStatus === 'Accepted' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'
                  ]">
                    {{ student.placementStatus }}
                  </span>
                </div>
              </td>
              <td class="px-8 py-6 text-right font-black text-slate-900 tabular-nums">
                {{ student.documentCount }}
              </td>
              <td v-if="isSuperCoordinator" class="px-8 py-6 text-right" @click.stop>
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button class="h-8 w-8 flex items-center justify-center bg-black text-white hover:bg-slate-800 transition-all" @click="editStudent(student)">
                    <i class="pi pi-pencil text-[10px]"></i>
                  </button>
                  <button class="h-8 w-8 flex items-center justify-center border border-black text-black hover:bg-black hover:text-white transition-all" @click="confirmDelete(student)">
                    <i class="pi pi-trash text-[10px]"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
        <p class="text-[9px] font-black text-slate-300 uppercase tracking-widest uppercase">
          {{ totalCount }} Records Found
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage === 1"
            class="h-8 px-4 text-[9px] font-black uppercase tracking-widest text-black border border-black hover:bg-black hover:text-white disabled:opacity-30 transition-all"
            @click="currentPage--"
          >
            Prev
          </button>
          <button
            :disabled="currentPage >= totalPages"
            class="h-8 px-4 text-[9px] font-black uppercase tracking-widest text-black border border-black hover:bg-black hover:text-white disabled:opacity-30 transition-all"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- B&W Modal for Add/Edit -->
    <div v-if="showAddModal || editingStudent" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div class="bg-white w-full max-w-md p-10 border border-slate-100 shadow-2xl relative">
        <button class="absolute top-6 right-6 text-slate-300 hover:text-black" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        
        <h2 class="text-xl font-black text-black uppercase tracking-widest mb-8">{{ editingStudent ? 'Update Profile' : 'New Enrollment' }}</h2>
        
        <form @submit.prevent="saveStudent" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
            <input v-model="form.full_name" type="text" required class="w-full bg-slate-50 border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-black outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
            <input v-model="form.email" type="email" required class="w-full bg-slate-50 border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-black outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student ID / Matric</label>
            <input v-model="form.student_id" type="text" class="w-full bg-slate-50 border border-slate-100 rounded-none px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-black outline-none transition-all">
          </div>
          
          <button type="submit" :disabled="isSaving" class="w-full bg-black text-white h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all disabled:opacity-30 mt-4">
            {{ isSaving ? 'Processing...' : (editingStudent ? 'Update' : 'Enroll') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

definePageMeta({
  requiredRole: 'coordinator'
})

type StudentRow = {
  id: string
  full_name: string
  student_id: string | null
  email: string
  placementStatus: string
  completionPercent: number
  documentCount: number
}

const students = ref<StudentRow[]>([])
const totalCount = ref(0)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')

const { isSuperCoordinator } = useCoordinatorPrivileges()

const searchQuery = ref('')
const statusFilter = ref('all')
const currentPage = ref(1)
const pageSize = 10

const totalPages = computed(() => Math.max(Math.ceil(totalCount.value / pageSize), 1))
const pageStart = computed(() => (currentPage.value - 1) * pageSize)
const paginatedStudents = computed(() => students.value.slice(pageStart.value, pageStart.value + pageSize))

const showAddModal = ref(false)
const editingStudent = ref<StudentRow | null>(null)
const form = ref({ full_name: '', email: '', student_id: '' })

let searchDebounce: ReturnType<typeof setTimeout> | null = null

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    searchDebounce = null
    void fetchStudents()
  }, 300)
})

const fetchStudents = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.set('search', searchQuery.value)
    if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
    const response = await $fetch<{ students: StudentRow[], totalCount: number }>(`/api/students?${params.toString()}`)
    students.value = response.students
    totalCount.value = response.totalCount
  } catch (error: any) {
    errorMessage.value = 'Sync failed'
  } finally {
    isLoading.value = false
  }
}

const saveStudent = async () => {
  isSaving.value = true
  try {
    if (editingStudent.value) {
      await $fetch(`/api/students/${editingStudent.value.id}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await $fetch('/api/students', {
        method: 'POST',
        body: form.value
      })
    }
    await fetchStudents()
    closeModal()
  } catch (error: any) {
    alert('Save failed: ' + (error.data?.message || error.message))
  } finally {
    isSaving.value = false
  }
}

const editStudent = (student: StudentRow) => {
  editingStudent.value = student
  form.value = {
    full_name: student.full_name,
    email: student.email,
    student_id: student.student_id || ''
  }
}

const confirmDelete = async (student: StudentRow) => {
  if (confirm(`Archive record for ${student.full_name}?`)) {
    try {
      await $fetch(`/api/students/${student.id}`, { method: 'DELETE' })
      await fetchStudents()
    } catch (error: any) {
      alert('Delete failed')
    }
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingStudent.value = null
  form.value = { full_name: '', email: '', student_id: '' }
}

onMounted(fetchStudents)
</script>