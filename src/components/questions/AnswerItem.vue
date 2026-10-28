<template>
  <article :id="`answer-${answer.id}`" class="answer-item" :class="{ accepted: answer.accepted }">
    <div class="answer-grid">
      <div class="answer-rail">
        <QuestionVoteControl
          :score="answer.score"
          :vote="answer.viewerVote"
          @vote="$emit('vote', answer.id, $event)"
        />
        <span v-if="answer.accepted" class="accepted-mark" title="已采纳" aria-label="已采纳">
          <Check :size="16" :stroke-width="2.6" />
        </span>
      </div>

      <div class="answer-main">
        <MarkdownRenderer :source="answer.body" />

        <CommentList v-if="answer.comments.length" :comments="answer.comments" />

        <div class="answer-actions">
          <button class="text-link answer-share" type="button" @click="shareAnswer">
            分享
          </button>
          <span class="answer-published">发布于 {{ formatRelativeTime(answer.createdAt) }}</span>
        </div>

        <div class="answer-author-row">
          <div class="answer-author-card">
            <div class="author-caption">回答于 {{ formatDateTime(answer.createdAt) }}</div>
            <div class="author-identity">
              <UserAvatar :user="answer.author" :size="28" />
              <div class="author-copy">
                <RouterLink
                  :to="{ name: 'user-profile', params: { handle: answer.author.handle } }"
                >
                  {{ answer.author.name }}
                </RouterLink>
                <span>{{ formatCompact(answer.author.reputation) }} 声望</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { Answer } from '@/api/types'
import CommentList from '@/components/questions/CommentList.vue'
import QuestionVoteControl from '@/components/questions/QuestionVoteControl.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { copyText } from '@/utils/clipboard'
import { formatCompact, formatDateTime, formatRelativeTime } from '@/utils/format'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  answer: Answer
}>()

defineEmits<{
  vote: [answerId: number, value: -1 | 1]
}>()

const toastStore = useToastStore()

async function shareAnswer(): Promise<void> {
  try {
    const baseUrl = window.location.href.split('#')[0]
    await copyText(`${baseUrl}#answer-${props.answer.id}`)
    toastStore.success('链接已复制到剪贴板')
  } catch {
    toastStore.error('复制链接失败')
  }
}
</script>

<style scoped>
.answer-item {
  padding: 20px 16px;
}

.answer-item + .answer-item {
  border-top: 1px solid var(--border);
}

.answer-item.accepted {
  background: linear-gradient(90deg, rgba(47, 111, 68, 0.035), transparent 190px);
}

.answer-grid {
  display: flex;
  gap: 18px;
}

.answer-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.accepted-mark {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #b7d8c4;
  border-radius: 50%;
  background: var(--accepted-bg);
  color: var(--accepted);
}

.answer-main {
  min-width: 0;
  flex: 1;
}

.answer-actions {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 14px;
  color: var(--text-faint);
  font-size: 11px;
}

.answer-share {
  color: var(--text-muted);
  font-size: 12px;
}

.answer-share:hover {
  color: var(--link-hover);
}

.answer-published {
  margin-left: auto;
  margin-right: 4px;
}

.answer-author-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.answer-author-card {
  width: min(100%, 250px);
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.author-caption {
  margin-bottom: 7px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.author-identity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.author-copy a {
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-copy span {
  color: var(--text-muted);
  font-size: 10.5px;
}

@media (max-width: 720px) {
  .answer-item {
    padding: 16px 13px;
  }

  .answer-grid {
    flex-direction: column;
    gap: 12px;
  }

  .answer-rail {
    flex-direction: row;
    justify-content: flex-start;
  }

  .accepted-mark {
    width: 25px;
    height: 25px;
  }

  .answer-actions {
    flex-wrap: wrap;
  }

  .answer-author-row {
    justify-content: stretch;
  }

  .answer-author-card {
    width: 100%;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .answer-item.accepted {
    scroll-margin-top: 80px;
  }
}
</style>
