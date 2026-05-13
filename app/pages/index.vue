<template>
  <div class="p-8 lg:p-10">
    <header class="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-brand-blue">Dashboard</p>
        <h1 class="mt-2 text-4xl font-black tracking-tight text-brand-navy">Cohort Progress Overview</h1>
        <p class="mt-2 text-slate-500">
          Active Cohort: <span class="font-semibold text-brand-teal">{{ cohortName || 'Loading...' }}</span>
        </p>
      </div>
      <div class="rounded-2xl border border-brand-blue/10 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        Placement data is refreshed from Supabase active cohort records.
      </div>
    </header>

    <div v-if="errorMessage" class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <div class="flex flex-col justify-between rounded-3xl border border-brand-blue/10 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-users text-brand-blue text-xl"></i>
          <h3 class="font-medium text-slate-500">Total Students</h3>
        </div>
        <p class="text-4xl font-black text-brand-navy">{{ isLoading ? '-' : totalStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div class="mb-2 flex items-center gap-3">
          <i class="pi pi-briefcase text-emerald-500 text-xl"></i>
          <h3 class="font-medium text-slate-500">Placed</h3>
        </div>
        <p class="text-4xl font-black text-brand-navy">{{ isLoading ? '-' : placedStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div class="mb-2 flex items-center gap-3">
          <i class="pi pi-search text-amber-500 text-xl"></i>
          <h3 class="font-medium text-slate-500">Unplaced</h3>
        </div>
        <p class="text-4xl font-black text-brand-navy">{{ isLoading ? '-' : unplacedStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-3xl border border-brand-blue/15 bg-gradient-to-br from-brand-blue to-brand-teal p-6 text-white shadow-[0_18px_60px_rgba(30,79,216,0.24)]">
        <div class="mb-2 flex items-center gap-3">
          <i class="pi pi-chart-pie text-white text-xl"></i>
          <h3 class="font-medium text-white/90">Placement Rate</h3>
        </div>
        <p class="text-4xl font-black text-white">{{ isLoading ? '-' : placementPercentage + '%' }}</p>
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