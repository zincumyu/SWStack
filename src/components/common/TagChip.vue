<template>
  <RouterLink
    class="tag-chip"
    :class="{ large: size === 'lg' }"
    :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
  >
    {{ tag.name }}
  </RouterLink>
</template>

<script setup lang="ts">
import type { QuestionTag } from '@/api/types'

withDefaults(
  defineProps<{
    tag: QuestionTag
    size?: 'sm' | 'lg'
  }>(),
  { size: 'sm' },
)
</script>

<style scoped>
.tag-chip {
  display: inline-flex;
  align-items: center;
  min-height: 21px;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 11.5px;
  line-height: 1.35;
  transition: background-color 120ms ease, color 120ms ease;
}

.tag-chip:hover {
  background: var(--tag-hover);
  color: var(--tag-text);
}

.tag-chip.large {
  min-height: 27px;
  padding: 4px 9px;
  font-size: 13px;
}
</style>
