<template>
  <div class="w-full bg-surface-border h-2 rounded-full overflow-hidden">
    <div
      class="bg-sky-600 h-full transition-all duration-700"
      :style="{ width: `${value}%` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: number
}>()
</script>
