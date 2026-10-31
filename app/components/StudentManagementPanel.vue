<template>
  <section v-if="error || management?.capabilities.correctRecords" id="student-management" class="app-surface-ui rounded-card border border-surface-border bg-surface p-4 md:p-6 lg:p-8 shadow-sm space-y-5" aria-labelledby="student-management-title">
      <h2 id="student-management-title" class="text-sm font-bold text-slate-800 uppercase tracking-wider">Student Management</h2>
      <p v-if="error" role="alert" class="text-sm text-rose-700">{{ error }}</p>
      <template v-if="management">
      <form v-if="management.capabilities.editContact" class="space-y-3 border-t border-surface-border pt-4" @submit.prevent="saveContact">
        <label class="block text-sm font-medium text-text-muted">Student phone number
          <input v-model="phoneNumber" type="tel" maxlength="50" class="rounded-control bg-surface-muted mt-2 w-full border border-surface-control p-2" :disabled="saving">
        </label>
        <label class="block text-sm font-medium text-text-muted">Contact correction reason
          <textarea v-model="contactReason" required maxlength="2000" rows="2" class="rounded-control bg-surface-muted mt-2 w-full border border-surface-control p-2" :disabled="saving" />
        </label>
        <button type="submit" :disabled="saving" class="rounded-control min-h-11 bg-sky-700 hover:bg-sky-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save contact details</button>
      </form>

      <details v-if="management.capabilities.correctRecords" class="border-t border-surface-border pt-4">
        <summary class="cursor-pointer text-sm font-semibold">Management history (latest 100 changes)</summary>
        <p v-if="!management.history.length" class="mt-3 text-sm text-text-muted">No management changes recorded.</p>
        <ol class="mt-3 space-y-4">
          <li v-for="change in management.history" :key="change.id" class="text-sm space-y-1 break-words">
            <p class="font-medium">{{ change.action }} · {{ new Date(change.created_at).toLocaleString() }}</p>
            <p class="text-text-muted">Actor: {{ change.actor_id }} · Record: {{ change.target_id }}</p>
            <p class="whitespace-pre-wrap">{{ change.reason }}</p>
            <details><summary class="cursor-pointer text-text-muted">Before and after</summary>
              <pre class="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs">{{ JSON.stringify({ before: change.before_value, after: change.after_value }, null, 2) }}</pre>
            </details>
          </li>
        </ol>
      </details>
      </template>
      <p v-if="success" role="status" class="text-sm text-emerald-700">{{ success }}</p>
  </section>
</template>

<script setup lang="ts">
import type { StudentManagement } from '~/types/student-management'

const props = defineProps<{ studentId: string }>()
const emit = defineEmits<{ loaded: [value: StudentManagement | null]; changed: [] }>()
const management = ref<StudentManagement | null>(null)
const semesterId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const phoneNumber = ref('')
const contactReason = ref('')
const pageCache = usePageCache()
let requestVersion = 0

const load = async () => {
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  management.value = null
  emit('loaded', null)
  try {
    const data = await $fetch<StudentManagement>(`/api/students/${encodeURIComponent(props.studentId)}/management`, {
      query: semesterId.value ? { semester_id: semesterId.value } : {}
    })
    if (version !== requestVersion) return
    management.value = data
    semesterId.value = data.semesterId
    phoneNumber.value = data.phoneNumber || ''
    emit('loaded', data)
  } catch {
    if (version === requestVersion) error.value = 'Unable to load management permissions. Records remain read-only. Check that the student-management migration is installed.'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
const selectSemester = async (id: number) => { semesterId.value = id; await load() }

const mutate = async (path: string, method: 'PUT' | 'POST', body: Record<string, unknown>) => {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch(path, { method, body: { ...body, semester_id: semesterId.value } })
    pageCache.clear()
    await load()
    emit('changed')
    success.value = 'Change saved with audit history.'
    contactReason.value = ''
  } catch (cause: any) {
    // Refresh capabilities after a possible permission change.
    await load()
    error.value = cause?.data?.statusMessage || 'Unable to save change.'
  } finally {
    saving.value = false
  }
}

const saveContact = () => mutate(`/api/students/${encodeURIComponent(props.studentId)}`, 'PUT', { phone_number: phoneNumber.value, reason: contactReason.value })
watch(() => props.studentId, () => { semesterId.value = null; success.value = ''; void load() }, { immediate: true })
defineExpose({ refresh: load, selectSemester })
</script>
