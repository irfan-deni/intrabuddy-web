<template>
  <div class="w-full bg-slate-100 h-2 rounded-none overflow-hidden">
    <div
      class="bg-brand-cyan h-full transition-all duration-700"
      :style="{ width: `${value}%` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: number
}>()
</script>
