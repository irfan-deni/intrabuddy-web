<template>
  <section class="space-y-6 p-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Student Workspace</h1>
      <p class="mt-1 text-slate-500">Track your readiness, applications, and weekly logbook submissions.</p>
    </header>

    <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
        <h2 class="mb-4 text-lg font-semibold text-slate-900">Pre-Internship Checklist</h2>
        <form class="space-y-3" @submit.prevent="saveChecklist">
          <label class="flex items-center gap-3 text-sm text-slate-700">
            <input v-model="checklist.resume_uploaded" type="checkbox" class="h-4 w-4">
            Resume uploaded
          </label>
          <label class="flex items-center gap-3 text-sm text-slate-700">
            <input v-model="checklist.university_forms_completed" type="checkbox" class="h-4 w-4">
            University forms completed
          </label>
          <label class="flex items-center gap-3 text-sm text-slate-700">
            <input v-model="checklist.is_ready_to_apply" type="checkbox" class="h-4 w-4">
            Ready to apply
          </label>

          <button
            type="submit"
            :disabled="isSavingChecklist"
            class="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isSavingChecklist ? 'Saving...' : 'Save Checklist' }}
          </button>
        </form>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Internship Applications</h2>
          <button
            class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            @click="openApplicationModal(null)"
          >
            Add Application
          </button>
        </div>

        <div v-if="isLoading" class="py-8 text-center text-slate-400">
          <i class="pi pi-spin pi-spinner mr-2" />
          Loading applications...
        </div>

        <div v-else-if="applications.length === 0" class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No applications yet. Start by adding your first company application.
        </div>

        <ul v-else class="space-y-3">
          <li v-for="application in applications" :key="application.id" class="rounded-lg border border-slate-200 p-3">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-semibold text-slate-900">{{ application.company_name }}</p>
                <p class="text-xs uppercase tracking-wide text-slate-500">{{ formatApplicationStatus(application.status) }}</p>
                <a
                  v-if="application.offer_letter_url"
                  :href="application.offer_letter_url"
                  target="_blank"
                  rel="noreferrer"
                  class="text-xs text-blue-600 hover:underline"
                >
                  View offer letter
                </a>
              </div>

              <div class="flex items-center gap-2">
                <button class="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100" @click="openApplicationModal(application)">
                  Edit
                </button>
                <button class="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50" @click="deleteApplication(application.id)">
                  Delete
                </button>
              </div>
            </div>
          </li>
        </ul>
      </article>
    </div>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Weekly Logbook Submissions</h2>
      </div>

      <form class="grid grid-cols-1 gap-3 md:grid-cols-4" @submit.prevent="submitLogbookWeek">
        <label class="text-sm text-slate-700">
          Week Number
          <input
            v-model.number="logbookForm.week_number"
            type="number"
            min="1"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
        </label>

        <label class="text-sm text-slate-700 md:col-span-2">
          Submission Status
          <select
            v-model="logbookForm.submission_status"
            class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>

        <div class="flex items-end">
          <button
            type="submit"
            :disabled="isSavingLogbook"
            class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isSavingLogbook ? 'Saving...' : 'Save Week' }}
          </button>
        </div>
      </form>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="py-2">Week</th>
              <th class="py-2">Status</th>
              <th class="py-2">Reported At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in logbookEntries" :key="entry.id" class="border-b border-slate-100">
              <td class="py-2">{{ entry.week_number }}</td>
              <td class="py-2">{{ entry.submission_status }}</td>
              <td class="py-2 text-slate-500">{{ entry.self_reported_at ? formatDate(entry.self_reported_at) : 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <div v-if="isApplicationModalOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <header class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ editingApplicationId ? 'Edit Application' : 'Add Application' }}
          </h2>
          <button class="rounded-md p-2 text-slate-500 transition hover:bg-slate-100" @click="closeApplicationModal">
            <i class="pi pi-times" />
          </button>
        </header>

        <form class="space-y-4" @submit.prevent="saveApplication">
          <label class="block text-sm font-medium text-slate-700">
            Company Name
            <input
              v-model="applicationForm.company_name"
              type="text"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
          </label>

          <label class="block text-sm font-medium text-slate-700">
            Status
            <select
              v-model="applicationForm.status"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="pending">Pending</option>
              <option value="interviewing">Interviewing</option>
              <option value="rejected">Rejected</option>
              <option value="offer_accepted">Offer Accepted</option>
            </select>
          </label>

          <label class="block text-sm font-medium text-slate-700">
            Offer Letter URL (optional)
            <input
              v-model="applicationForm.offer_letter_url"
              type="url"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
          </label>

          <p v-if="modalErrorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ modalErrorMessage }}
          </p>

          <div class="flex items-center justify-end gap-2">
            <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" @click="closeApplicationModal">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSavingApplication"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSavingApplication ? 'Saving...' : 'Save Application' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'student'
})

type ChecklistRow = Database['public']['Tables']['pre_internship_checklists']['Row']
type ApplicationRow = Database['public']['Tables']['internship_applications']['Row']
type LogbookRow = Database['public']['Tables']['logbook_compliance']['Row']

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()

const isLoading = ref(false)
const errorMessage = ref('')

const checklist = ref<ChecklistRow>({
  id: '',
  student_id: '',
  resume_uploaded: false,
  university_forms_completed: false,
  is_ready_to_apply: false
})
const isSavingChecklist = ref(false)

const applications = ref<ApplicationRow[]>([])
const isApplicationModalOpen = ref(false)
const editingApplicationId = ref<string | null>(null)
const isSavingApplication = ref(false)
const modalErrorMessage = ref('')
const applicationForm = ref({
  company_name: '',
  status: 'pending' as ApplicationRow['status'],
  offer_letter_url: ''
})

const logbookEntries = ref<LogbookRow[]>([])
const logbookForm = ref({
  week_number: 1,
  submission_status: 'submitted' as LogbookRow['submission_status']
})
const isSavingLogbook = ref(false)

const loadStudentData = async () => {
  if (!user.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [checklistResult, applicationsResult, logbookResult] = await Promise.all([
      supabase
        .from('pre_internship_checklists')
        .select('id, student_id, resume_uploaded, university_forms_completed, is_ready_to_apply')
        .eq('student_id', user.value.id)
        .maybeSingle(),
      supabase
        .from('internship_applications')
        .select('id, student_id, company_name, status, offer_letter_url')
        .eq('student_id', user.value.id)
        .order('company_name', { ascending: true }),
      supabase
        .from('logbook_compliance')
        .select('id, student_id, week_number, submission_status, self_reported_at')
        .eq('student_id', user.value.id)
        .order('week_number', { ascending: true })
    ])

    const fetchErrors = [
      checklistResult.error,
      applicationsResult.error,
      logbookResult.error
    ].filter(Boolean)

    if (fetchErrors.length > 0) {
      throw fetchErrors[0]
    }

    if (checklistResult.data) {
      checklist.value = checklistResult.data
    } else {
      checklist.value = {
        id: '',
        student_id: user.value.id,
        resume_uploaded: false,
        university_forms_completed: false,
        is_ready_to_apply: false
      }
    }

    applications.value = applicationsResult.data || []
    logbookEntries.value = logbookResult.data || []
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load student data.'
  } finally {
    isLoading.value = false
  }
}

const saveChecklist = async () => {
  if (!user.value) {
    return
  }

  isSavingChecklist.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('pre_internship_checklists')
      .upsert({
        student_id: user.value.id,
        resume_uploaded: checklist.value.resume_uploaded,
        university_forms_completed: checklist.value.university_forms_completed,
        is_ready_to_apply: checklist.value.is_ready_to_apply
      }, { onConflict: 'student_id' })

    if (error) {
      throw error
    }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save checklist.'
  } finally {
    isSavingChecklist.value = false
  }
}

const resetApplicationForm = () => {
  applicationForm.value = {
    company_name: '',
    status: 'pending',
    offer_letter_url: ''
  }
}

const openApplicationModal = (application: ApplicationRow | null) => {
  modalErrorMessage.value = ''
  if (!application) {
    editingApplicationId.value = null
    resetApplicationForm()
  } else {
    editingApplicationId.value = application.id
    applicationForm.value = {
      company_name: application.company_name,
      status: application.status,
      offer_letter_url: application.offer_letter_url || ''
    }
  }

  isApplicationModalOpen.value = true
}

const closeApplicationModal = () => {
  isApplicationModalOpen.value = false
  editingApplicationId.value = null
  modalErrorMessage.value = ''
  resetApplicationForm()
}

const saveApplication = async () => {
  if (!user.value) {
    return
  }

  modalErrorMessage.value = ''
  isSavingApplication.value = true

  try {
    if (!applicationForm.value.company_name.trim()) {
      throw new Error('Company name is required.')
    }

    const payload = {
      student_id: user.value.id,
      company_name: applicationForm.value.company_name.trim(),
      status: applicationForm.value.status,
      offer_letter_url: applicationForm.value.offer_letter_url.trim() || null
    }

    if (editingApplicationId.value) {
      const { error } = await supabase
        .from('internship_applications')
        .update(payload)
        .eq('id', editingApplicationId.value)
        .eq('student_id', user.value.id)

      if (error) {
        throw error
      }
    } else {
      const { error } = await supabase
        .from('internship_applications')
        .insert(payload)

      if (error) {
        throw error
      }
    }

    closeApplicationModal()
    await loadStudentData()
  } catch (error: unknown) {
    modalErrorMessage.value = error instanceof Error ? error.message : 'Unable to save application.'
  } finally {
    isSavingApplication.value = false
  }
}

const deleteApplication = async (id: string) => {
  if (!user.value) {
    return
  }

  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('internship_applications')
      .delete()
      .eq('id', id)
      .eq('student_id', user.value.id)

    if (error) {
      throw error
    }

    await loadStudentData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete application.'
  }
}

const submitLogbookWeek = async () => {
  if (!user.value) {
    return
  }

  if (logbookForm.value.week_number < 1) {
    errorMessage.value = 'Week number must be at least 1.'
    return
  }

  isSavingLogbook.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('logbook_compliance')
      .upsert({
        student_id: user.value.id,
        week_number: logbookForm.value.week_number,
        submission_status: logbookForm.value.submission_status,
        self_reported_at: new Date().toISOString()
      }, { onConflict: 'student_id,week_number' })

    if (error) {
      throw error
    }

    await loadStudentData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save logbook week.'
  } finally {
    isSavingLogbook.value = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const formatApplicationStatus = (status: ApplicationRow['status']) => {
  return status.replaceAll('_', ' ')
}

onMounted(async () => {
  await loadStudentData()
})
</script>
