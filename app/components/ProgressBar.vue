<template>
  <div :class="['w-full', $attrs.class]" role="progressbar" :aria-valuenow="clamped" aria-valuemin="0" aria-valuemax="100">
    <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div class="h-2 rounded-full bg-teal-500 transition-all" :style="{ width: `${clamped}%` }"></div>
    </div>
    <div class="mt-2 text-xs text-slate-500">{{ clamped }}%</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value?: number }>()

const clamped = computed(() => Math.max(0, Math.min(100, Math.round(props.value || 0))))
</script>
