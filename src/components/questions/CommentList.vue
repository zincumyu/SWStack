<template>
  <ul v-if="comments.length > 0" class="comment-list">
    <li v-for="item in comments" :key="item.id" class="comment-item">
      <span class="comment-body">{{ item.body }}</span>
      <span class="comment-meta">
        <span class="comment-separator" aria-hidden="true" />
        <RouterLink
          class="comment-author"
          :to="{ name: 'user-profile', params: { handle: item.author.handle } }"
        >
          {{ item.author.name }}
        </RouterLink>
        <time :datetime="item.createdAt">{{ formatRelativeTime(item.createdAt) }}</time>
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { QuestionComment } from '@/api/types'
import { formatRelativeTime } from '@/utils/format'

defineProps<{
  comments: QuestionComment[]
}>()
</script>

<style scoped>
.comment-list {
  margin: 11px 0 0;
  padding: 0;
  list-style: none;
}

.comment-item {
  padding: 4px 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.comment-body {
  overflow-wrap: anywhere;
}

.comment-meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 5px;
  color: var(--text-faint);
  font-size: 10.5px;
  white-space: nowrap;
}

.comment-separator {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border-strong);
}

.comment-author {
  color: var(--link);
}

.comment-author:hover {
  color: var(--link-hover);
}

.comment-item + .comment-item {
  border-top: 1px dashed var(--border);
}
</style>
