<template>
  <div class="relative min-h-screen">
    <div class="space-y-12 pb-24">
      <!-- Header with Search & Add -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-10">
        <div class="flex-1 max-w-xl">
          <h1 class="text-4xl font-black text-brand-navy tracking-tight uppercase mb-4">Student Directory</h1>
          <div class="relative group">
            <i class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-cyan transition-colors"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by name or matric number..."
              class="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-none outline-none focus:border-brand-cyan transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <select v-model="statusFilter" class="bg-white border border-slate-100 px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-cyan cursor-pointer shadow-sm">
            <option value="all">Status: All</option>
            <option value="Accepted">Status: Placed</option>
            <option value="Searching">Status: Searching</option>
            <option value="Pending">Status: Pending</option>
          </select>
          
          <button 
            v-if="isSuperCoordinator"
            class="bg-brand-cyan text-brand-navy px-8 py-4 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center gap-3 shadow-xl shadow-black/10"
            @click="openAddModal"
          >
            <i class="pi pi-user-plus"></i>
            Enroll Student
          </button>
        </div>
      </header>

      <!-- Data Table -->
      <article class="bg-white border border-slate-100 shadow-sm relative">
        <div v-if="isLoading" class="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-3xl text-brand-cyan"></i>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left min-w-[700px]">
            <thead>
              <tr class="text-[9px] font-black text-text-veryMuted uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
                <th class="px-4 sm:px-10 py-4 sm:py-6">Identity</th>
                <th class="px-4 sm:px-10 py-4 sm:py-6">Placement Status</th>
                <th class="px-4 sm:px-10 py-4 sm:py-6">Milestone Progress</th>
                <th class="px-4 sm:px-10 py-4 sm:py-6">Documents</th>
                <th class="px-4 sm:px-10 py-4 sm:py-6 text-right">Records</th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-slate-50">
              <tr v-if="filteredStudents.length === 0 && !isLoading" class="text-center">
                <td colspan="5" class="px-4 sm:px-10 py-12 sm:py-24 text-[10px] font-black text-text-veryMuted uppercase tracking-widest">No matching records found</td>
              </tr>
              <tr v-for="student in filteredStudents" :key="student.id" class="group hover:bg-slate-50 transition-all cursor-pointer" @click="selectStudent(student)">
                <td class="px-4 sm:px-10 py-4 sm:py-8">
                  <div class="flex items-center gap-3 sm:gap-4">
                    <div class="h-8 w-8 sm:h-10 sm:w-10 bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-300 group-hover:bg-brand-navy group-hover:text-white transition-all text-[10px] sm:text-xs">
                      {{ student.full_name.charAt(0) }}
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-black text-brand-navy uppercase tracking-tight group-hover:underline underline-offset-4 decoration-2 text-[11px] sm:text-xs truncate">{{ student.full_name }}</span>
                      <span class="text-[8px] font-bold text-text-veryMuted tabular-nums uppercase truncate">{{ student.student_id || 'NOT_ASSIGNED' }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-4 sm:px-10 py-4 sm:py-8">
                  <span :class="[
                    'px-3 py-1 text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap',
                    student.placementStatus === 'Accepted' ? 'bg-brand-navy text-white border-brand-navy' : 
                    student.placementStatus === 'Searching' ? 'bg-brand-gold text-black border-brand-gold' : 'bg-white text-text-veryMuted border-slate-100'
                  ]">
                    {{ student.placementStatus || 'Searching' }}
                  </span>
                </td>
                <td class="px-4 sm:px-10 py-4 sm:py-8">
                  <div class="flex items-center gap-2 sm:gap-4">
                    <div class="flex-1 h-1 bg-slate-100 max-w-[80px] sm:max-w-[100px] overflow-hidden">
                      <div class="h-full bg-brand-cyan transition-all duration-1000" :style="{ width: student.completionPercent + '%' }"></div>
                    </div>
                    <span class="text-[9px] font-black text-brand-navy tabular-nums">{{ student.completionPercent }}%</span>
                  </div>
                </td>
                <td class="px-4 sm:px-10 py-4 sm:py-8">
                  <div class="flex items-center gap-2 text-text-veryMuted">
                    <i class="pi pi-file text-[10px]"></i>
                    <span class="text-[9px] font-black tabular-nums">{{ student.documentCount }} Items</span>
                  </div>
                </td>
                <td class="px-4 sm:px-10 py-4 sm:py-8 text-right">
                  <div class="flex items-center justify-end gap-2 transition-all" @click.stop>
                    <button v-if="isSuperCoordinator" class="h-8 w-8 bg-brand-navy text-white hover:brightness-150 flex items-center justify-center" @click="editStudent(student)">
                      <i class="pi pi-pencil text-[10px]"></i>
                    </button>
                    <button v-if="isSuperCoordinator" class="h-8 w-8 border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white flex items-center justify-center" @click="deleteStudent(student.id)">
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                    <button class="h-8 w-8 bg-slate-100 text-slate-400 hover:bg-brand-cyan hover:text-brand-navy flex items-center justify-center" @click="selectStudent(student)">
                      <i class="pi pi-chevron-right text-[10px]"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>

    <!-- Sliding Sidebar Dossier -->
    <Transition name="slide">
      <div v-if="selectedStudent" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[100] border-l border-slate-100 overflow-y-auto">
        <div class="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-12 py-10 border-b border-slate-50 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <button class="h-10 w-10 border border-slate-100 flex items-center justify-center hover:bg-brand-navy hover:text-white transition-all" @click="selectedStudent = null">
              <i class="pi pi-arrow-left text-[10px]"></i>
            </button>
            <h2 class="text-xl font-black text-brand-navy uppercase tracking-widest">Student Dossier</h2>
          </div>
          <NuxtLink :to="`/student?id=${selectedStudent.id}`" class="text-[10px] font-black text-text-veryMuted uppercase tracking-widest hover:text-brand-navy hover:underline transition-all">
            Full Profile View
          </NuxtLink>
        </div>

        <div class="p-12 space-y-12">
          <div class="bg-brand-navy p-10 text-white flex flex-col gap-8">
            <div class="flex flex-col gap-2">
              <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Identity Record</span>
              <h3 class="text-3xl font-black uppercase tracking-tight">{{ selectedStudent.full_name }}</h3>
              <span class="text-xs font-bold text-slate-400 tabular-nums uppercase">{{ selectedStudent.student_id }}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-8 pt-8 border-t border-blue-900/50">
              <div>
                <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Access</p>
                <p class="text-xs font-bold truncate text-slate-300">{{ selectedStudent.email || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Market Status</p>
                <p class="text-xs font-black uppercase tracking-tighter">{{ selectedStudent.placementStatus }}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="border border-slate-100 p-6 flex flex-col gap-4">
              <span class="text-[9px] font-black text-text-veryMuted uppercase tracking-widest">Checklist State</span>
              <div class="flex items-end justify-between">
                <span class="text-3xl font-black text-brand-navy tabular-nums">{{ selectedStudent.completionPercent }}%</span>
                <div class="h-10 w-1 bg-brand-cyan"></div>
              </div>
            </div>
            <div class="border border-slate-100 p-6 flex flex-col gap-4">
              <span class="text-[9px] font-black text-text-veryMuted uppercase tracking-widest">Vault Items</span>
              <div class="flex items-end justify-between">
                <span class="text-3xl font-black text-brand-navy tabular-nums">{{ selectedStudent.documentCount }}</span>
                <div class="h-10 w-1 bg-slate-200"></div>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 p-8 text-center border border-slate-100">
            <p class="text-[10px] font-black text-text-veryMuted uppercase tracking-widest mb-6 leading-relaxed">
              For detailed logbook tracking and document validation, please proceed to the full profile view.
            </p>
            <NuxtLink :to="`/student?id=${selectedStudent.id}`" class="inline-block bg-brand-cyan text-brand-navy px-8 py-3 text-[9px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all">
              Launch Detailed View
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Overlay for Sidebar -->
    <div v-if="selectedStudent" class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90]" @click="selectedStudent = null"></div>

    <!-- Enrollment Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-brand-navy/90 p-4 sm:p-6">
      <div class="bg-white w-full max-w-lg p-6 sm:p-12 shadow-2xl relative border border-slate-100 mx-4 sm:mx-0">
        <button class="absolute top-8 right-8 text-slate-300 hover:text-brand-navy transition-colors" @click="closeModal">
          <i class="pi pi-times"></i>
        </button>
        <h2 class="text-2xl font-black text-brand-navy uppercase tracking-widest mb-10">{{ editingId ? 'Update Record' : 'Enroll Student' }}</h2>
        <form @submit.prevent="saveStudent" class="space-y-8">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Full Name</label>
            <input v-model="form.full_name" type="text" required class="w-full bg-slate-50 border border-slate-100 px-5 py-4 text-xs font-black uppercase focus:border-brand-cyan outline-none transition-all">
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Matric Number</label>
              <input v-model="form.student_id" type="text" class="w-full bg-slate-50 border border-slate-100 px-5 py-4 text-xs font-black uppercase focus:border-brand-cyan outline-none transition-all tabular-nums">
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Email Address</label>
              <input v-model="form.email" type="email" required class="w-full bg-slate-50 border border-slate-100 px-5 py-4 text-xs font-black uppercase focus:border-brand-cyan outline-none transition-all">
            </div>
          </div>
          <button type="submit" :disabled="isSaving" class="w-full bg-brand-cyan text-brand-navy h-16 font-black text-[10px] uppercase tracking-[0.4em] hover:brightness-110 transition-all disabled:opacity-30">
            {{ isSaving ? 'Syncing...' : 'Confirm Enrollment' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'

definePageMeta({
  requiredRole: 'coordinator'
})

const { isSuperCoordinator } = useCoordinatorPrivileges()

const students = ref<any[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

const showModal = ref(false)
const selectedStudent = ref<any>(null)
const editingId = ref<string | null>(null)
const form = ref({ full_name: '', student_id: '', email: '' })

const filteredStudents = computed(() => {
  let list = students.value
  if (statusFilter.value !== 'all') list = list.filter(s => s.placementStatus === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.full_name.toLowerCase().includes(q) || (s.student_id && s.student_id.toLowerCase().includes(q)))
  }
  return list
})

const fetchStudents = async () => {
  isLoading.value = true
  try {
    const { students: data } = await $fetch<{ students: any[] }>('/api/students')
    students.value = data || []
  } catch (error) {
    console.error('Fetch failed')
  } finally {
    isLoading.value = false
  }
}

const selectStudent = (student: any) => {
  selectedStudent.value = student
}

const saveStudent = async () => {
  isSaving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/students/${editingId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/students', { method: 'POST', body: form.value })
    }
    await fetchStudents()
    closeModal()
  } catch (error: any) {
    alert('Save failed')
  } finally {
    isSaving.value = false
  }
}

const editStudent = (student: any) => {
  editingId.value = student.id
  form.value = { full_name: student.full_name, student_id: student.student_id || '', email: student.email || '' }
  showModal.value = true
}

const deleteStudent = async (id: string) => {
  if (confirm('Permanently remove record?')) {
    try {
      await $fetch(`/api/students/${id}`, { method: 'DELETE' })
      await fetchStudents()
    } catch (error) {
      alert('Delete failed')
    }
  }
}

const openAddModal = () => {
  editingId.value = null
  form.value = { full_name: '', student_id: '', email: '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
}

onMounted(fetchStudents)
</script>

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>