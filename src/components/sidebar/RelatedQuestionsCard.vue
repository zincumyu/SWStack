<template>
  <section v-if="questions.length" class="panel related-card" aria-labelledby="related-title">
    <div class="panel-header">
      <h2 id="related-title" class="panel-title">
        <Link2 :size="14" aria-hidden="true" />
        相关问题
      </h2>
    </div>
    <div class="related-list">
      <RouterLink
        v-for="question in questions"
        :key="question.id"
        class="related-item"
        :to="{ name: 'question-detail', params: { id: question.id } }"
      >
        <span class="related-title">{{ question.title }}</span>
        <span class="related-meta">
          <span class="related-score">{{ question.score }} 票</span>
          <span
            class="related-answers"
            :class="{ accepted: question.hasAcceptedAnswer }"
          >
            <Check v-if="question.hasAcceptedAnswer" :size="11" />
            {{ question.answerCount }} 回答
          </span>
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Check, Link2 } from 'lucide-vue-next'
import type { QuestionSummary } from '@/api/types'

defineProps<{
  questions: QuestionSummary[]
}>()
</script>

<style scoped>
.related-list {
  padding: 4px 0;
}

.related-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 13px;
  color: var(--text-secondary);
}

.related-item:hover {
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.related-item + .related-item {
  border-top: 1px solid #f0f1f2;
}

.related-title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--link);
  font-size: 11.5px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.related-item:hover .related-title {
  color: var(--link-hover);
}

.related-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.related-answers {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.related-answers.accepted {
  color: var(--accepted);
}
</style>
