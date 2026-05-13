<template>
  <span :class="classes">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  status?: string
  positive?: boolean | null
}>()

import { computed } from 'vue'

const label = computed(() => {
  if (props.positive !== undefined && props.positive !== null) {
    return props.positive ? 'Yes' : 'No'
  }
  return props.status || ''
})

const classes = computed(() => {
  if (props.positive !== undefined && props.positive !== null) {
    return props.positive
      ? 'inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800'
      : 'inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800'
  }

  switch ((props.status || '').toLowerCase()) {
    case 'pending':
      return 'inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800'
    case 'accepted':
    case 'yes':
      return 'inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800'
    case 'rejected':
      return 'inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800'
    default:
      return 'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700'
  }
})
</script>
