<template>
  <div class="p-8">
    <header class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Student Directory</h1>
        <p class="text-slate-500 mt-1">Manage and track your cohort's placement status.</p>
      </div>

      <button
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        @click="openCreateModal"
      >
        <i class="pi pi-user-plus"></i>
        Add Student
      </button>
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
          <option value="preparing">Preparing</option>
          <option value="searching">Searching</option>
          <option value="placed">Placed</option>
          <option value="completed">Completed</option>
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
              <th class="px-6 py-4 font-medium">Student ID</th>
              <th class="px-6 py-4 font-medium">Placement Status</th>
              <th class="px-6 py-4 font-medium text-right">Actions</th>
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
                <p>No matching students found.</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr
              v-for="student in students"
              :key="student.id"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900">{{ student.full_name }}</div>
              </td>
              <td class="px-6 py-4 text-slate-600">
                {{ student.student_id || 'N/A' }}
              </td>
              <td class="px-6 py-4">
                <span v-if="student.internship_status === 'preparing'" class="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Preparing
                </span>
                <span v-else-if="student.internship_status === 'searching'" class="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                  Searching
                </span>
                <span v-else-if="student.internship_status === 'placed'" class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                  Placed
                </span>
                <span v-else-if="student.internship_status === 'completed'" class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  Completed
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="p-2 text-slate-400 transition-colors hover:text-blue-600" @click="openEditModal(student)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="p-2 text-slate-400 transition-colors hover:text-red-600" @click="confirmDelete(student)">
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 text-sm text-slate-600">
        <p>
          <span v-if="totalCount === 0">No students to show.</span>
          <span v-else>
            Showing {{ pageStart + 1 }}-{{ pageStart + students.length }} of {{ totalCount }}
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

    <div v-if="isModalOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <header class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ editingStudentId ? 'Edit Student' : 'Add Student' }}
          </h2>
          <button class="rounded-md p-2 text-slate-500 transition hover:bg-slate-100" @click="closeModal">
            <i class="pi pi-times" />
          </button>
        </header>

        <form class="space-y-4" @submit.prevent="saveStudent">
          <label class="block text-sm font-medium text-slate-700">
            Full Name
            <input
              v-model="form.full_name"
              type="text"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
          </label>

          <label class="block text-sm font-medium text-slate-700">
            Student ID
            <input
              v-model="form.student_id"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
          </label>

          <label class="block text-sm font-medium text-slate-700">
            Internship Status
            <select
              v-model="form.internship_status"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="preparing">Preparing</option>
              <option value="searching">Searching</option>
              <option value="placed">Placed</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <p v-if="modalErrorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ modalErrorMessage }}
          </p>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSaving ? 'Saving...' : 'Save Student' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="pendingDelete" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 class="mb-2 text-lg font-semibold text-slate-900">Soft-delete student?</h2>
        <p class="mb-5 text-sm text-slate-600">
          {{ pendingDelete.full_name }} will be archived and hidden from active lists.
        </p>
        <div class="flex items-center justify-end gap-2">
          <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" @click="pendingDelete = null">
            Cancel
          </button>
          <button
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isDeleting"
            @click="softDeleteStudent"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator',
  superCoordinatorOnly: true
})

const supabase = useSupabaseClient<Database>()

type StudentRow = {
  id: string
  full_name: string
  student_id: string | null
  internship_status: 'preparing' | 'searching' | 'placed' | 'completed'
}

const students = ref<StudentRow[]>([])
const totalCount = ref(0)
const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const modalErrorMessage = ref('')

const searchQuery = ref('')
const statusFilter = ref<'all' | StudentRow['internship_status']>('all')

const isModalOpen = ref(false)
const editingStudentId = ref<string | null>(null)
const pendingDelete = ref<StudentRow | null>(null)

const form = ref({
  full_name: '',
  student_id: '',
  internship_status: 'preparing' as StudentRow['internship_status']
})

const pageSize = 10
const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.max(Math.ceil(totalCount.value / pageSize), 1)
})

const pageStart = computed(() => {
  return (currentPage.value - 1) * pageSize
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

const goToPreviousPage = async () => {
  if (currentPage.value <= 1) {
    return
  }

  currentPage.value -= 1
  await fetchStudents()
}

const goToNextPage = async () => {
  if (currentPage.value >= totalPages.value) {
    return
  }

  currentPage.value += 1
  await fetchStudents()
}

const resetForm = () => {
  form.value = {
    full_name: '',
    student_id: '',
    internship_status: 'preparing'
  }
}

const openCreateModal = () => {
  editingStudentId.value = null
  modalErrorMessage.value = ''
  resetForm()
  isModalOpen.value = true
}

const openEditModal = (student: StudentRow) => {
  editingStudentId.value = student.id
  modalErrorMessage.value = ''
  form.value = {
    full_name: student.full_name,
    student_id: student.student_id || '',
    internship_status: student.internship_status
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingStudentId.value = null
  modalErrorMessage.value = ''
  resetForm()
}

const escapeIlikePattern = (value: string) => {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`)
}

const fetchStudents = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const search = searchQuery.value.trim().replaceAll(',', ' ')
    const from = (currentPage.value - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('users')
      .select('id, full_name, student_id, internship_status', { count: 'exact' })
      .eq('role', 'student')
      .eq('is_active', true)

    if (statusFilter.value !== 'all') {
      query = query.eq('internship_status', statusFilter.value)
    }

    if (search.length > 0) {
      const pattern = `%${escapeIlikePattern(search)}%`
      query = query.or(`full_name.ilike.${pattern},student_id.ilike.${pattern}`)
    }

    const { data, error, count } = await query.order('full_name', { ascending: true }).range(from, to)

    if (error) {
      throw error
    }

    totalCount.value = count ?? 0

    const pages = Math.max(Math.ceil(totalCount.value / pageSize), 1)
    if (currentPage.value > pages) {
      currentPage.value = pages
      await fetchStudents()
      return
    }

    students.value = (data || []) as StudentRow[]
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch students.'
  } finally {
    isLoading.value = false
  }
}

const saveStudent = async () => {
  modalErrorMessage.value = ''
  isSaving.value = true

  try {
    if (!form.value.full_name.trim()) {
      throw new Error('Full name is required.')
    }

    const payload = {
      full_name: form.value.full_name.trim(),
      student_id: form.value.student_id.trim() || null,
      internship_status: form.value.internship_status,
      role: 'student' as const,
      is_active: true
    }

    if (editingStudentId.value) {
      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', editingStudentId.value)

      if (error) {
        throw error
      }
    } else {
      const { error } = await supabase
        .from('users')
        .insert(payload)

      if (error) {
        throw error
      }
    }

    closeModal()
    await fetchStudents()
  } catch (error: unknown) {
    modalErrorMessage.value = error instanceof Error ? error.message : 'Unable to save student.'
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (student: StudentRow) => {
  pendingDelete.value = student
}

const softDeleteStudent = async () => {
  if (!pendingDelete.value) {
    return
  }

  isDeleting.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', pendingDelete.value.id)

    if (error) {
      throw error
    }

    pendingDelete.value = null
    await fetchStudents()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete student.'
  } finally {
    isDeleting.value = false
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