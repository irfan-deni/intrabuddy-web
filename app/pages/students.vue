<template>
  <div class="space-y-8">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
        <p class="text-slate-500 mt-1">Manage profiles and track progress for the current cohort.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="isSuperCoordinator"
          class="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
          @click="openAddModal"
        >
          <i class="pi pi-plus text-xs"></i>
          Add Student
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-3">
      <i class="pi pi-exclamation-circle"></i>
      {{ errorMessage }}
    </div>

    <!-- Modern Filters Bar -->
    <div class="bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center gap-2">
      <div class="relative flex-1 w-full">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, ID or major..."
          class="w-full pl-11 pr-4 py-3 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
        >
      </div>

      <div class="h-8 w-px bg-slate-100 hidden md:block"></div>

      <div class="flex items-center gap-2 px-2 w-full md:w-auto">
        <select v-model="statusFilter" class="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors w-full md:w-40">
          <option value="all">All Statuses</option>
          <option value="Searching">Searching</option>
          <option value="Pending">Pending</option>
          <option value="Interview">Interview</option>
          <option value="Accepted">Accepted</option>
        </select>
        <button 
          @click="fetchStudents" 
          :disabled="isLoading" 
          class="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-500"
        >
          <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- Students Table -->
    <div class="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <th class="px-8 py-5 font-bold">Student Identity</th>
              <th class="px-8 py-5 font-bold">Progress</th>
              <th class="px-8 py-5 font-bold text-center">Status</th>
              <th class="px-8 py-5 font-bold text-right">Wallet</th>
              <th v-if="isSuperCoordinator" class="px-8 py-5 font-bold text-right"></th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading">
              <td colspan="5" class="px-8 py-20 text-center text-slate-400">
                <div class="flex flex-col items-center gap-3">
                  <i class="pi pi-spin pi-spinner text-3xl text-slate-200"></i>
                  <p class="text-sm">Accessing directory data...</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="students.length === 0">
              <td colspan="5" class="px-8 py-20 text-center text-slate-400">
                <i class="pi pi-users text-4xl mb-4 text-slate-100"></i>
                <p class="text-sm font-medium">No students matched your search criteria.</p>
              </td>
            </tr>
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="hover:bg-slate-50/50 transition-all cursor-pointer group"
              @click="navigateTo(`/student?id=${student.id}`)"
            >
              <td class="px-8 py-5">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{{ student.full_name }}</span>
                  <span class="text-xs text-slate-500 font-medium tabular-nums">{{ student.student_id || '---' }}</span>
                </div>
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                    <div 
                      class="h-full bg-slate-900 rounded-full transition-all duration-500" 
                      :style="{ width: student.completionPercent + '%' }"
                    ></div>
                  </div>
                  <span class="text-xs font-bold text-slate-400 tabular-nums">{{ student.completionPercent }}%</span>
                </div>
              </td>
              <td class="px-8 py-5">
                <div class="flex justify-center">
                  <span :class="[
                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    student.placementStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 
                    student.placementStatus === 'Interview' ? 'bg-blue-100 text-blue-700' : 
                    student.placementStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                  ]">
                    {{ student.placementStatus }}
                  </span>
                </div>
              </td>
              <td class="px-8 py-5 text-right font-bold text-slate-400 tabular-nums">
                {{ student.documentCount }}
              </td>
              <td v-if="isSuperCoordinator" class="px-8 py-5 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600" @click="openEditModal(student)">
                    <i class="pi pi-pencil text-xs"></i>
                  </button>
                  <button class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-rose-600" @click="openDeleteDialog(student)">
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modern Pagination Bar -->
      <div class="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Showing {{ pageStart + 1 }} to {{ Math.min(pageStart + pageSize, totalCount) }} of {{ totalCount }}
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage === 1"
            class="h-9 px-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            @click="goToPreviousPage"
          >
            Prev
          </button>
          <div class="h-9 w-9 flex items-center justify-center bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-200">
            {{ currentPage }}
          </div>
          <button
            :disabled="currentPage >= totalPages"
            class="h-9 px-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            @click="goToNextPage"
          >
            Next
          </button>
        </div>
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
  placementStatus: string
  completionPercent: number
  documentCount: number
}

const students = ref<StudentRow[]>([])
const totalCount = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')

const { isSuperCoordinator } = useCoordinatorPrivileges()

const searchQuery = ref('')
const statusFilter = ref('all')

const pageSize = 10
const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.max(Math.ceil(totalCount.value / pageSize), 1)
})

const pageStart = computed(() => {
  return (currentPage.value - 1) * pageSize
})

const paginatedStudents = computed(() => {
  return students.value.slice(pageStart.value, pageStart.value + pageSize)
})

let searchDebounce: ReturnType<typeof setTimeout> | null = null

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }

  searchDebounce = setTimeout(() => {
    searchDebounce = null
    void fetchStudents()
  }, 300)
})

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

const fetchStudents = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const queryParams = new URLSearchParams()
    if (searchQuery.value) queryParams.set('search', searchQuery.value)
    if (statusFilter.value !== 'all') queryParams.set('status', statusFilter.value)

    const response = await $fetch<{ students: StudentRow[], totalCount: number }>(`/api/students?${queryParams.toString()}`)
    students.value = response.students
    totalCount.value = response.totalCount
  } catch (error: unknown) {
    errorMessage.value = 'Failed to fetch student directory'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchStudents()
})

onUnmounted(() => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
    searchDebounce = null
  }
})

const openAddModal = () => {
  alert('Add Student Modal (Modern SaaS Style)')
}

const openEditModal = (student: StudentRow) => {
  alert(`Edit: ${student.full_name}`)
}

const openDeleteDialog = (student: StudentRow) => {
  if (confirm(`Archive record for ${student.full_name}?`)) {
    alert('Record Archived')
  }
}
</script>