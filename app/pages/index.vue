<template>
  <div class="space-y-12">
    <!-- Row 1: Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-white p-8 border border-slate-100 hover:border-brand-cyan transition-all group relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <i :class="[stat.icon, 'text-4xl text-brand-cyan']"></i>
        </div>
        <div class="flex items-center gap-3 mb-6">
          <div class="h-8 w-8 bg-brand-navy text-white flex items-center justify-center">
            <i :class="[stat.icon, 'text-xs']"></i>
          </div>
          <span class="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">{{ stat.label }}</span>
        </div>
        <p class="text-4xl font-black text-brand-navy tabular-nums tracking-tighter">
          {{ isLoading ? '...' : stat.value }}
        </p>
      </div>
    </div>

    <!-- Row 2: Visuals & Secondary Stats -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Doughnut Chart Section -->
      <div class="lg:col-span-2 bg-white border border-slate-100 p-10 flex flex-col md:flex-row items-center gap-12">
        <div class="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" class="stroke-slate-100" stroke-width="3"></circle>
            <circle 
              cx="18" cy="18" r="16" 
              fill="none" 
              class="stroke-brand-cyan" 
              stroke-width="3" 
              stroke-dasharray="100" 
              :stroke-dashoffset="100 - (placementPercentage || 0)"
              stroke-linecap="round"
            ></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-black text-brand-navy tabular-nums">{{ placementPercentage }}%</span>
            <span class="text-[8px] font-black uppercase tracking-widest text-text-muted">Placed</span>
          </div>
        </div>
        
        <div class="flex-1 space-y-8">
          <div>
            <h2 class="text-lg font-black text-brand-navy uppercase tracking-tight mb-2">Placement Velocity</h2>
            <p class="text-xs text-text-muted font-medium uppercase tracking-wide leading-relaxed">
              Current cohort is operating at <span class="text-brand-navy font-black">{{ placementPercentage }}%</span> capacity. 
              <span class="text-brand-navy font-black">{{ unplacedStudents }}</span> students are still in the active search funnel.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="border-l-2 border-brand-navy pl-4">
              <p class="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Target Rate</p>
              <p class="text-xl font-black text-brand-navy tabular-nums">100%</p>
            </div>
            <div class="border-l-2 border-slate-200 pl-4">
              <p class="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Remaining</p>
              <p class="text-xl font-black text-brand-navy tabular-nums">{{ unplacedStudents }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-brand-navy text-white p-10 flex flex-col justify-between">
        <div>
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Cohort Control</p>
          <h3 class="text-2xl font-black uppercase tracking-tight leading-tight mb-4">
            Active: <br> {{ cohortName || 'Scanning...' }}
          </h3>
        </div>
        <NuxtLink to="/broadcasts" class="inline-flex items-center gap-3 group text-brand-cyan">
          <span class="text-[10px] font-black uppercase tracking-widest group-hover:underline underline-offset-8">Dispatch Alert</span>
          <i class="pi pi-arrow-right text-[10px]"></i>
        </NuxtLink>
      </div>
    </div>

    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-[11px] font-black text-brand-navy uppercase tracking-[0.2em]">Logbook Intelligence</h2>
        <div class="flex items-center gap-4">
          <select v-model="statusFilter" class="text-[10px] font-black border border-slate-200 rounded-none px-4 py-2 bg-white uppercase tracking-widest outline-none focus:border-brand-cyan transition-all">
            <option value="all">All Submissions</option>
            <option value="Submitted">Approved</option>
            <option value="Late">Pending/Late</option>
          </select>
        </div>
      </div>

      <div class="bg-white border border-slate-100 overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[9px] font-black text-text-veryMuted uppercase tracking-[0.2em] bg-slate-50/50">
              <th class="px-8 py-6">Student Identity</th>
              <th class="px-8 py-6">Period</th>
              <th class="px-8 py-6">Status</th>
              <th class="px-8 py-6 text-right">Activity</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-slate-50">
            <tr v-if="logbooks.length === 0" class="text-center">
              <td colspan="4" class="px-8 py-20 text-[10px] font-black text-text-veryMuted uppercase tracking-widest">No activity data available</td>
            </tr>
            <tr v-for="entry in logbooks" :key="entry.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-8 py-6">
                <div class="flex flex-col">
                  <span class="font-black text-brand-navy uppercase tracking-tight">{{ entry.studentName }}</span>
                  <span class="text-[8px] font-bold text-text-veryMuted tabular-nums">{{ entry.studentMatric || 'MATRIC_PENDING' }}</span>
                </div>
              </td>
              <td class="px-8 py-6">
                <span class="font-black text-brand-navy tracking-tighter">WEEK {{ entry.weekNumber }}</span>
              </td>
              <td class="px-8 py-6">
                <span v-if="entry.statusLabel === 'Submitted'" class="px-2 py-0.5 bg-brand-navy text-white text-[9px] font-black uppercase tracking-tighter">Approved</span>
                <span v-else class="px-2 py-0.5 bg-brand-gold text-black text-[9px] font-black uppercase tracking-tighter">{{ entry.statusLabel }}</span>
              </td>
              <td class="px-8 py-6 text-right text-text-veryMuted font-bold tabular-nums group-hover:text-brand-navy transition-colors">
                {{ entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : 'WAITING' }}
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

const logbooks = ref<any[]>([])
const statusFilter = ref('all')

const stats = computed(() => [
  { label: 'Active Cohort', value: totalStudents.value, icon: 'pi pi-users' },
  { label: 'Placement Secured', value: placedStudents.value, icon: 'pi pi-check-circle' },
  { label: 'Market Search', value: unplacedStudents.value, icon: 'pi pi-search' },
  { label: 'Success Velocity', value: placementPercentage.value + '%', icon: 'pi pi-chart-line' }
])

const fetchData = async () => {
  isLoading.value = true
  try {
    const [dash, logs] = await Promise.all([
      $fetch<DashboardResponse>('/api/dashboard'),
      $fetch<any[]>(`/api/logbooks${statusFilter.value !== 'all' ? '?status=' + statusFilter.value : ''}`)
    ])
    
    cohortName.value = dash.cohortName
    totalStudents.value = dash.totalStudents
    placedStudents.value = dash.placedStudents
    unplacedStudents.value = dash.unplacedStudents
    placementPercentage.value = dash.placementPercentage
    logbooks.value = logs || []
  } catch (error) {
    console.error('Sync failed')
  } finally {
    isLoading.value = false
  }
}

watch(statusFilter, fetchData)
onMounted(fetchData)
</script>