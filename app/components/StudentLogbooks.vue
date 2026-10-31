<template>
  <section id="weekly-logbooks" class="app-surface-ui rounded-card border border-surface-border bg-surface p-4 md:p-6 lg:p-8 shadow-sm" aria-labelledby="weekly-logbooks-title">
    <h2 id="weekly-logbooks-title" class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Weekly Logbooks</h2>
    <p v-if="loading" role="status" class="text-sm text-text-muted">Loading logbooks…</p>
    <div v-else class="space-y-4">
      <p v-if="!logbooks.length" class="text-sm text-text-muted">No logbooks in this semester.</p>
      <div v-if="logbooks.length" class="md:hidden space-y-3">
        <div v-for="entry in logbooks" :key="entry.id" class="rounded-card bg-surface-muted border border-surface-border p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold text-slate-800 uppercase">Week {{ entry.week_number }}</p>
              <p class="mt-1 text-xs text-text-muted">Period end: {{ entry.week_end_date || '---' }}</p>
            </div>
            <StatusBadge :positive="!!entry.is_submitted" />
          </div>
          <div v-if="management" class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-3">
            <span class="text-xs font-semibold" :class="reviewFor(entry.id) ? 'text-sky-700' : 'text-text-muted'">{{ reviewFor(entry.id) ? (reviewFor(entry.id)?.status === 'reviewed' ? 'Reviewed' : 'Corrections requested') : 'Not reviewed' }}</span>
            <button v-if="entry.is_submitted && management.capabilities.reviewLogbooks" type="button" class="rounded-control min-h-11 border border-surface-control hover:bg-surface-hover px-3 py-2 text-sm" :disabled="saving" @click="startReview(entry.id)">Review week {{ entry.week_number }}</button>
          </div>
          <details v-if="reviewFor(entry.id)" class="mt-2 text-xs text-text-muted">
            <summary class="cursor-pointer">Review feedback</summary>
            <p class="mt-2 whitespace-pre-wrap break-words">{{ reviewFor(entry.id)?.feedback }}</p>
          </details>
        </div>
      </div>

      <div v-if="logbooks.length" class="hidden md:block overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-surface-border">
              <th scope="col" class="pb-4">Week</th>
              <th scope="col" class="pb-4">Period End</th>
              <th scope="col" class="pb-4">Submission</th>
              <th scope="col" class="pb-4 text-right">Review</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-border">
            <tr v-for="entry in logbooks" :key="entry.id" class="text-xs hover:bg-surface-hover transition-colors">
              <td class="py-4 font-bold text-slate-800">Week {{ entry.week_number }}</td>
              <td class="py-4 text-text-muted tabular-nums">{{ entry.week_end_date || '---' }}</td>
              <td class="py-4"><StatusBadge :positive="!!entry.is_submitted" /></td>
              <td class="py-4 text-right">
                <div v-if="management" class="flex flex-col items-end gap-1">
                  <span class="font-semibold" :class="reviewFor(entry.id) ? 'text-sky-700' : 'text-text-muted'">{{ reviewFor(entry.id) ? (reviewFor(entry.id)?.status === 'reviewed' ? 'Reviewed' : 'Corrections requested') : 'Not reviewed' }}</span>
                  <details v-if="reviewFor(entry.id)" class="max-w-52 text-xs text-text-muted">
                    <summary class="cursor-pointer">Review feedback</summary>
                    <p class="mt-2 whitespace-pre-wrap break-words text-left">{{ reviewFor(entry.id)?.feedback }}</p>
                  </details>
                  <button v-if="entry.is_submitted && management.capabilities.reviewLogbooks" type="button" class="rounded-control min-h-11 border border-surface-control hover:bg-surface-hover px-3 py-2 text-xs" :disabled="saving" @click="startReview(entry.id)">Review week {{ entry.week_number }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <form v-if="reviewId !== null && management?.capabilities.reviewLogbooks" class="space-y-3 border-t border-surface-border pt-4" @submit.prevent="saveReview">
        <div>
          <label for="management-review-outcome" class="block text-sm font-medium">Review outcome</label>
          <select id="management-review-outcome" v-model="reviewStatus" class="rounded-control bg-surface-muted mt-2 w-full border border-surface-control p-2" :disabled="saving">
            <option value="reviewed">Reviewed</option><option value="corrections_requested">Corrections requested</option>
          </select>
        </div>
        <label class="block text-sm font-medium">Review feedback
          <textarea v-model="reviewReason" required maxlength="2000" rows="3" class="rounded-control bg-surface-muted mt-2 w-full border border-surface-control p-2" :disabled="saving" />
        </label>
        <div class="flex flex-wrap gap-3">
          <button type="submit" :disabled="saving" class="rounded-control min-h-11 bg-sky-700 hover:bg-sky-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save review</button>
          <button type="button" :disabled="saving" class="rounded-control min-h-11 border border-surface-control hover:bg-surface-hover px-4 py-2" @click="reviewId = null">Cancel review</button>
        </div>
      </form>
    </div>
    <p v-if="error" role="alert" class="mt-4 text-sm text-rose-700">{{ error }}</p>
    <p v-if="success" role="status" class="mt-4 text-sm text-emerald-700">{{ success }}</p>
  </section>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { StudentManagement } from '~/types/student-management'
import StatusBadge from '~/components/StatusBadge.vue'

type LogbookEntry = Pick<Database['public']['Tables']['weekly_logbook_tracking']['Row'], 'id' | 'week_number' | 'week_end_date' | 'is_submitted'>
const props = defineProps<{ studentId: string; logbooks: LogbookEntry[]; management: StudentManagement | null; loading: boolean }>()
const emit = defineEmits<{ changed: [] }>()
const reviewId = ref<number | null>(null)
const reviewStatus = ref('reviewed')
const reviewReason = ref('')
const saving = ref(false)
const error = ref('')
const success = ref('')
const pageCache = usePageCache()
let displayedSemesterId: number | null = null

const reviewFor = (id: number) => props.management?.reviews.find(review => review.logbook_id === id)
const startReview = (id: number) => {
  reviewId.value = id
  reviewStatus.value = reviewFor(id)?.status || 'reviewed'
  reviewReason.value = reviewFor(id)?.feedback || ''
}
const saveReview = async () => {
  if (reviewId.value === null || !props.management?.capabilities.reviewLogbooks) return
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch(`/api/students/${encodeURIComponent(props.studentId)}/logbooks/${reviewId.value}/review`, {
      method: 'POST',
      body: { status: reviewStatus.value, reason: reviewReason.value, semester_id: props.management.semesterId }
    })
    pageCache.clear()
    reviewId.value = null
    reviewReason.value = ''
    emit('changed')
    success.value = 'Change saved with audit history.'
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'Unable to save review.'
    emit('changed')
  } finally {
    saving.value = false
  }
}

watch(() => props.studentId, () => {
  displayedSemesterId = null
  reviewId.value = null
  error.value = ''
  success.value = ''
})
watch(() => props.management?.semesterId, semester => {
  if (semester == null) return
  if (displayedSemesterId !== null && displayedSemesterId !== semester) {
    reviewId.value = null
    error.value = ''
    success.value = ''
  }
  displayedSemesterId = semester
})
</script>
