<template>
  <div class="w-full bg-stone-100 h-2 rounded overflow-hidden">
    <div
      class="bg-blue-600 h-full transition-all duration-700"
      :style="{ width: `${value}%` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: number
}>()
</script>
