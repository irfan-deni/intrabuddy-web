<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Cohort Progress Overview</h1>
      <p class="text-slate-500 mt-1">
        Active Cohort: <span class="font-semibold text-blue-600">{{ cohortName || 'Loading...' }}</span>
      </p>
    </header>

    <div v-if="errorMessage" class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <div class="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-users text-blue-500 text-xl"></i>
          <h3 class="text-slate-500 font-medium">Total Students</h3>
        </div>
        <p class="text-4xl font-bold text-slate-800">{{ isLoading ? '-' : totalStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
         <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-briefcase text-green-500 text-xl"></i>
          <h3 class="text-slate-500 font-medium">Placed</h3>
        </div>
        <p class="text-4xl font-bold text-slate-800">{{ isLoading ? '-' : placedStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
         <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-search text-orange-500 text-xl"></i>
          <h3 class="text-slate-500 font-medium">Unplaced</h3>
        </div>
        <p class="text-4xl font-bold text-slate-800">{{ isLoading ? '-' : unplacedStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-xl border border-slate-100 bg-blue-50 p-6 shadow-sm">
         <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-chart-pie text-blue-600 text-xl"></i>
          <h3 class="text-blue-800 font-medium">Placement Rate</h3>
        </div>
        <p class="text-4xl font-bold text-blue-700">{{ isLoading ? '-' : placementPercentage + '%' }}</p>
      </div>
    </div>
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
const isLoading = ref(false)
const errorMessage = ref('')

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
    const serverMessage = error.data?.statusMessage || error.data?.message
    errorMessage.value = serverMessage ? `Server Error: ${serverMessage}` : (error.message || 'Unable to load dashboard data.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchDashboardData()
})
</script>