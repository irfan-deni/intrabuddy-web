<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Logbook Compliance</h1>
      <p class="mt-1 text-slate-500">Track pending, submitted, and overdue weekly logbook entries.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap gap-3 border-b border-slate-200 bg-slate-50/50 p-4">
        <label class="text-sm text-slate-700">
          Week
          <input
            v-model.number="weekFilter"
            type="number"
            min="1"
            class="mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
        </label>

        <label class="text-sm text-slate-700">
          Status
          <select
            v-model="statusFilter"
            class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>

        <div class="flex items-end">
          <button
            :disabled="isLoading"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            @click="loadLogbookCompliance"
          >
            Refresh
          </button>
        </div>
      </div>

      <div class="overflow-x-auto p-4">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="py-2">Student</th>
              <th class="py-2">Student ID</th>
              <th class="py-2">Week</th>
              <th class="py-2">Status</th>
              <th class="py-2">Reported At</th>
            </tr>
          </thead>

          <tbody v-if="isLoading">
            <tr>
              <td colspan="5" class="py-8 text-center text-slate-400">
                <i class="pi pi-spin pi-spinner mr-2" />
                Loading compliance data...
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredEntries.length === 0">
            <tr>
              <td colspan="5" class="py-8 text-center text-slate-400">No entries matched this filter.</td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="entry in filteredEntries" :key="entry.id" class="border-b border-slate-100">
              <td class="py-2 font-medium text-slate-900">{{ entry.student_name }}</td>
              <td class="py-2 text-slate-600">{{ entry.student_code }}</td>
              <td class="py-2">{{ entry.week_number }}</td>
              <td class="py-2">
                <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="statusClass(entry.submission_status)">
                  {{ entry.submission_status }}
                </span>
              </td>
              <td class="py-2 text-slate-500">{{ entry.self_reported_at ? formatDate(entry.self_reported_at) : 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

type LogbookEntry = Database['public']['Tables']['logbook_compliance']['Row']
type UserEntry = Database['public']['Tables']['users']['Row']

const supabase = useSupabaseClient<Database>()

const entries = ref<Array<LogbookEntry & { student_name: string; student_code: string }>>([])
const isLoading = ref(false)
const errorMessage = ref('')
const weekFilter = ref<number | null>(null)
const statusFilter = ref<'all' | 'pending' | 'submitted' | 'overdue'>('all')

const filteredEntries = computed(() => {
  return entries.value.filter((entry) => {
    const weekMatches = !weekFilter.value || entry.week_number === weekFilter.value
    const statusMatches = statusFilter.value === 'all' || entry.submission_status === statusFilter.value
    return weekMatches && statusMatches
  })
})

const loadLogbookCompliance = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [logbookResult, studentsResult] = await Promise.all([
      supabase
        .from('logbook_compliance')
        .select('id, student_id, week_number, submission_status, self_reported_at')
        .order('week_number', { ascending: false }),
      supabase
        .from('users')
        .select('id, full_name, student_id, role, internship_status, is_active, deleted_at, created_at')
        .eq('role', 'student')
        .eq('is_active', true)
    ])

    const loadErrors = [logbookResult.error, studentsResult.error].filter(Boolean)
    if (loadErrors.length > 0) {
      throw loadErrors[0]
    }

    const studentsById = new Map<string, UserEntry>()
    for (const student of studentsResult.data || []) {
      studentsById.set(student.id, student)
    }

    entries.value = (logbookResult.data || []).map((entry) => {
      const student = studentsById.get(entry.student_id)
      return {
        ...entry,
        student_name: student?.full_name || 'Unknown Student',
        student_code: student?.student_id || 'N/A'
      }
    })
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load logbook compliance.'
  } finally {
    isLoading.value = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const statusClass = (status: LogbookEntry['submission_status']) => {
  if (status === 'submitted') {
    return 'bg-green-100 text-green-700'
  }

  if (status === 'overdue') {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-slate-100 text-slate-700'
}

onMounted(async () => {
  await loadLogbookCompliance()
})
</script>
