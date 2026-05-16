<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tighter border transition-all"
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
  // Pure B&W logic
  const isPositive = props.positive === true || ['Accepted', 'Completed', 'YES', 'Submitted'].includes(props.status || '')
  const isWarning = ['Interview', 'Pending', 'NO', 'Not Submitted', 'Late'].includes(props.status || '')

  if (isPositive) {
    return 'bg-black text-white border-black shadow-sm shadow-black/10'
  }
  
  if (isWarning) {
    return 'bg-white text-black border-black'
  }

  return 'bg-white text-slate-300 border-slate-100'
})
</script>
