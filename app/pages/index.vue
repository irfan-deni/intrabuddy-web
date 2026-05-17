<template>
  <div class="space-y-6 md:space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card v-for="stat in stats" :key="stat.label" class="bg-white shadow-sm border border-stone-200">
        <template #content>
          <div class="p-4 md:p-6">
            <div class="flex items-center gap-3 mb-2 md:mb-4">
              <div class="h-8 w-8 md:h-10 md:w-10 bg-slate-800 text-white flex items-center justify-center rounded-lg">
                <i :class="[stat.icon, 'text-xs md:text-sm']"></i>
              </div>
              <span class="text-xs font-semibold text-stone-500 uppercase tracking-wider">{{ stat.label }}</span>
            </div>
            <p class="text-2xl md:text-4xl font-bold text-slate-800 tabular-nums tracking-tight">
              {{ isLoading ? '...' : stat.value }}
            </p>
          </div>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card class="lg:col-span-2 bg-white shadow-sm border border-stone-200">
        <template #content>
          <div class="p-4 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div class="relative w-36 h-36 md:w-48 md:h-48 flex-shrink-0">
              <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-stone-200" stroke-width="3"></circle>
                <circle cx="18" cy="18" r="16" fill="none" class="stroke-sky-600" stroke-width="3" stroke-dasharray="100" :stroke-dashoffset="100 - (placementPercentage || 0)" stroke-linecap="round"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold text-slate-800 tabular-nums">{{ placementPercentage }}%</span>
                <span class="text-xs font-semibold text-stone-500 uppercase tracking-wider">Placed</span>
              </div>
            </div>
            <div class="flex-1 space-y-6">
              <div>
                <h2 class="text-lg font-bold text-slate-800">Placement Velocity</h2>
                <p class="text-sm text-stone-600 mt-2 leading-relaxed">
                  Current cohort operating at <strong class="text-slate-800">{{ placementPercentage }}%</strong> capacity.
                  <strong class="text-slate-800">{{ unplacedStudents }}</strong> students still in the active search funnel.
                </p>
              </div>
              <div class="grid grid-cols-2 gap-6">
                <div class="border-l-2 border-slate-800 pl-4">
                  <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Target Rate</p>
                  <p class="text-xl font-bold text-slate-800 tabular-nums">100%</p>
                </div>
                <div class="border-l-2 border-stone-200 pl-4">
                  <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Remaining</p>
                  <p class="text-xl font-bold text-slate-800 tabular-nums">{{ unplacedStudents }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="bg-slate-800 text-white shadow-sm border border-slate-800">
        <template #content>
          <div class="p-6 flex flex-col justify-between h-full min-h-[180px] md:min-h-[200px]">
            <div>
              <p class="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Cohort Control</p>
              <h3 class="text-2xl font-bold leading-tight">
                Active:<br>{{ cohortName || 'Scanning...' }}
              </h3>
            </div>
            <NuxtLink to="/broadcasts" class="inline-flex items-center gap-2 mt-6 text-sky-400 hover:text-sky-300 transition-colors text-sm font-semibold">
              <span>Dispatch Alert</span>
              <i class="pi pi-arrow-right text-xs"></i>
            </NuxtLink>
          </div>
        </template>
      </Card>
    </div>

    <Card class="bg-white shadow-sm border border-stone-200">
      <template #content>
        <div class="p-4 md:p-8">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Logbook Intelligence</h2>
            <div class="flex items-center gap-4 w-full sm:w-auto">
              <select v-model="statusFilter" class="text-xs font-semibold border border-stone-200 rounded-lg px-3 md:px-4 py-2 bg-white text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all w-full sm:w-auto">
                <option value="all">All Submissions</option>
                <option value="Submitted">Approved</option>
                <option value="Late">Pending/Late</option>
              </select>
            </div>
          </div>

          <div v-if="logbooks.length === 0" class="text-center py-12 md:py-16 text-sm font-semibold text-stone-400">No activity data available</div>

          <template v-for="entry in logbooks" :key="entry.id">
            <div class="block md:hidden bg-stone-50 rounded-lg p-4 mb-3 border border-stone-200">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <div class="font-semibold text-slate-800 text-sm">{{ entry.studentName }}</div>
                  <div class="text-xs text-stone-500 mt-0.5 tabular-nums">{{ entry.studentMatric || 'MATRIC_PENDING' }}</div>
                </div>
                <span v-if="entry.statusLabel === 'Submitted'" class="inline-flex px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded whitespace-nowrap">Approved</span>
                <span v-else class="inline-flex px-2.5 py-1 bg-amber-400 text-slate-900 text-xs font-semibold rounded whitespace-nowrap">{{ entry.statusLabel }}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-stone-500">
                <span class="font-semibold text-slate-800">Week {{ entry.weekNumber }}</span>
                <span class="tabular-nums">{{ entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : 'WAITING' }}</span>
              </div>
            </div>
          </template>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-xs font-semibold text-stone-500 uppercase tracking-wider bg-stone-50">
                  <th class="px-6 py-4">Student Identity</th>
                  <th class="px-6 py-4">Period</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody class="text-sm divide-y divide-stone-100">
                <tr v-for="entry in logbooks" :key="entry.id" class="hover:bg-stone-50 transition-colors">
                  <td class="px-6 py-5">
                    <div class="font-semibold text-slate-800">{{ entry.studentName }}</div>
                    <div class="text-xs text-stone-500 mt-0.5 tabular-nums">{{ entry.studentMatric || 'MATRIC_PENDING' }}</div>
                  </td>
                  <td class="px-6 py-5 text-slate-800 font-semibold">Week {{ entry.weekNumber }}</td>
                  <td class="px-6 py-5">
                    <span v-if="entry.statusLabel === 'Submitted'" class="inline-flex px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded">Approved</span>
                    <span v-else class="inline-flex px-3 py-1 bg-amber-400 text-slate-900 text-xs font-semibold rounded">{{ entry.statusLabel }}</span>
                  </td>
                  <td class="px-6 py-5 text-right text-stone-500 tabular-nums hover:text-slate-800 transition-colors">
                    {{ entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : 'WAITING' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card'

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
  { label: 'Total Students', value: totalStudents.value, icon: 'pi pi-users' },
  { label: 'Placed', value: placedStudents.value, icon: 'pi pi-check-circle' },
  { label: 'Unplaced', value: unplacedStudents.value, icon: 'pi pi-search' },
  { label: 'Milestones Completed', value: placementPercentage.value + '%', icon: 'pi pi-chart-line' }
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
