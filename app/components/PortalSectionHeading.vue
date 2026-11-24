<template>
  <div class="flex min-w-0 items-start gap-3">
    <span aria-hidden="true" class="grid h-9 w-9 shrink-0 place-items-center rounded-control" :class="tones[tone]">
      <i :class="['pi', icon]" />
    </span>
    <div class="min-w-0 self-center">
      <h2 class="break-words text-lg font-semibold text-slate-800">{{ title }}</h2>
      <p v-if="description" class="mt-0.5 text-sm text-text-muted">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const tones = {
  sky: 'bg-sky-100 text-sky-800',
  teal: 'bg-teal-100 text-teal-800',
  violet: 'bg-violet-100 text-violet-800'
} as const

withDefaults(defineProps<{
  title: string
  icon: string
  description?: string
  tone?: keyof typeof tones
}>(), { tone: 'sky' })
</script>
