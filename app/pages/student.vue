<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Student Workspace (Coordinator View)</h1>
      <p class="mt-1 text-slate-500">View student readiness, applications, and logbook tracking.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <div v-if="!studentId" class="py-8 text-center text-slate-500">
      Please provide a student ?id= in the URL.
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
        <h2 class="mb-4 text-lg font-semibold text-slate-900">Pre-Internship Checklist</h2>
        <div v-if="isLoading" class="text-slate-400 text-sm">Loading...</div>
        <div v-else class="space-y-3">
          <label v-for="item in checklists" :key="item.id" class="flex items-center gap-3 text-sm text-slate-700">
            <input type="checkbox" :checked="item.is_completed || false" disabled class="h-4 w-4 opacity-70">
            {{ item.title }}
          </label>
        </div>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Job Applications</h2>
        </div>

        <div v-if="isLoading" class="py-8 text-center text-slate-400">
          <i class="pi pi-spin pi-spinner mr-2" />
          Loading applications...
        </div>

        <div v-else-if="applications.length === 0" class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No applications recorded yet.
        </div>

        <ul v-else class="space-y-3">
          <li v-for="application in applications" :key="application.id" class="rounded-lg border border-slate-200 p-3">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-semibold text-slate-900">{{ application.company_name }}</p>
                <p class="text-xs uppercase tracking-wide text-slate-500">{{ application.status }}</p>
              </div>
            </div>
          </li>
        </ul>
      </article>
    </div>

    <article v-if="studentId" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Weekly Logbook Tracking</h2>
      </div>

      <div v-if="isLoading" class="py-8 text-center text-slate-400">
        <i class="pi pi-spin pi-spinner mr-2" />
        Loading...
      </div>

      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="py-2">Week</th>
              <th class="py-2">End Date</th>
              <th class="py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in logbookEntries" :key="entry.id" class="border-b border-slate-100">
              <td class="py-2">{{ entry.week_number }}</td>
              <td class="py-2">{{ entry.week_end_date }}</td>
              <td class="py-2">
                <span v-if="entry.is_submitted" class="text-green-600 font-medium">Yes</span>
                <span v-else class="text-red-600 font-medium">No</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

type ApplicationRow = Database['public']['Tables']['job_applications']['Row']
type LogbookRow = Database['public']['Tables']['weekly_logbook_tracking']['Row']

type ChecklistItem = {
  id: number
  title: string
  is_completed: boolean | null
}

const supabase = useSupabaseClient<Database>()
const route = useRoute()

const studentId = computed(() => route.query.id as string || null)

const isLoading = ref(false)
const errorMessage = ref('')

const checklists = ref<ChecklistItem[]>([])
const applications = ref<ApplicationRow[]>([])
const logbookEntries = ref<LogbookRow[]>([])

const loadStudentData = async () => {
  if (!studentId.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [chkRes, appRes, logRes] = await Promise.all([
      supabase.from('student_checklists').select('id, is_completed, checklist_item_id').eq('student_id', studentId.value),
      supabase.from('job_applications').select('*').eq('student_id', studentId.value).order('application_date', { ascending: false }),
      supabase.from('weekly_logbook_tracking').select('*').eq('student_id', studentId.value).order('week_number', { ascending: true })
    ])

    if (appRes.data) applications.value = appRes.data
    if (logRes.data) logbookEntries.value = logRes.data

    if (chkRes.data) {
      // Need titles from templates
      const templateIds = chkRes.data.map(c => c.checklist_item_id).filter(Boolean) as number[]
      if (templateIds.length > 0) {
        const { data: tpls } = await supabase.from('checklist_templates').select('id, title').in('id', templateIds)
        
        checklists.value = chkRes.data.map(c => {
          const title = tpls?.find(t => t.id === c.checklist_item_id)?.title || 'Unknown Task'
          return {
            id: c.id,
            title,
            is_completed: c.is_completed
          }
        })
      }
    }

  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load student data.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadStudentData()
})
</script>
