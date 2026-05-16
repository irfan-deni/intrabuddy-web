<template>
  <div class="space-y-12">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
      <div>
        <h1 class="text-4xl font-black text-black tracking-tight uppercase">Overview</h1>
        <p class="text-slate-400 mt-2 flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
          <span class="w-1.5 h-1.5 rounded-full bg-black"></span>
          Cohort: <span class="text-black">{{ cohortName || 'Scanning...' }}</span>
        </p>
      </div>
      <div class="hidden lg:block text-right">
        <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Status</p>
        <p class="text-xs font-bold text-black uppercase tracking-wide">{{ isLoading ? 'Syncing...' : 'Operational' }}</p>
      </div>
    </header>

    <!-- Error State -->
    <div v-if="errorMessage" class="p-8 border-2 border-black bg-white flex flex-col items-center gap-4 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-black"></i>
      <div>
        <p class="text-[11px] font-black uppercase tracking-widest text-black">Data Link Failed</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ errorMessage }}</p>
      </div>
      <button @click="fetchDashboardData" class="mt-2 px-6 py-2 border border-black text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
        Retry Sync
      </button>
    </div>

    <!-- Stats Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div v-for="stat in stats" :key="stat.label" :class="[
        'p-8 border transition-colors duration-300',
        stat.dark ? 'bg-black text-white' : 'bg-white border-slate-100 hover:border-black'
      ]">
        <div class="flex items-center justify-between mb-6">
          <div :class="['h-10 w-10 flex items-center justify-center', stat.dark ? 'bg-white text-black' : 'bg-black text-white']">
            <i :class="[stat.icon, 'text-lg']"></i>
          </div>
        </div>
        <h3 :class="['text-[10px] font-black uppercase tracking-widest mb-1', stat.dark ? 'text-slate-500' : 'text-slate-400']">{{ stat.label }}</h3>
        <p :class="['text-4xl font-black tabular-nums', stat.dark ? 'text-white' : 'text-black']">{{ isLoading ? '...' : stat.value }}</p>
      </div>
    </div>

    <!-- Activity Log -->
    <section v-if="!errorMessage" class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-black text-black uppercase tracking-[0.2em]">Activity Log</h2>
        <div class="flex items-center gap-4">
          <select v-model="statusFilter" class="text-[10px] font-black border border-slate-200 rounded-none px-3 py-1.5 bg-white uppercase tracking-widest outline-none cursor-pointer">
            <option value="all">All Records</option>
            <option value="Submitted">Submitted</option>
            <option value="Not Submitted">Not Submitted</option>
            <option value="Late">Late</option>
          </select>
          <button @click="loadLogbooks" :disabled="isLogbooksLoading" class="text-slate-300 hover:text-black transition-colors">
            <i class="pi pi-refresh" :class="{ 'pi-spin': isLogbooksLoading }"></i>
          </button>
        </div>
      </div>

      <div class="overflow-hidden border-t border-slate-100">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              <th class="py-6">Student</th>
              <th class="py-6">Period</th>
              <th class="py-6">Status</th>
              <th class="py-6 text-right">Timestamp</th>
            </tr>
          </thead>
          
          <tbody class="text-xs divide-y divide-slate-50">
            <tr v-if="isLogbooksLoading && logbooks.length === 0">
              <td colspan="4" class="py-12 text-center text-slate-300 font-black uppercase tracking-widest">Updating...</td>
            </tr>
            <tr v-else-if="logbooks.length === 0">
              <td colspan="4" class="py-12 text-center text-slate-300 font-black uppercase tracking-widest">No activity detected</td>
            </tr>
            <tr v-for="entry in logbooks" :key="entry.id" class="group hover:bg-slate-50 transition-colors">
              <td class="py-5">
                <div class="flex flex-col">
                  <span class="font-black text-black uppercase tracking-tight">{{ entry.studentName }}</span>
                  <span class="text-[9px] font-bold text-slate-400 tabular-nums uppercase">{{ entry.studentMatric || '---' }}</span>
                </div>
              </td>
              <td class="py-5">
                <span class="font-bold text-slate-500 uppercase">W{{ entry.weekNumber }}</span>
              </td>
              <td class="py-5">
                <span :class="[
                  'px-2 py-1 border font-black uppercase text-[9px] tracking-tighter',
                  entry.statusLabel === 'Submitted' ? 'bg-black text-white border-black' : 
                  entry.statusLabel === 'Late' ? 'bg-white text-black border-black' : 'bg-white text-slate-300 border-slate-100'
                ]">
                  {{ entry.statusLabel }}
                </span>
              </td>
              <td class="py-5 text-right text-slate-400 font-bold tabular-nums">
                {{ entry.submittedAt ? formatDate(entry.submittedAt) : '---' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

type DashboardResponse = {
  cohortName: string
  totalStudents: number
  placedStudents: number
  unplacedStudents: number
  placementPercentage: number
}

const cohortName = ref('')
const totalStudents = ref(0)
const placedStudents = ref(0)
const unplacedStudents = ref(0)
const placementPercentage = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')

const logbooks = ref<any[]>([])
const isLogbooksLoading = ref(false)
const statusFilter = ref('all')

const stats = computed(() => [
  { label: 'Total Students', value: totalStudents.value, icon: 'pi pi-users', dark: false },
  { label: 'Placed', value: placedStudents.value, icon: 'pi pi-briefcase', dark: false },
  { label: 'Unplaced', value: unplacedStudents.value, icon: 'pi pi-search', dark: false },
  { label: 'Success Rate', value: placementPercentage.value + '%', icon: 'pi pi-chart-pie', dark: true }
])

const fetchDashboardData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await $fetch<DashboardResponse>('/api/dashboard')
    cohortName.value = data.cohortName
    totalStudents.value = data.totalStudents
    placedStudents.value = data.placedStudents
    unplacedStudents.value = data.unplacedStudents
    placementPercentage.value = data.placementPercentage
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || error.message || 'Connection failed'
  } finally {
    isLoading.value = false
  }
}

const loadLogbooks = async () => {
  isLogbooksLoading.value = true
  try {
    const params = statusFilter.value !== 'all' ? `?status=${statusFilter.value}` : ''
    const data = await $fetch<any[]>(`/api/logbooks${params}`)
    logbooks.value = data || []
  } catch (error: any) {
    // Silent fail for logbooks to not block main stats
  } finally {
    isLogbooksLoading.value = false
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

watch(statusFilter, loadLogbooks)

onMounted(async () => {
  await Promise.all([fetchDashboardData(), loadLogbooks()])
})
</script>