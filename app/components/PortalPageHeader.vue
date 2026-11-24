<template>
  <header class="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-sky-200 pb-4">
    <div class="flex min-w-0 grow basis-56 items-start gap-3 sm:gap-4">
      <slot name="leading">
        <span aria-hidden="true" class="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-sky-100 text-sky-800 sm:h-11 sm:w-11">
          <i :class="['pi', icon]" />
        </span>
      </slot>
      <div class="min-w-0">
        <p v-if="eyebrow" class="mb-0.5 text-xs font-semibold text-teal-800">{{ eyebrow }}</p>
        <h1 class="break-words text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">{{ title }}</h1>
        <p v-if="description" class="mt-1 text-sm leading-relaxed text-text-muted">{{ description }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  icon?: string
  description?: string
  eyebrow?: string
}>()
</script>
