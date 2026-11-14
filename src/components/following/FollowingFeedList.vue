<template>
  <div class="following-list">
    <article v-for="item in items" :key="item.id" class="feed-item" :class="item.type">
      <div class="feed-kind">
        <span class="kind-icon" aria-hidden="true">
          <MessageSquareText v-if="item.type === 'question'" :size="14" />
          <BookOpen v-else-if="item.type === 'column'" :size="14" />
          <GitCommitHorizontal v-else :size="14" />
        </span>
        <span class="kind-label">
          {{ item.type === 'question' ? '问题' : item.type === 'column' ? '专栏' : '项目日志' }}
        </span>
      </div>

      <div class="feed-copy">
        <template v-if="item.type === 'question'">
          <div class="item-title-row">
            <RouterLink
              class="item-title"
              :to="{ name: 'question-detail', params: { id: item.question.id } }"
            >
              {{ item.question.title }}
            </RouterLink>
            <span v-if="item.question.isFeatured" class="featured-flag">热门</span>
          </div>
          <p class="item-excerpt">{{ item.question.excerpt }}</p>
          <div class="item-meta">
            <div class="item-tags">
              <TagChip v-for="tag in item.question.tags.slice(0, 3)" :key="tag.slug" :tag="tag" />
            </div>
            <span class="item-stat">{{ item.question.answerCount }} 回答</span>
            <span class="source">
              <UserAvatar :user="item.question.author" :size="16" />
              {{ item.question.author.name }}
            </span>
            <time class="item-time" :datetime="item.createdAt">
              {{ formatRelativeTime(item.createdAt) }}
            </time>
          </div>
        </template>

        <template v-else-if="item.type === 'column'">
          <div class="item-title-row">
            <span class="column-level" :class="item.column.level">
              {{ COLUMN_LEVEL_META[item.column.level].label }}
            </span>
            <RouterLink
              class="item-title"
              :to="{ name: 'column-detail', params: { slug: item.column.slug } }"
            >
              {{ item.column.title }}
            </RouterLink>
            <span v-if="item.column.featured" class="featured-flag">精选</span>
          </div>
          <p class="item-excerpt">{{ item.column.summary }}</p>
          <div class="item-meta">
            <span v-for="tag in item.column.tags.slice(0, 3)" :key="tag.slug" class="tag-text">
              #{{ tag.name }}
            </span>
            <span class="item-stat">{{ item.column.readingMinutes }} 分钟</span>
            <span class="source">
              <UserAvatar :user="item.column.author" :size="16" />
              {{ item.column.author.name }}
            </span>
            <time class="item-time" :datetime="item.createdAt">
              {{ formatRelativeTime(item.createdAt) }}
            </time>
          </div>
        </template>

        <template v-else>
          <div class="item-title-row">
            <RouterLink
              class="project-ref"
              :to="{ name: 'project-detail', params: { slug: item.project.slug } }"
            >
              {{ item.project.name }}
            </RouterLink>
            <ProjectStatusBadge :status="item.project.status" />
          </div>
          <RouterLink
            class="item-title update-title"
            :to="{ name: 'project-detail', params: { slug: item.project.slug } }"
          >
            {{ item.update.title }}
          </RouterLink>
          <p class="item-excerpt">{{ plainUpdateBody(item.update.body) }}</p>
          <div class="item-meta">
            <span class="project-tagline">{{ item.project.tagline }}</span>
            <span class="source">
              <UserAvatar :user="item.update.author" :size="16" />
              {{ item.update.author.name }}
            </span>
            <time class="item-time" :datetime="item.createdAt">
              {{ formatRelativeTime(item.createdAt) }}
            </time>
          </div>
        </template>
      </div>

      <RouterLink class="item-open" :to="itemTarget(item)" :aria-label="`打开${itemTitle(item)}`">
        <ArrowRight :size="14" />
      </RouterLink>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, BookOpen, GitCommitHorizontal, MessageSquareText } from 'lucide-vue-next'
import type { FollowingFeedItem } from '@/api/types'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import TagChip from '@/components/common/TagChip.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { COLUMN_LEVEL_META } from '@/utils/column-meta'
import { formatRelativeTime } from '@/utils/format'

defineProps<{
  items: FollowingFeedItem[]
}>()

function plainUpdateBody(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function itemTarget(item: FollowingFeedItem) {
  if (item.type === 'question') {
    return { name: 'question-detail', params: { id: item.question.id } }
  }
  if (item.type === 'column') {
    return { name: 'column-detail', params: { slug: item.column.slug } }
  }
  return { name: 'project-detail', params: { slug: item.project.slug } }
}

function itemTitle(item: FollowingFeedItem): string {
  if (item.type === 'question') {
    return item.question.title
  }
  if (item.type === 'column') {
    return item.column.title
  }
  return `${item.project.name} ${item.update.title}`
}
</script>

<style scoped>
.following-list {
  background: var(--surface);
}

.feed-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 15px;
  transition: background-color 120ms ease;
}

.feed-item + .feed-item {
  border-top: 1px solid var(--border);
}

.feed-item:hover {
  background: #fbfcfc;
}

.feed-kind {
  display: flex;
  width: 60px;
  flex: 0 0 60px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 1px;
}

.kind-icon {
  display: inline-flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.feed-item.question .kind-icon {
  border-color: #ccd9e4;
  background: #f2f7fb;
  color: #4d6f8b;
}

.feed-item.column .kind-icon {
  border-color: #ead9c8;
  background: #fbf6f1;
  color: #85613f;
}

.feed-item.projectUpdate .kind-icon {
  border-color: #c5d9d0;
  background: #f1f8f4;
  color: #3d6f59;
}

.kind-label {
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.2;
  white-space: nowrap;
}

.feed-copy {
  min-width: 0;
  flex: 1;
}

.item-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.item-title {
  color: var(--link);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.feed-item:hover .item-title {
  color: var(--link-hover);
}

.item-title.update-title {
  display: block;
  margin-top: 4px;
  font-weight: 500;
}

.featured-flag {
  flex: 0 0 auto;
  padding: 1px 5px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 9px;
  font-weight: 600;
}

.column-level {
  flex: 0 0 auto;
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9px;
}

.column-level.beginner {
  border-color: #ccd9e4;
  background: #f2f7fb;
  color: #4d6f8b;
}

.column-level.intermediate {
  border-color: #ead9c8;
  background: #fbf6f1;
  color: #85613f;
}

.column-level.advanced {
  border-color: #c5d9d0;
  background: #f1f8f4;
  color: #3d6f59;
}

.project-ref {
  overflow: hidden;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-ref:hover {
  color: var(--link-hover);
}

.item-excerpt {
  display: -webkit-box;
  overflow: hidden;
  margin: 4px 0 7px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: var(--text-faint);
  font-size: 10px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-text {
  max-width: 92px;
  overflow: hidden;
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-tagline {
  overflow: hidden;
  max-width: 260px;
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-stat {
  color: var(--text-faint);
}

.source {
  display: inline-flex;
  max-width: 150px;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  color: var(--text-muted);
  white-space: nowrap;
}

.source :deep(.user-avatar) {
  flex: 0 0 auto;
}

.item-time {
  margin-left: auto;
  color: var(--text-faint);
  white-space: nowrap;
}

.item-open {
  display: inline-flex;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  align-items: center;
  justify-content: center;
  align-self: center;
  border: 1px solid transparent;
  border-radius: 2px;
  color: var(--text-faint);
}

.item-open:hover {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .feed-item {
    gap: 9px;
    padding: 12px;
  }

  .feed-kind {
    width: 29px;
    flex-basis: 29px;
  }

  .kind-icon {
    width: 28px;
    height: 28px;
  }

  .kind-label,
  .item-stat,
  .item-open,
  .project-tagline {
    display: none;
  }

  .item-title {
    font-size: 12.5px;
  }

  .item-excerpt {
    -webkit-line-clamp: 2;
  }

  .item-time {
    margin-left: 0;
  }
}
</style>
