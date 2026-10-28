<template>
  <div class="question-row">
    <div class="question-stats" aria-label="问题数据">
      <div class="stat">
        <span class="stat-value">{{ formatCompact(question.score) }}</span>
        <span class="stat-label">投票</span>
      </div>
      <div class="stat" :class="{ answered: question.answerCount > 0 }">
        <span class="stat-value" :class="{ accepted: question.hasAcceptedAnswer }">
          <Check v-if="question.hasAcceptedAnswer" :size="12" :stroke-width="2.6" />
          {{ formatCompact(question.answerCount) }}
        </span>
        <span class="stat-label">回答</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ formatCompact(question.viewCount) }}</span>
        <span class="stat-label">浏览</span>
      </div>
    </div>

    <div class="question-content">
      <div class="question-title-row">
        <span v-if="question.isFeatured" class="hot-flag">热门</span>
        <RouterLink
          class="question-title"
          :to="{ name: 'question-detail', params: { id: question.id } }"
        >
          {{ question.title }}
        </RouterLink>
      </div>
      <p class="question-excerpt">{{ question.excerpt }}</p>

      <div class="question-meta">
        <div class="question-tags">
          <TagChip v-for="tag in question.tags" :key="tag.slug" :tag="tag" />
        </div>

        <div class="question-author">
          <UserAvatar :user="question.author" :size="18" />
          <RouterLink
            class="author-name"
            :to="{ name: 'user-profile', params: { handle: question.author.handle } }"
          >
            {{ question.author.name }}
          </RouterLink>
          <span class="author-reputation">{{ formatCompact(question.author.reputation) }}</span>
          <span class="meta-separator" aria-hidden="true" />
          <time class="question-time" :datetime="question.createdAt">
            {{ formatRelativeTime(question.createdAt) }}
          </time>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { QuestionSummary } from '@/api/types'
import TagChip from '@/components/common/TagChip.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { formatCompact, formatRelativeTime } from '@/utils/format'

defineProps<{
  question: QuestionSummary
}>()
</script>

<style scoped>
.question-row {
  display: flex;
  gap: 16px;
  padding: 15px 17px;
  transition: background-color 120ms ease;
}

.question-row:hover {
  background: #fbfcfc;
}

.question-stats {
  display: grid;
  width: 142px;
  flex: 0 0 142px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: flex-start;
  gap: 4px;
  padding-top: 2px;
}

.stat {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  max-width: 100%;
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
}

.stat-value.accepted {
  color: var(--accepted);
}

.stat-label {
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.2;
}

.stat.answered .stat-label {
  color: var(--text-secondary);
}

.question-content {
  min-width: 0;
  flex: 1;
}

.question-title-row {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.question-title {
  color: var(--link);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.38;
  overflow-wrap: anywhere;
}

.question-title:hover {
  color: var(--link-hover);
}

.hot-flag {
  flex: 0 0 auto;
  padding: 1px 5px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 9.5px;
  font-weight: 600;
  line-height: 1.5;
}

.question-excerpt {
  display: -webkit-box;
  margin: 5px 0 9px;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12.5px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.question-meta {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.question-author {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.author-name {
  color: var(--link);
  font-size: 11.5px;
}

.author-name:hover {
  color: var(--link-hover);
}

.author-reputation {
  color: var(--text-muted);
  font-size: 10px;
}

.meta-separator {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border-strong);
}

.question-time {
  color: var(--text-faint);
  font-size: 10.5px;
}

@media (max-width: 640px) {
  .question-row {
    display: block;
    padding: 13px 13px 14px;
  }

  .question-stats {
    width: auto;
    grid-template-columns: repeat(3, auto);
    justify-content: flex-start;
    gap: 18px;
    margin-bottom: 7px;
  }

  .stat {
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }

  .stat-value {
    font-size: 12px;
  }

  .stat-label {
    font-size: 10.5px;
  }

  .question-title {
    font-size: 15px;
  }

  .question-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .question-author {
    align-self: stretch;
  }

  .question-time {
    margin-left: auto;
  }
}
</style>
