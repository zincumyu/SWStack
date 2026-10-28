<template>
  <div class="empty-state">
    <SearchX :size="26" class="empty-icon" aria-hidden="true" />
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: '',
  },
)
</script>

<style scoped>
.empty-icon {
  margin-bottom: 4px;
  color: var(--text-faint);
}

.empty-actions {
  margin-top: 8px;
}
</style>
