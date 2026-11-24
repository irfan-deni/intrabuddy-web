<template>
  <div class="app-surface-ui space-y-5 md:space-y-6">
    <PortalPageHeader title="Announcements &amp; Alerts" icon="pi-megaphone" description="Send announcements and individual alerts." />

    <nav class="inline-flex max-w-full flex-wrap gap-1 rounded-control border border-surface-border bg-surface-muted p-1" aria-label="Communication type">
      <NuxtLink
        :to="{ path: '/communications', query: { tab: 'broadcasts' } }"
        :aria-current="tab === 'broadcasts' ? 'page' : undefined"
        class="rounded-control px-3 py-2 text-sm font-semibold transition-colors sm:px-4"
        :class="tab === 'broadcasts' ? 'bg-sky-100 text-sky-900' : 'text-text-muted hover:bg-surface-hover hover:text-slate-800'"
      >
        Announcements
      </NuxtLink>
      <NuxtLink
        :to="{ path: '/communications', query: { tab: 'alerts' } }"
        :aria-current="tab === 'alerts' ? 'page' : undefined"
        class="rounded-control px-3 py-2 text-sm font-semibold transition-colors sm:px-4"
        :class="tab === 'alerts' ? 'bg-sky-100 text-sky-900' : 'text-text-muted hover:bg-surface-hover hover:text-slate-800'"
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
