<template>
  <div class="min-h-screen">
    <div class="space-y-12 pb-24">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-stone-200 pb-6 md:pb-10">
        <div>
          <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Coordinator Management</h1>
          <p class="text-stone-500 text-xs font-semibold mt-2 uppercase tracking-wider">Manage intra coordinator accounts</p>
        </div>

        <div v-if="isSuperCoordinator" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            class="bg-sky-600 text-white px-6 md:px-8 py-4 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10"
            @click="openAddModal"
          >
            <i class="pi pi-user-plus"></i>
            Add Coordinator
          </button>
        </div>
      </header>

      <div class="block md:hidden space-y-3">
        <div v-if="isLoading" class="py-12 text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
        </div>
        <div v-else-if="coordinators.length === 0" class="py-12 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">No coordinators found</div>
        <div v-for="coordinator in coordinators" :key="coordinator.id" class="bg-white border border-stone-200 p-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="h-10 w-10 bg-stone-50 border border-stone-200 flex items-center justify-center font-black text-stone-400 text-xs flex-shrink-0">
                {{ coordinator.full_name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm truncate">{{ coordinator.full_name }}</div>
                <div class="text-[9px] font-bold text-stone-400 truncate mt-0.5">{{ coordinator.email }}</div>
              </div>
            </div>
            <button class="h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center ml-2" @click="deleteCoordinator(coordinator.id, coordinator.full_name)">
              <i class="pi pi-trash text-[8px]"></i>
            </button>
          </div>
        </div>
      </div>

      <article class="hidden md:block bg-white border border-stone-200 shadow-sm relative">
        <div v-if="isLoading" class="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-3xl text-sky-600"></i>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50 border-b border-stone-200">
                <th class="px-10 py-6">Coordinator</th>
                <th class="px-10 py-6">Email</th>
                <th class="px-10 py-6">Created</th>
                <th class="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-stone-100">
              <tr v-if="coordinators.length === 0 && !isLoading" class="text-center">
                <td colspan="4" class="px-10 py-24 text-[10px] font-black text-stone-400 uppercase tracking-widest">No coordinators found</td>
              </tr>
              <tr v-for="coordinator in coordinators" :key="coordinator.id" class="group hover:bg-stone-50 transition-all">
                <td class="px-10 py-8">
                  <div class="flex items-center gap-4">
                    <div class="h-10 w-10 bg-stone-50 border border-stone-200 flex items-center justify-center font-black text-stone-400 group-hover:bg-slate-900 group-hover:text-white transition-all text-xs">
                      {{ coordinator.full_name.charAt(0) }}
                    </div>
                    <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ coordinator.full_name }}</span>
                  </div>
                </td>
                <td class="px-10 py-8">
                  <span class="text-stone-500 font-medium text-xs">{{ coordinator.email }}</span>
                </td>
                <td class="px-10 py-8">
                  <span class="text-stone-400 font-bold text-[10px] tabular-nums">{{ formatDate(coordinator.created_at) }}</span>
                </td>
                <td class="px-10 py-8 text-right">
                  <button class="h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center ml-auto" @click="deleteCoordinator(coordinator.id, coordinator.full_name)">
                    <i class="pi pi-trash text-[10px]"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 p-4 sm:p-6">
      <div class="bg-white w-full max-w-lg p-6 sm:p-12 shadow-2xl relative border border-stone-200 mx-4 sm:mx-0">
        <button class="absolute top-8 right-8 text-stone-400 hover:text-slate-800 transition-colors" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-widest mb-10">Add Coordinator</h2>
        <form @submit.prevent="saveCoordinator" class="space-y-8">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Full Name</label>
            <input v-model="form.full_name" type="text" required class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Email Address</label>
            <input v-model="form.email" type="email" required class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Temporary Password</label>
            <input v-model="form.password" type="password" required minlength="6" class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all">
          </div>
          <button type="submit" :disabled="isSaving" class="w-full bg-sky-600 text-white h-16 font-black text-[10px] uppercase tracking-[0.4em] hover:brightness-110 transition-all disabled:opacity-30">
            {{ isSaving ? 'Creating...' : 'Create Coordinator' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

definePageMeta({
  requiredRole: 'coordinator',
  superCoordinatorOnly: true
})

const { isSuperCoordinator } = useCoordinatorPrivileges()

const coordinators = ref<any[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const showModal = ref(false)
const form = ref({ full_name: '', email: '', password: '' })

const fetchCoordinators = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<{ coordinators: any[] }>('/api/coordinators')
    coordinators.value = data.coordinators || []
  } catch {
    coordinators.value = []
  } finally {
    isLoading.value = false
  }
}

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const saveCoordinator = async () => {
  isSaving.value = true
  try {
    await $fetch('/api/coordinators', {
      method: 'POST',
      body: form.value
    })
    await fetchCoordinators()
    closeModal()
  } catch (error: any) {
    alert(error?.data?.statusMessage || 'Failed to create coordinator')
  } finally {
    isSaving.value = false
  }
}

const deleteCoordinator = async (id: string, name: string) => {
  if (confirm(`Permanently remove coordinator "${name}"? This will also delete their auth account.`)) {
    try {
      await $fetch(`/api/coordinators/${id}`, { method: 'DELETE' })
      await fetchCoordinators()
    } catch {
      alert('Failed to delete coordinator')
    }
  }
}

const openAddModal = () => {
  form.value = { full_name: '', email: '', password: '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

onMounted(fetchCoordinators)
</script>
