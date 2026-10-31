<template>
  <div class="app-surface-ui space-y-8 md:space-y-10">
    <header>
      <h1 class="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">Announcements &amp; Alerts</h1>
      <p class="mt-2 text-sm font-normal leading-relaxed text-text-muted">Send announcements and individual alerts.</p>
    </header>

    <nav class="flex border-b border-surface-border" aria-label="Communication type">
      <NuxtLink
        :to="{ path: '/communications', query: { tab: 'broadcasts' } }"
        class="px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors"
        :class="tab === 'broadcasts' ? 'border-sky-600 text-sky-700' : 'border-transparent text-text-muted hover:text-slate-800'"
      >
        Announcements
      </NuxtLink>
      <NuxtLink
        :to="{ path: '/communications', query: { tab: 'alerts' } }"
        class="px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors"
        :class="tab === 'alerts' ? 'border-sky-600 text-sky-700' : 'border-transparent text-text-muted hover:text-slate-800'"
      >
        Individual alerts
      </NuxtLink>
    </nav>

    <BroadcastsPanel v-if="tab === 'broadcasts'" embedded />
    <AlertsPanel v-else embedded />
  </div>
</template>

<script setup lang="ts">
import BroadcastsPanel from '~/pages/broadcasts.vue'
import AlertsPanel from '~/pages/notifications.vue'

definePageMeta({ requiredRole: 'coordinator' })

const route = useRoute()
const tab = computed(() => route.query.tab === 'alerts' ? 'alerts' : 'broadcasts')
</script>
