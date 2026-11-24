<template>
  <div class="app-surface-ui">
    <div class="space-y-5 md:space-y-6">
      <PortalPageHeader title="Coordinator Management" icon="pi-user-plus" description="Manage intra coordinator accounts.">
        <template v-if="isSuperCoordinator" #actions>
          <button type="button" class="portal-primary-action" @click="openAddModal">
            <i aria-hidden="true" class="pi pi-plus"></i>
            Add Coordinator
          </button>
        </template>
      </PortalPageHeader>

      <div class="group relative w-full sm:max-w-sm">
        <i aria-hidden="true" class="pi pi-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted group-focus-within:text-sky-700"></i>
        <input v-model="searchQuery" type="search" aria-label="Search coordinators" placeholder="Search by name or email..." class="portal-field h-11 pl-10">
      </div>

      <div class="block md:hidden space-y-3">
        <div v-if="isLoading" class="py-12 text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
        </div>
        <div v-else-if="filteredCoordinators.length === 0" class="rounded-card border border-surface-border bg-surface py-12 text-center text-sm font-medium text-text-muted">No coordinators found</div>
        <div v-for="coordinator in filteredCoordinators" :key="coordinator.id" class="rounded-card bg-surface border border-surface-border p-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-sky-100 text-sm font-semibold text-sky-800">
                {{ coordinator.full_name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <div class="font-black text-slate-800 uppercase tracking-tight text-sm truncate">{{ coordinator.full_name }}</div>
                <div class="text-sm font-medium text-text-muted truncate mt-0.5">{{ coordinator.email }}</div>
              </div>
            </div>
            <button class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center ml-2" @click="deleteCoordinator(coordinator.id, coordinator.full_name)">
              <i class="pi pi-trash text-[8px]"></i>
            </button>
          </div>
        </div>
      </div>

      <article class="rounded-card overflow-hidden hidden md:block bg-surface border border-surface-border shadow-sm relative">
        <div v-if="isLoading" class="rounded-card absolute inset-0 bg-surface/70 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-3xl text-sky-600"></i>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="[&_th]:px-4 lg:[&_th]:px-6">
              <tr class="app-table-header">
                <th>Coordinator</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-surface-border">
              <tr v-if="filteredCoordinators.length === 0 && !isLoading" class="text-center">
                <td colspan="5" class="px-10 py-24 text-sm font-medium text-text-muted">No coordinators found</td>
              </tr>
              <tr v-for="coordinator in filteredCoordinators" :key="coordinator.id" class="group transition-colors hover:bg-surface-hover [&>td]:px-4 [&>td]:py-3 lg:[&>td]:px-6">
                <td>
                  <div class="flex items-center gap-4">
                    <div class="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-sky-100 text-sm font-semibold text-sky-800">
                      {{ coordinator.full_name.charAt(0) }}
                    </div>
                    <span class="font-semibold text-slate-800 text-sm">{{ coordinator.full_name }}</span>
                  </div>
                </td>
                <td>
                  <span class="text-text-muted font-medium text-sm">{{ coordinator.email }}</span>
                </td>
                <td>
                  <span
                    v-if="isSuperCoordinatorByEmail(coordinator.email)"
                    class="bg-amber-100 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-badge"
                  >Super</span>
                  <span
                    v-else
                    class="bg-surface-muted text-text-muted text-xs font-semibold px-2 py-0.5 rounded-badge"
                  >Standard</span>
                </td>
                <td>
                  <span class="text-text-muted font-medium text-sm tabular-nums">{{ formatDate(coordinator.created_at) }}</span>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button class="rounded-control h-8 w-8 bg-slate-900 text-white hover:brightness-150 transition-all flex items-center justify-center">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button
                      v-if="coordinator.id === currentUserId"
                      class="rounded-control h-8 w-8 border border-surface-border text-text-muted opacity-50 cursor-not-allowed flex items-center justify-center"
                      disabled
                      title="Cannot delete active session"
                    >
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                    <button
                      v-else
                      class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center"
                      @click="deleteCoordinator(coordinator.id, coordinator.full_name)"
                    >
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 p-4 sm:p-6">
      <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-lg p-6 sm:p-10 shadow-2xl relative border border-surface-border mx-4 sm:mx-0">
        <button class="rounded-control absolute top-8 right-8 text-text-muted hover:text-slate-800 transition-colors" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-widest mb-10">Add Coordinator</h2>
        <form @submit.prevent="saveCoordinator" class="space-y-8">
          <div class="space-y-2">
            <label class="text-xs font-semibold text-text-muted">Full Name</label>
            <input v-model="form.full_name" type="text" required class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-sm font-medium focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-text-muted">Email Address</label>
            <input v-model="form.email" type="email" required class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-sm font-medium focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all">
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-text-muted">Temporary Password</label>
            <input v-model="form.password" type="password" required minlength="6" class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-sm font-medium focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all">
          </div>
          <button type="submit" :disabled="isSaving" class="rounded-control w-full bg-sky-700 text-white h-16 font-semibold text-sm hover:bg-sky-800 transition-all disabled:opacity-30">
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
const user = useSupabaseUser()

const currentUserId = computed(() => user.value?.id || '')

const coordinators = ref<Array<{ id: string; full_name: string; email: string; role: string; created_at: string | null; isSuperCoordinator: boolean }>>([])
const isLoading = ref(true)
const isSaving = ref(false)
const showModal = ref(false)
const form = ref({ full_name: '', email: '', password: '' })

const fetchCoordinators = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<{ coordinators: any[] }>('/api/coordinators')
    coordinators.value = data.coordinators || []
  } catch (error) {
    console.error('Failed to fetch coordinators:', error)
    coordinators.value = []
  } finally {
    isLoading.value = false
  }
}

const searchQuery = ref('')

const filteredCoordinators = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return coordinators.value
  return coordinators.value.filter(
    (c) =>
      c.full_name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
  )
})

const isSuperCoordinatorByEmail = (email: string) => {
  return coordinators.value.some(coordinator => coordinator.email === email && coordinator.isSuperCoordinator)
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
