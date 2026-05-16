<template>
  <div class="space-y-12">
    <!-- Top Half: Compose Broadcast -->
    <section class="bg-white border border-slate-100 p-12 shadow-sm relative overflow-hidden">
      <div class="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <i class="pi pi-megaphone text-[120px] text-black"></i>
      </div>

      <header class="mb-10">
        <h1 class="text-3xl font-black text-brand-navy tracking-tight uppercase">Dispatch Intelligence</h1>
        <p class="text-text-muted mt-2 font-bold uppercase text-[10px] tracking-widest">Send instant push notifications to the student mobile app.</p>
      </header>

      <form @submit.prevent="sendBroadcast" class="max-w-3xl space-y-8 relative z-10">
        <div class="space-y-2">
          <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Announcement Title</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="e.g., Mandatory Industry Briefing"
            required 
            class="w-full bg-white border border-slate-100 rounded-none px-6 py-4 text-xs font-black uppercase tracking-widest focus:border-brand-cyan outline-none transition-all text-brand-navy placeholder:text-slate-300"
          >
        </div>

        <div class="space-y-2">
          <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Detailed Content</label>
          <textarea 
            v-model="form.body" 
            rows="5" 
            placeholder="Enter the message you want to broadcast to all students..."
            required 
            class="w-full bg-white border border-slate-100 rounded-none px-6 py-4 text-xs font-bold uppercase tracking-widest focus:border-brand-cyan outline-none transition-all resize-none leading-relaxed text-brand-navy placeholder:text-slate-300"
          ></textarea>
        </div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="form.target_roles" value="student" class="h-4 w-4 rounded-none border-brand-navy text-brand-cyan focus:ring-0">
              <span class="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover:text-brand-navy transition-colors">Target Students</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="form.target_roles" value="coordinator" class="h-4 w-4 rounded-none border-brand-navy text-brand-cyan focus:ring-0">
              <span class="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover:text-brand-navy transition-colors">Internal Only</span>
            </label>
          </div>

          <button 
            type="submit" 
            :disabled="isSending" 
            class="bg-brand-cyan text-brand-navy px-10 py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all flex items-center gap-3 disabled:opacity-30"
          >
            <i class="pi pi-send"></i>
            {{ isSending ? 'Broadcasting...' : 'Confirm Dispatch' }}
          </button>
        </div>
      </form>
    </section>

    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-black text-brand-navy uppercase tracking-[0.2em]">Transmission History</h2>
        <span class="text-[8px] font-black text-text-veryMuted uppercase tracking-widest tabular-nums">{{ broadcasts.length }} Logs Detected</span>
      </div>

      <div class="bg-white border border-slate-100 overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[9px] font-black text-text-veryMuted uppercase tracking-[0.2em] bg-slate-50/50">
              <th class="px-10 py-6">Message Identifier</th>
              <th class="px-10 py-6">Recipients</th>
              <th class="px-10 py-6 text-right">Timestamp</th>
              <th class="px-10 py-6 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-slate-50">
            <tr v-if="broadcasts.length === 0" class="text-center">
              <td colspan="4" class="px-10 py-20 text-[10px] font-black text-text-veryMuted uppercase tracking-widest">No previous transmissions recorded</td>
            </tr>
            <tr v-for="msg in broadcasts" :key="msg.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-10 py-8">
                <div class="flex flex-col gap-1">
                  <span class="font-black text-brand-navy uppercase tracking-tight">{{ msg.title }}</span>
                  <span class="text-[9px] text-text-veryMuted font-medium line-clamp-1 uppercase tracking-tighter">{{ msg.body }}</span>
                </div>
              </td>
              <td class="px-10 py-8">
                <div class="flex gap-2">
                  <span v-for="role in msg.target_roles" :key="role" class="px-2 py-0.5 bg-brand-navy text-white text-[8px] font-black uppercase tracking-tighter">
                    {{ role }}
                  </span>
                </div>
              </td>
              <td class="px-10 py-8 text-right text-text-veryMuted font-black tabular-nums group-hover:text-brand-navy transition-colors uppercase">
                {{ msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : 'Unknown' }}
              </td>
              <td class="px-10 py-8 text-right">
                <button
                  class="h-8 w-8 border border-red-400 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  @click="deleteBroadcast(msg.id)"
                  title="Delete transmission"
                >
                  <i class="pi pi-trash text-[10px]"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="successToast" class="fixed bottom-10 right-10 z-[100] bg-brand-navy text-white px-8 py-6 shadow-2xl flex items-center gap-6 border-l-8 border-brand-cyan">
        <div class="h-10 w-10 bg-brand-cyan text-brand-navy flex items-center justify-center">
          <i class="pi pi-check text-sm"></i>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest">Broadcast Successful</p>
          <p class="text-[9px] font-bold text-slate-400 uppercase mt-1">Notifications have been dispatched.</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

const broadcasts = ref<any[]>([])
const isLoading = ref(true)
const isSending = ref(false)
const successToast = ref(false)

const form = ref({
  title: '',
  body: '',
  target_roles: ['student']
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
  if (form.value.target_roles.length === 0) {
    alert('Select at least one recipient group.')
    return
  }

  isSending.value = true
  try {
    await $fetch('/api/broadcasts', {
      method: 'POST',
      body: form.value
    })
    
    // Reset form
    form.value = { title: '', body: '', target_roles: ['student'] }
    
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
