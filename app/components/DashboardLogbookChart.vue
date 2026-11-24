<template>
  <figure aria-labelledby="logbook-chart-caption" class="flex min-w-0 flex-col gap-2">
    <figcaption id="logbook-chart-caption" class="sr-only">Logbook counts by reporting week. Select a week to open its records.</figcaption>
    <div class="order-last flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 text-xs text-text-muted sm:order-none">
      <p>{{ weeks.length === 1 ? 'Most recent reporting week' : `Last ${weeks.length} reporting weeks` }}</p>
      <ul aria-label="Logbook statuses" class="flex flex-wrap gap-x-3 gap-y-1 font-medium">
        <li v-for="status in statuses" :key="status.key" class="flex items-center gap-1.5">
          <span aria-hidden="true" class="h-2.5 w-2.5 rounded-sm" :class="status.color"></span>{{ status.label }}
        </li>
      </ul>
    </div>
    <div class="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start">
      <div aria-hidden="true" class="chart-axis flex flex-col justify-between pr-2 text-right text-[11px] tabular-nums text-slate-500">
        <span>{{ ceiling }}</span><span>{{ ceiling / 2 }}</span><span>0</span>
      </div>
      <div class="chart-scroll overflow-x-auto">
        <div class="chart-weeks grid" :class="{ 'min-w-72 sm:min-w-0': weeks.length > 4 }" :style="{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }">
          <NuxtLink v-for="week in weeks" :key="week.weekEnd"
            :to="{ path: '/logbooks', query: { week_end: week.weekEnd } }"
            :aria-label="weekLabel(week)" :title="weekLabel(week)"
            class="group min-w-0 rounded-control text-center hover:bg-sky-100/60 focus-visible:outline-sky-700"
            :class="{ 'bg-teal-50/80': week.weekEnd === currentWeek }">
            <span aria-hidden="true" class="chart-plot relative flex items-end justify-center">
              <span class="chart-bar relative z-10 flex w-3/5 max-w-14 flex-col-reverse overflow-hidden rounded-t-md transition-[filter] group-hover:brightness-110"
                :style="{ height: `${((week.submitted + week.overdue + week.pending) / ceiling) * 100}%` }">
                <span v-for="status in statuses" :key="status.key" :class="status.color" :style="{ flexGrow: week[status.key] }"></span>
              </span>
            </span>
            <span aria-hidden="true" class="block px-0.5 pb-1 pt-2 text-xs leading-tight text-slate-600">
              <span v-if="week.weekNumber != null" class="mb-0.5 block font-semibold text-slate-800">Week {{ week.weekNumber }}</span>
              <span :class="week.weekNumber == null ? 'font-semibold' : 'text-[11px]'">{{ compact.format(new Date(week.weekEnd)) }}</span>
            </span>
            <span v-if="week.weekEnd === currentWeek" aria-hidden="true" class="block pb-1 text-[10px] font-bold text-teal-800">Current</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import type { LogbookTrendWeek } from '~/types/dashboard'

const props = defineProps<{ weeks: LogbookTrendWeek[]; currentWeek: string | null }>()
const statuses = [
  { key: 'submitted', label: 'Submitted', color: 'bg-teal-600' },
  { key: 'overdue', label: 'Overdue', color: 'bg-amber-400' },
  { key: 'pending', label: 'Not yet due', color: 'bg-sky-300' }
] as const

const ceiling = computed(() => {
  const peak = Math.max(2, ...props.weeks.map(week => week.submitted + week.overdue + week.pending))
  const scale = Math.max(2, 10 ** Math.floor(Math.log10(peak)))
  return Math.ceil(peak / scale) * scale
})
const compact = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const full = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const weekLabel = (week: LogbookTrendWeek) => {
  const current = week.weekEnd === props.currentWeek
  const label = week.weekNumber != null
    ? `Week ${week.weekNumber}${current ? ' (current)' : ''}, ending`
    : current ? 'Current week, ending' : 'Week ending'
  return `${label} ${full.format(new Date(week.weekEnd))}: ${week.submitted} submitted, ${week.overdue} overdue, ${week.pending} not yet due`
}
</script>

<style scoped>
.chart-weeks, .chart-axis {
  --plot-height: clamp(7.75rem, 19vh, 12rem);
}

.chart-axis {
  height: var(--plot-height);
  line-height: 1;
}

.chart-plot {
  height: var(--plot-height);
  background: linear-gradient(to bottom, #d9e4ed 1px, transparent 1px) 0 0 / 100% 50%;
  border-bottom: 1px solid #b7c9d6;
}

.chart-bar > span {
  flex-basis: 0%;
}

.chart-scroll :deep(a:focus-visible) {
  outline-offset: -2px;
}
</style>
