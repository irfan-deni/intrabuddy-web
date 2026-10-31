<template>
  <div class="space-y-3">
    <p v-if="content.text" class="text-sm text-text-muted whitespace-pre-wrap break-words" :class="compact ? 'line-clamp-2' : ''">{{ content.text }}</p>
    <div v-if="content.images.length" class="flex flex-wrap gap-3">
      <figure v-for="(image, index) in content.images" :key="image" class="max-w-full">
        <img v-if="!failedImages.includes(image)" :src="image" :alt="`Announcement attachment ${index + 1}`"
          class="rounded-control max-w-full object-contain border border-surface-border" :class="compact ? 'max-h-24 max-w-32' : 'max-h-64'"
          loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="failedImages.push(image)">
        <figcaption v-else class="text-sm text-text-muted">Image attachment {{ index + 1 }} is unavailable.</figcaption>
      </figure>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isBroadcastImagePath, parseAnnouncement } from '~/utils/announcement-content'
const props = defineProps<{ body: string | null | undefined; imagePaths?: string[] | null; compact?: boolean }>()
const config = useRuntimeConfig()
const supabase = useSupabaseClient()
const content = computed(() => {
  const urls = (props.imagePaths || []).filter(isBroadcastImagePath)
    .map(path => supabase.storage.from('broadcast-media').getPublicUrl(path).data.publicUrl)
  return parseAnnouncement(props.body, config.public.supabase.url, urls)
})
const failedImages = ref<string[]>([])
watch(() => [props.body, props.imagePaths], () => { failedImages.value = [] })
</script>
