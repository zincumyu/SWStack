<template>
  <span class="admin-badge" :class="tone">
    <Clock3 v-if="status === 'pending'" :size="9" aria-hidden="true" />
    <Check v-else-if="status === 'approved'" :size="9" aria-hidden="true" />
    <RotateCcw v-else :size="9" aria-hidden="true" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clock3, RotateCcw } from 'lucide-vue-next'
import type { ProjectReviewStatus } from '@/api/types'
import { PROJECT_REVIEW_META } from '@/utils/project-meta'

const props = defineProps<{
  status: ProjectReviewStatus
}>()

const meta = computed(() => PROJECT_REVIEW_META[props.status])
const tone = computed(() => {
  if (props.status === 'approved') {
    return 'published'
  }
  return props.status
})
</script>
