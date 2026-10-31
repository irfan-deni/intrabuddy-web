<template>
  <div class="app-surface-ui space-y-8 md:space-y-10">
    <section>
      <header v-if="!embedded" class="mb-6">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Broadcasts</h1>
        <p class="text-text-muted mt-2 font-bold uppercase text-[10px] tracking-widest">Send announcements to students or coordinators.</p>
      </header>

      <form @submit.prevent="sendBroadcast" class="rounded-card max-w-3xl space-y-6 bg-surface border border-surface-border p-5 md:p-7 shadow-sm">
        <div class="flex flex-col gap-2">
          <label for="announcement-audience" class="text-[10px] font-black text-text-muted uppercase tracking-widest">Audience</label>
          <select
            id="announcement-audience"
            v-model="form.target_audience"
            :disabled="isSending"
            class="rounded-control w-full sm:w-72 bg-surface-muted border border-surface-control px-4 py-3 text-sm font-semibold outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700 cursor-pointer"
          >
            <option value="students_all">All students</option>
            <option value="coordinators_all">All coordinators</option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label for="announcement-title" class="text-[10px] font-black text-text-muted uppercase tracking-widest">Title</label>
          <input 
            id="announcement-title"
            v-model="form.title" 
            :disabled="isSending"
            maxlength="200"
            type="text" 
            placeholder="e.g., Industry briefing"
            required 
            class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-sm font-semibold focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800 placeholder:text-text-muted"
          >
        </div>

        <div class="flex flex-col gap-2">
          <label for="announcement-message" class="text-[10px] font-black text-text-muted uppercase tracking-widest">Message</label>
          <textarea 
            id="announcement-message"
            v-model="form.body" 
            :disabled="isSending"
            maxlength="18000"
            rows="5" 
            placeholder="Write your announcement..."
            required 
            class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-sm font-medium focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none leading-relaxed text-slate-800 placeholder:text-text-muted"
          ></textarea>

          <p id="announcement-image-help" class="text-xs text-text-muted">Up to 3 images, 5 MB each. PNG, JPEG, GIF, or WebP. Images upload only when you send.</p>
          <div class="flex flex-wrap items-center gap-3">
            <input ref="imageInputRef" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple class="hidden" aria-label="Choose announcement images" aria-describedby="announcement-image-help" :disabled="isSending || isAddingImages" @change="attachImages">
            <button type="button" :disabled="isSending || isAddingImages || attachments.length >= BROADCAST_IMAGE_LIMIT" class="rounded-control h-9 px-4 border border-surface-control text-text-muted hover:text-slate-800 hover:border-slate-800 text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50" @click="imageInputRef?.click()">
              <i class="pi pi-image"></i>
              {{ isAddingImages ? 'Checking images...' : 'Attach Image' }}
            </button>
            <span v-if="attachments.length > 0" class="text-xs font-medium text-text-muted tabular-nums">{{ attachments.length }} image{{ attachments.length > 1 ? 's' : '' }} attached</span>
          </div>

          <p v-if="attachmentError" role="alert" class="text-sm text-rose-700">{{ attachmentError }}</p>
          <div v-if="attachments.length > 0" class="flex flex-wrap gap-3 mt-2">
            <figure v-for="(attachment, idx) in attachments" :key="attachment.preview" class="w-36 rounded-control border border-surface-border bg-surface-muted p-2 space-y-2">
              <img v-if="attachment.status !== 'invalid'" :src="attachment.preview" :alt="`Selected attachment ${idx + 1}: ${attachment.file.name}`" class="rounded-control h-24 w-full object-contain" @load="attachment.status = 'ready'" @error="attachment.status = 'invalid'">
              <p v-else class="text-xs text-rose-700">This image cannot be previewed. Remove it and choose another image.</p>
              <figcaption class="text-xs text-text-muted break-words">{{ attachment.file.name }}</figcaption>
              <p v-if="attachment.status === 'pending'" role="status" class="text-xs text-text-muted">Checking preview…</p>
              <button type="button" :disabled="isSending" :aria-label="`Remove attached image ${idx + 1}`" class="rounded-control w-full border border-red-400 px-2 py-1 text-red-700 hover:bg-red-50 disabled:opacity-50" @click="removeImage(idx)">Remove</button>
            </figure>
          </div>
        </div>

        <p v-if="sendError" role="alert" class="text-sm text-rose-700">{{ sendError }}</p>
        <p v-if="isSending" role="status" class="text-sm text-text-muted">{{ attachments.length ? 'Uploading images and sending announcement. Please wait…' : 'Sending announcement…' }}</p>

        <div class="flex justify-end pt-1">
          <button
            type="submit"
            :disabled="isSending || isAddingImages || attachments.some(image => image.status !== 'ready')"
            class="rounded-control w-full sm:w-auto bg-sky-700 text-white px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-sky-800 transition-all flex items-center justify-center gap-2 disabled:opacity-30 whitespace-nowrap"
          >
            <i class="pi pi-send"></i>
            {{ isSending ? 'Sending...' : 'Send broadcast' }}
          </button>
        </div>
      </form>
    </section>

    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Broadcast History</h2>
        <div class="flex items-center gap-3">
          <button
            class="rounded-control h-8 px-3 bg-sky-700 hover:bg-sky-800 text-white text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
            @click="downloadAuditTrail"
          >
            <i class="pi pi-file-pdf"></i>
            Export PDF
          </button>
          <span class="text-[10px] font-black text-text-muted uppercase tracking-widest tabular-nums">{{ broadcasts.length }} broadcast{{ broadcasts.length === 1 ? '' : 's' }}</span>
        </div>
      </div>

      <div v-if="isLoading" class="rounded-card py-12 md:py-16 text-center text-text-muted bg-surface border border-surface-border">
        <i class="pi pi-spin pi-spinner text-xl text-sky-600 mr-2" />
        <span class="text-sm font-medium">Loading broadcasts...</span>
      </div>

      <div v-else-if="historyError" class="rounded-card p-5 bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-between gap-4">
        <span class="text-sm font-medium">{{ historyError }}</span>
        <button type="button" class="rounded-control shrink-0 border border-rose-300 px-3 py-2 text-xs font-semibold hover:bg-rose-100 transition-colors" @click="fetchBroadcasts(true)">Retry</button>
      </div>

      <div v-else-if="broadcasts.length === 0" class="rounded-card py-12 md:py-20 text-center text-sm font-medium text-text-muted bg-surface border border-surface-border">No broadcasts have been sent yet.</div>

      <div v-else class="space-y-3">
      <div class="block md:hidden space-y-3">
        <div v-for="msg in broadcasts" :key="msg.id" class="rounded-card bg-surface border border-surface-border p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="min-w-0 flex-1">
              <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ msg.title }}</div>
              <AnnouncementBody :body="msg.body" :image-paths="msg.image_paths" compact class="mt-1" />
            </div>
            <button class="rounded-control h-8 w-8 border border-red-400 text-red-700 hover:bg-red-700 hover:text-white flex items-center justify-center flex-shrink-0 ml-2" @click="deleteBroadcast(msg.id)">
              <i class="pi pi-trash text-[10px]"></i>
            </button>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-surface-border">
            <div class="flex gap-2">
              <span v-for="role in msg.target_roles" :key="role" class="rounded-badge px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ audienceLabels[role] || role }}</span>
            </div>
            <span class="text-xs font-medium text-text-muted tabular-nums">{{ formatDateTime(msg.sent_at) }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-card hidden md:block bg-surface border border-surface-border overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] bg-surface-muted">
              <th class="px-8 py-5">Announcement</th>
              <th class="px-8 py-5">Audience</th>
              <th class="px-8 py-5 text-right">Sent at</th>
              <th class="px-10 py-6 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-surface-border">
            <tr v-for="msg in broadcasts" :key="msg.id" class="hover:bg-surface-hover transition-colors group">
              <td class="px-8 py-5">
                <div class="flex flex-col gap-1">
                  <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ msg.title }}</span>
                  <AnnouncementBody :body="msg.body" :image-paths="msg.image_paths" compact />
                </div>
              </td>
              <td class="px-8 py-5">
                <div class="flex gap-2">
                  <span v-for="role in msg.target_roles" :key="role" class="rounded-badge px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ audienceLabels[role] || role }}</span>
                </div>
              </td>
              <td class="px-8 py-5 text-right text-text-muted font-medium tabular-nums group-hover:text-slate-800 transition-colors text-xs">
                {{ formatDateTime(msg.sent_at) }}
              </td>
              <td class="px-8 py-5 text-right">
                <button class="rounded-control h-8 w-8 border border-red-400 text-red-700 hover:bg-red-700 hover:text-white flex items-center justify-center transition-all" @click="deleteBroadcast(msg.id)">
                  <i class="pi pi-trash text-[10px]"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="successToast" class="rounded-card fixed bottom-4 right-4 md:bottom-10 md:right-10 left-4 md:left-auto z-[100] bg-slate-900 text-white px-6 md:px-8 py-5 md:py-6 shadow-2xl flex items-center gap-4 md:gap-6 border-l-8 border-sky-600">
        <div class="rounded-control h-8 w-8 md:h-10 md:w-10 bg-sky-700 text-white flex items-center justify-center">
          <i class="pi pi-check text-sm"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest">Broadcast Successful</p>
          <p class="text-[9px] font-bold text-white/60 uppercase mt-1">Announcement saved.</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { generateReport } from '~/utils/pdfGenerator'
import { BROADCAST_IMAGE_LIMIT, imageMatchesType, imageValidationError } from '~/utils/broadcast-attachments'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

const { embedded = false } = defineProps<{ embedded?: boolean }>()

definePageMeta({
  requiredRole: 'coordinator'
})

const supabase = useSupabaseClient<Database>()
const pageCache = usePageCache()

type Broadcast = Database['public']['Tables']['broadcast_messages']['Row']
const cachedBroadcasts = pageCache.read<Broadcast[]>('/api/broadcasts')
const broadcasts = ref<Broadcast[]>(cachedBroadcasts || [])
const isLoading = ref(!cachedBroadcasts)
const historyError = ref('')
const isSending = ref(false)
const successToast = ref(false)
type Attachment = { file: File; preview: string; status: 'pending' | 'ready' | 'invalid' }
const attachments = ref<Attachment[]>([])
const isAddingImages = ref(false)
const attachmentError = ref('')
const sendError = ref('')
let disposed = false
let successTimer: ReturnType<typeof setTimeout> | undefined

const imageInputRef = ref<HTMLInputElement | null>(null)

const audienceLabels: Record<string, string> = {
  students_all: 'All Students',
  students_unplaced: 'Unplaced Students',
  students_placed: 'Placed Students',
  students_late_logbooks: 'Late Logbooks',
  coordinators_all: 'All Coordinators'
}

const form = ref({
  title: '',
  body: '',
  target_audience: 'students_all'
})

const attachImages = async () => {
  if (isSending.value || isAddingImages.value) return
  const files = Array.from(imageInputRef.value?.files || [])
  if (!files.length) return
  attachmentError.value = ''
  isAddingImages.value = true
  try {
    if (attachments.value.length + files.length > BROADCAST_IMAGE_LIMIT) throw new Error('Attach at most 3 images. Remove an image before choosing more.')
    // Validate the whole selection before making any object URLs.
    const seen = new Set<string>()
    for (const file of files) {
      const invalid = imageValidationError(file)
      if (invalid) throw new Error(invalid)
      if (!imageMatchesType(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.type)) throw new Error('The selected file is not a valid supported image.')
      const key = `${file.name}:${file.size}:${file.type}`
      if (seen.has(key) || attachments.value.some(item => item.file.name === file.name && item.file.size === file.size && item.file.type === file.type)) throw new Error('That image is already attached.')
      seen.add(key)
    }
    if (disposed) return
    for (const file of files) attachments.value.push({ file, preview: URL.createObjectURL(file), status: 'pending' })
  } catch (error: any) {
    attachmentError.value = error?.message || 'Unable to read this image. Please choose it again.'
  } finally {
    isAddingImages.value = false
    if (imageInputRef.value) imageInputRef.value.value = ''
  }
}

const removeImage = (idx: number) => {
  if (isSending.value) return
  const attachment = attachments.value[idx]
  if (!attachment) return
  URL.revokeObjectURL(attachment.preview)
  attachments.value.splice(idx, 1)
  attachmentError.value = ''
}

const clearAttachments = () => {
  for (const attachment of attachments.value) URL.revokeObjectURL(attachment.preview)
  attachments.value = []
}

const fetchBroadcasts = async (force = false) => {
  const cached = pageCache.read<Broadcast[]>('/api/broadcasts')
  if (cached) broadcasts.value = cached
  isLoading.value = !cached
  historyError.value = ''
  try {
    const data = await pageCache.fetch<Broadcast[]>('/api/broadcasts', { force })
    broadcasts.value = data || []
  } catch {
    if (!cached) historyError.value = 'Unable to load broadcast history.'
  } finally {
    isLoading.value = false
  }
}

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '---'
  const d = new Date(dateStr)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const downloadAuditTrail = async () => {
  const coordinatorIds = [...new Set(broadcasts.value.map(b => b.coordinator_id).filter(Boolean) as string[])]

  const coordinatorsMap: Record<string, string> = {}
  if (coordinatorIds.length) {
    const { data: users } = await supabase.from('users').select('id, full_name').in('id', coordinatorIds)
    for (const u of users || []) coordinatorsMap[u.id] = u.full_name
  }

  const rows = broadcasts.value.map(b => [
    formatDateTime(b.sent_at),
    b.title || 'Untitled',
    (b.target_roles || []).map(r => audienceLabels[r] || r).join(', ') || 'All',
    b.coordinator_id ? (coordinatorsMap[b.coordinator_id] || 'Unknown') : 'System'
  ])

  generateReport('Broadcast Audit Trail', ['Date Sent', 'Message Title', 'Target Cohort / Segment', 'Sent By'], rows, 'Broadcast_Audit_Trail.pdf', { columnStyles: { 0: { fontStyle: 'bold' } } })
}

const deleteBroadcast = async (id: number) => {
  if (!confirm('Permanently delete this transmission record?')) return
  try {
    await $fetch(`/api/broadcasts/${id}`, { method: 'DELETE' })
    pageCache.invalidate('/api/broadcasts')
    await fetchBroadcasts(true)
  } catch (error) {
    alert('Delete failed')
  }
}

const sendBroadcast = async () => {
  if (isSending.value || isAddingImages.value || attachments.value.some(image => image.status !== 'ready')) return
  if (!form.value.title.trim() || !form.value.body.trim()) return
  sendError.value = ''
  isSending.value = true
  try {
    const payload = new FormData()
    payload.set('title', form.value.title)
    payload.set('body', form.value.body)
    payload.set('target_roles', JSON.stringify([form.value.target_audience]))
    for (const attachment of attachments.value) payload.append('images', attachment.file, attachment.file.name)
    await $fetch('/api/broadcasts', {
      method: 'POST', body: payload, retry: 0
    })
    if (disposed) return
    form.value = { title: '', body: '', target_audience: 'students_all' }
    clearAttachments()
    attachmentError.value = ''
    successToast.value = true
    if (successTimer) clearTimeout(successTimer)
    successTimer = setTimeout(() => successToast.value = false, 5000)
    
    pageCache.invalidate('/api/broadcasts')
    await fetchBroadcasts(true)
  } catch (error: any) {
    if (disposed) return
    sendError.value = error?.data?.statusMessage || 'Sending could not be confirmed. Your draft is preserved. Check announcement history before retrying to avoid a duplicate.'
    await fetchBroadcasts(true)
  } finally {
    isSending.value = false
  }
}

onMounted(fetchBroadcasts)
const canLeaveComposer = () => {
  if (!isSending.value) return true
  sendError.value = 'Please wait until this announcement finishes sending before leaving.'
  return false
}
onBeforeRouteLeave(canLeaveComposer)
onBeforeRouteUpdate(canLeaveComposer)
onBeforeUnmount(() => {
  disposed = true
  clearAttachments()
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
