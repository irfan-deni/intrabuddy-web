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
  const isPositive = props.positive === true || ['Accepted', 'Completed', 'Placed', 'YES', 'Submitted'].includes(props.status || '')
  const isWarning = ['Interview', 'Pending', 'NO', 'Not Submitted', 'Late', 'Searching'].includes(props.status || '')

  if (isPositive) {
    return 'bg-brand-emerald text-white border-brand-emerald shadow-sm shadow-black/10'
  }

  if (isWarning) {
    return 'bg-brand-gold text-black border-brand-gold'
  }

  return 'bg-white text-text-veryMuted border-slate-100'
})
</script>
