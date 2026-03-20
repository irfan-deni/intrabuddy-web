<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Cohort Progress Overview</h1>
      <p class="text-slate-500 mt-1">Live monitoring of INTRA placement readiness.</p>
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
          <h3 class="text-slate-500 font-medium">Searching</h3>
        </div>
        <p class="text-4xl font-bold text-slate-800">{{ isLoading ? '-' : searchingStudents }}</p>
      </div>

      <div class="flex flex-col justify-between rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
         <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
          <h3 class="text-red-700 font-medium">Action Required</h3>
        </div>
        <p class="text-4xl font-bold text-red-700">{{ isLoading ? '-' : actionRequired }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-900">Placement Trends (Last 6 Months)</h2>
        <button
          class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100"
          :disabled="isLoading"
          @click="fetchDashboardData"
        >
          Refresh
        </button>
      </div>

      <div v-if="isLoading" class="flex h-64 items-center justify-center text-slate-400">
        <i class="pi pi-spin pi-spinner mr-2" />
        Loading chart data...
      </div>

      <div v-else class="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <div class="flex h-64 items-end gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div
              v-for="point in monthlyPlacedTrend"
              :key="point.label"
              class="flex flex-1 flex-col items-center justify-end"
            >
              <div
                class="w-full rounded-t-md bg-blue-500 transition-all"
                :style="{ height: `${point.height}px` }"
              />
              <p class="mt-2 text-xs font-semibold text-slate-500">{{ point.label }}</p>
              <p class="text-xs text-slate-400">{{ point.value }}</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Current Status Mix</h3>
            <div
              v-for="segment in statusMix"
              :key="segment.label"
              class="rounded-lg border border-slate-100 bg-white p-3"
            >
              <div class="mb-2 flex items-center justify-between text-sm">
                <span class="font-medium text-slate-700">{{ segment.label }}</span>
                <span class="font-semibold text-slate-900">{{ segment.value }}</span>
              </div>
              <div class="h-2 rounded bg-slate-200">
                <div
                  class="h-2 rounded"
                  :class="segment.color"
                  :style="{ width: `${segment.percent}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

const supabase = useSupabaseClient<Database>()

const totalStudents = ref(0)
const placedStudents = ref(0)
const searchingStudents = ref(0)
const actionRequired = ref(0)
const completedStudents = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

type TrendPoint = {
  label: string
  value: number
  height: number
}

type StatusSegment = {
  label: string
  value: number
  percent: number
  color: string
}

const monthlyPlacedTrend = ref<TrendPoint[]>([])

const statusMix = computed<StatusSegment[]>(() => {
  const safeTotal = totalStudents.value > 0 ? totalStudents.value : 1

  return [
    {
      label: 'Preparing',
      value: actionRequired.value,
      percent: Math.round((actionRequired.value / safeTotal) * 100),
      color: 'bg-slate-500'
    },
    {
      label: 'Searching',
      value: searchingStudents.value,
      percent: Math.round((searchingStudents.value / safeTotal) * 100),
      color: 'bg-orange-500'
    },
    {
      label: 'Placed',
      value: placedStudents.value,
      percent: Math.round((placedStudents.value / safeTotal) * 100),
      color: 'bg-green-500'
    },
    {
      label: 'Completed',
      value: completedStudents.value,
      percent: Math.round((completedStudents.value / safeTotal) * 100),
      color: 'bg-blue-500'
    }
  ]
})

const buildLastSixMonthLabels = () => {
  const labels: string[] = []

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    labels.push(
      date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    )
  }

  return labels
}

const fetchDashboardData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [
      totalResult,
      placedResult,
      searchingResult,
      preparingResult,
      completedResult,
      placedStudentsRows
    ] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('internship_status', 'placed')
        .eq('is_active', true),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('internship_status', 'searching')
        .eq('is_active', true),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('internship_status', 'preparing')
        .eq('is_active', true),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('internship_status', 'completed')
        .eq('is_active', true),
      supabase
        .from('users')
        .select('created_at')
        .eq('role', 'student')
        .eq('internship_status', 'placed')
        .eq('is_active', true)
    ])

    const queryErrors = [
      totalResult.error,
      placedResult.error,
      searchingResult.error,
      preparingResult.error,
      completedResult.error,
      placedStudentsRows.error
    ].filter(Boolean)

    if (queryErrors.length > 0) {
      throw queryErrors[0]
    }

    totalStudents.value = totalResult.count || 0
    placedStudents.value = placedResult.count || 0
    searchingStudents.value = searchingResult.count || 0
    actionRequired.value = preparingResult.count || 0
    completedStudents.value = completedResult.count || 0

    const labels = buildLastSixMonthLabels()
    const monthlyCounts = new Map(labels.map((label) => [label, 0]))

    for (const student of placedStudentsRows.data || []) {
      const createdAt = student.created_at
      if (!createdAt) {
        continue
      }

      const label = new Date(createdAt).toLocaleString('en-US', {
        month: 'short',
        year: '2-digit'
      })

      if (monthlyCounts.has(label)) {
        monthlyCounts.set(label, (monthlyCounts.get(label) || 0) + 1)
      }
    }

    const maxCount = Math.max(...Array.from(monthlyCounts.values()), 1)
    monthlyPlacedTrend.value = labels.map((label) => {
      const value = monthlyCounts.get(label) || 0
      const scaledHeight = Math.max(Math.round((value / maxCount) * 180), value > 0 ? 20 : 4)

      return {
        label,
        value,
        height: scaledHeight
      }
    })
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load dashboard data.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchDashboardData()
})
</script>