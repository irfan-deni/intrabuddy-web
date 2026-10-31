<template>
  <span
    class="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-badge"
    :class="badgeClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  status?: string
  positive?: boolean
}>()

const label = computed(() => {
  if (props.status) {
    return props.status
  }
  if (props.positive !== undefined) {
    return props.positive ? 'YES' : 'NO'
  }
  return 'UNKNOWN'
})

const badgeClass = computed(() => {
  const isPositive = props.positive === true || ['Accepted', 'Completed', 'Placed', 'YES', 'Submitted'].includes(props.status || '')
  const isWarning = ['Interview', 'Pending', 'NO', 'Not Submitted', 'Late', 'Overdue', 'Searching'].includes(props.status || '')

  if (isPositive) {
    return 'bg-emerald-100 text-emerald-900'
  }

  if (isWarning) {
    return 'bg-amber-400 text-slate-900'
  }

  return 'bg-surface-muted text-text-muted border border-surface-border'
})
</script>
