<template>
  <div class="p-8">
    <header class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Student Directory</h1>
        <p class="text-slate-500 mt-1">Manage and track your active cohort's milestone progress.</p>
      </div>
    </header>

    <p v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50/50 p-5">
        <div class="relative flex-1 max-w-md">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name or student ID..."
            class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700"
          >
        </div>

        <select
          v-model="statusFilter"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Statuses</option>
          <option value="Searching">Searching</option>
          <option value="Pending">Pending</option>
          <option value="Interview">Interview</option>
          <option value="Accepted">Accepted</option>
        </select>

        <button
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          :disabled="isLoading"
          @click="fetchStudents"
        >
          Refresh
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th class="px-6 py-4 font-medium">Student Name</th>
              <th class="px-6 py-4 font-medium">Milestone Progress</th>
              <th class="px-6 py-4 font-medium">Placement Status</th>
              <th class="px-6 py-4 font-medium text-right">Wallet Docs</th>
            </tr>
          </thead>
          
          <tbody v-if="isLoading">
            <tr>
              <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                <i class="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading directory...</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="students.length === 0">
            <tr>
              <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                <i class="pi pi-inbox text-3xl mb-2"></i>
                <p>No matching students found in active cohort.</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ student.full_name }}</div>
                <div class="text-xs text-slate-500 mt-1">{{ student.student_id || 'No ID' }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-2 flex-1 rounded bg-slate-200 max-w-[120px]">
                    <div
                      class="h-2 rounded bg-blue-500"
                      :style="{ width: `${student.completionPercent}%` }"
                    />
                  </div>
                  <span class="text-xs font-medium text-slate-600">{{ student.completionPercent }}%</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span v-if="student.placementStatus === 'Accepted'" class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                  Accepted
                </span>
                <span v-else-if="student.placementStatus === 'Interview'" class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  Interview
                </span>
                <span v-else-if="student.placementStatus === 'Pending'" class="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                  Pending
                </span>
                <span v-else class="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {{ student.placementStatus }}
                </span>
              </td>
              <td class="px-6 py-4 text-right text-slate-600 font-medium">
                {{ student.documentCount }}
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
            class="rounded-md border border-slate-300 px-3 py-1.5 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="goToPreviousPage"
          >
            Previous
          </button>
          <span class="px-2">Page {{ currentPage }} / {{ totalPages }}</span>
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
</script>