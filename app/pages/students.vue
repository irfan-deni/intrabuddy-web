<template>
  <div class="p-8 lg:p-10">
    <header class="mb-8 flex items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-brand-blue">Directory</p>
        <h1 class="mt-2 text-4xl font-black tracking-tight text-brand-navy">Student Directory</h1>
        <p class="mt-2 text-slate-500">Manage and track your active cohort's milestone progress.</p>
      </div>
      <button
        v-if="isSuperCoordinator"
        class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        @click="openAddModal"
      >
        <i class="pi pi-plus mr-2"></i> Add Student
      </button>
    </header>

    <p v-if="errorMessage" class="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div class="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50/60 p-5">
        <div class="relative flex-1 max-w-md">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name or student ID..."
            class="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          >
        </div>

        <select
          v-model="statusFilter"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        >
          <option value="all">All Statuses</option>
          <option value="Searching">Searching</option>
          <option value="Pending">Pending</option>
          <option value="Interview">Interview</option>
          <option value="Accepted">Accepted</option>
        </select>

        <button
          class="rounded-2xl border border-brand-blue/15 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-brand-bg"
          :disabled="isLoading"
          @click="fetchStudents"
        >
          Refresh
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-sm text-slate-500">
              <th class="px-6 py-4 font-medium">Student Name</th>
              <th class="px-6 py-4 font-medium">Milestone Progress</th>
              <th class="px-6 py-4 font-medium">Placement Status</th>
              <th class="px-6 py-4 font-medium text-right">Wallet Docs</th>
              <th v-if="isSuperCoordinator" class="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody v-if="isLoading">
            <tr>
              <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                <i class="pi pi-spinner pi-spin mb-2 text-2xl"></i>
                <p>Loading directory...</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="students.length === 0">
            <tr>
              <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                <i class="pi pi-inbox mb-2 text-3xl"></i>
                <p>No matching students found in active cohort.</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
<<<<<<< HEAD
              class="border-b border-slate-100 transition-colors hover:bg-brand-bg"
=======
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
              @click="navigateTo(`/student?id=${student.id}`)"
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
            >
              <td class="px-6 py-4">
                <div class="font-semibold text-brand-navy">{{ student.full_name }}</div>
                <div class="text-xs text-slate-500 mt-1">{{ student.student_id || 'No ID' }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="max-w-[140px] w-full">
                    <ProgressBar :value="student.completionPercent" />
                  </div>
                  <span class="text-xs font-medium text-slate-600">{{ student.completionPercent }}%</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <StatusBadge :status="student.placementStatus" />
              </td>
              <td class="px-6 py-4 text-right text-slate-600 font-medium">
                {{ student.documentCount }}
              </td>
              <td v-if="isSuperCoordinator" class="px-6 py-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                    title="Edit Student"
                    @click="openEditModal(student)"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    class="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                    title="Delete Student"
                    @click="openDeleteDialog(student)"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 text-sm text-slate-600">
        <p>
          <span v-if="totalCount === 0">No students to show.</span>
          <span v-else>
            Showing {{ pageStart + 1 }}-{{ Math.min(pageStart + pageSize, totalCount) }} of {{ totalCount }}
          </span>
        </p>
        <div class="flex items-center gap-2">
          <button
            class="rounded-xl border border-slate-200 px-3 py-1.5 transition hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="goToPreviousPage"
          >
            Previous
          </button>
          <span class="px-2">Page {{ currentPage }} / {{ totalPages }}</span>
          <button
            class="rounded-xl border border-slate-200 px-3 py-1.5 transition hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage >= totalPages"
            @click="goToNextPage"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

definePageMeta({
  requiredRole: 'coordinator'
})

import StatusBadge from '~/components/StatusBadge.vue'
import ProgressBar from '~/components/ProgressBar.vue'

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
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch students.'
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

// Modal Logic Mocks
const openAddModal = () => {
  alert('Add Student Modal (Super Coordinator Action)')
}

const openEditModal = (student: StudentRow) => {
  alert(`Edit Student: ${student.full_name}`)
}

const openDeleteDialog = (student: StudentRow) => {
  if (confirm(`Are you sure you want to delete ${student.full_name}?`)) {
    alert(`Deleted ${student.full_name}`)
  }
}
</script>