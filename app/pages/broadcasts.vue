<template>
  <div class="space-y-8 md:space-y-12">
    <!-- Top Half: Compose Broadcast -->
    <section class="bg-white border border-stone-200 p-4 sm:p-8 lg:p-12 shadow-sm relative overflow-hidden">
      <div class="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <i class="pi pi-megaphone text-[120px] text-black"></i>
      </div>

      <header class="mb-6 md:mb-10">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Dispatch Intelligence</h1>
        <p class="text-stone-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Send instant push notifications to the student mobile app.</p>
      </header>

      <form @submit.prevent="sendBroadcast" class="max-w-3xl space-y-8 relative z-10">
        <div class="space-y-2">
          <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Announcement Title</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="e.g., Mandatory Industry Briefing"
            required 
            class="w-full bg-white border border-stone-200 rounded-none px-6 py-4 text-xs font-black uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800 placeholder:text-stone-400"
          >
        </div>

        <div class="space-y-2">
          <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Detailed Content</label>
          <textarea 
            v-model="form.body" 
            rows="5" 
            placeholder="Enter the message you want to broadcast to all students..."
            required 
            class="w-full bg-white border border-stone-200 rounded-none px-6 py-4 text-xs font-bold uppercase tracking-widest focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all resize-none leading-relaxed text-slate-800 placeholder:text-stone-400"
          ></textarea>
        </div>

        <div class="space-y-2 pt-4">
          <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Target Audience</label>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <select
              v-model="form.target_audience"
              class="w-full sm:w-72 bg-white border border-stone-200 px-5 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 cursor-pointer shadow-sm"
            >
              <option value="students_all">Student</option>
              <option value="coordinators_all">Coordinator</option>
            </select>

            <button 
              type="submit" 
              :disabled="isSending" 
              class="w-full sm:w-auto bg-sky-600 text-white px-10 py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-30 whitespace-nowrap"
            >
              <i class="pi pi-send"></i>
              {{ isSending ? 'Broadcasting...' : 'Confirm Dispatch' }}
            </button>
          </div>
        </div>
      </form>
    </section>

    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Transmission History</h2>
        <span class="text-[8px] font-black text-stone-400 uppercase tracking-widest tabular-nums">{{ broadcasts.length }} Logs Detected</span>
      </div>

      <div v-if="broadcasts.length === 0" class="py-12 md:py-20 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest bg-white border border-stone-200">No previous transmissions recorded</div>

      <div v-else class="space-y-3">
      <div class="block md:hidden space-y-3">
        <div v-for="msg in broadcasts" :key="msg.id" class="bg-white border border-stone-200 p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="min-w-0 flex-1">
              <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ msg.title }}</div>
              <div class="text-[9px] text-stone-400 font-medium mt-1 line-clamp-2 uppercase tracking-tighter">{{ msg.body }}</div>
            </div>
            <button class="h-8 w-8 border border-red-400 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center flex-shrink-0 ml-2" @click="deleteBroadcast(msg.id)">
              <i class="pi pi-trash text-[10px]"></i>
            </button>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-stone-100">
            <div class="flex gap-2">
              <span v-for="role in msg.target_roles" :key="role" class="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ audienceLabels[role] || role }}</span>
            </div>
            <span class="text-[10px] font-black text-stone-400 tabular-nums uppercase">{{ msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : 'Unknown' }}</span>
          </div>
        </div>
      </div>

      <div class="hidden md:block bg-white border border-stone-200 overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50">
              <th class="px-10 py-6">Message Identifier</th>
              <th class="px-10 py-6">Recipients</th>
              <th class="px-10 py-6 text-right">Timestamp</th>
              <th class="px-10 py-6 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-stone-100">
            <tr v-for="msg in broadcasts" :key="msg.id" class="hover:bg-stone-50 transition-colors group">
              <td class="px-10 py-8">
                <div class="flex flex-col gap-1">
                  <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ msg.title }}</span>
                  <span class="text-[9px] text-stone-400 font-medium line-clamp-1 uppercase tracking-tighter">{{ msg.body }}</span>
                </div>
              </td>
              <td class="px-10 py-8">
                <div class="flex gap-2">
                  <span v-for="role in msg.target_roles" :key="role" class="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-tighter">{{ audienceLabels[role] || role }}</span>
                </div>
              </td>
              <td class="px-10 py-8 text-right text-stone-400 font-black tabular-nums group-hover:text-slate-800 transition-colors uppercase text-xs">
                {{ msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : 'Unknown' }}
              </td>
              <td class="px-10 py-8 text-right">
                <button class="h-8 w-8 border border-red-400 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all" @click="deleteBroadcast(msg.id)">
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
      <div v-if="successToast" class="fixed bottom-4 right-4 md:bottom-10 md:right-10 left-4 md:left-auto z-[100] bg-slate-900 text-white px-6 md:px-8 py-5 md:py-6 shadow-2xl flex items-center gap-4 md:gap-6 border-l-8 border-sky-600">
        <div class="h-8 w-8 md:h-10 md:w-10 bg-sky-600 text-white flex items-center justify-center">
          <i class="pi pi-check text-sm"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest">Broadcast Successful</p>
          <p class="text-[9px] font-bold text-white/60 uppercase mt-1">Notifications have been dispatched.</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

const audienceLabels: Record<string, string> = {
  students_all: 'All Students',
  students_unplaced: 'Unplaced Students',
  students_placed: 'Placed Students',
  students_late_logbooks: 'Late Logbooks',
  coordinators_all: 'All Coordinators'
}

const broadcasts = ref<any[]>([])
const isLoading = ref(true)
const isSending = ref(false)
const successToast = ref(false)

const form = ref({
  title: '',
  body: '',
  target_audience: 'students_all'
})

const fetchBroadcasts = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<any[]>('/api/broadcasts')
    broadcasts.value = data || []
  } catch (error) {
    console.error('Failed to sync history')
  } finally {
    isLoading.value = false
  }
}

const deleteBroadcast = async (id: number) => {
  if (!confirm('Permanently delete this transmission record?')) return
  try {
    await $fetch(`/api/broadcasts/${id}`, { method: 'DELETE' })
    await fetchBroadcasts()
  } catch (error) {
    alert('Delete failed')
  }
}

const sendBroadcast = async () => {
  isSending.value = true
  try {
    await $fetch('/api/broadcasts', {
      method: 'POST',
      body: {
        title: form.value.title,
        body: form.value.body,
        target_roles: [form.value.target_audience]
      }
    })
    
    // Reset form
    form.value = { title: '', body: '', target_audience: 'students_all' }
    
    // Show Toast
    successToast.value = true
    setTimeout(() => successToast.value = false, 5000)
    
    await fetchBroadcasts()
  } catch (error) {
    alert('Transmission failed')
  } finally {
    isSending.value = false
  }
}

onMounted(fetchBroadcasts)
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
