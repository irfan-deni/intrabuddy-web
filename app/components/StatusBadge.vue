<template>
  <span
    class="inline-flex items-center px-3 py-1 text-xs font-semibold rounded"
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
  if (props.positive !== undefined) {
    return props.positive ? 'YES' : 'NO'
  }
  return props.status || 'UNKNOWN'
})

const badgeClass = computed(() => {
  const isPositive = props.positive === true || ['Accepted', 'Completed', 'Placed', 'YES', 'Submitted'].includes(props.status || '')
  const isWarning = ['Interview', 'Pending', 'NO', 'Not Submitted', 'Late', 'Searching'].includes(props.status || '')

  if (isPositive) {
    return 'bg-emerald-500 text-white'
  }

  if (isWarning) {
    return 'bg-amber-400 text-slate-900'
  }

  return 'bg-white text-stone-400 border border-stone-200'
})
</script>
