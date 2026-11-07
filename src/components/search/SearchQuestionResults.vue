<template>
  <div class="result-list">
    <QuestionListItem
      v-for="question in items"
      :key="question.id"
      :question="question"
      :keyword="keyword"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuestionSummary } from '@/api/types'
import QuestionListItem from '@/components/questions/QuestionListItem.vue'

withDefaults(
  defineProps<{
    items: QuestionSummary[]
    keyword?: string
  }>(),
  { keyword: '' },
)
</script>

<style scoped>
.result-list :deep(.question-row + .question-row) {
  border-top: 1px solid var(--border);
}
</style>
