<template>
  <nav class="feed-entry" aria-label="问答动态">
    <RouterLink class="feed-entry-link" :class="{ active: active === 'latest' }" to="/">
      <MessageSquareText :size="14" />
      最新问答
    </RouterLink>
    <RouterLink
      class="feed-entry-link"
      :class="{ active: active === 'following' }"
      :to="{ name: 'following' }"
    >
      <Rss :size="14" />
      关注动态
      <span class="entry-hint">来自关注的人与标签</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { MessageSquareText, Rss } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    active: 'latest' | 'following'
  }>(),
  {},
)
</script>

<style scoped>
.feed-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 11px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
}

.feed-entry-link {
  display: inline-flex;
  min-height: 29px;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 2px;
  color: var(--text-muted);
  font-size: 11.5px;
}

.feed-entry-link:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.feed-entry-link.active {
  background: var(--surface-muted);
  color: var(--text);
  font-weight: 500;
}

.entry-hint {
  margin-left: 2px;
  color: var(--text-faint);
  font-size: 10px;
}

@media (max-width: 720px) {
  .entry-hint {
    display: none;
  }
}
</style>
