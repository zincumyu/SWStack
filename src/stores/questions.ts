import { defineStore } from 'pinia'
import { ref } from 'vue'
import { questionApi } from '@/api/questions'
import type { QuestionQuery, QuestionSummary } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useQuestionsStore = defineStore('questions', () => {
  const items = ref<QuestionSummary[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestSequence = 0

  async function load(query: QuestionQuery): Promise<void> {
    const sequence = ++requestSequence
    loading.value = true
    error.value = null

    try {
      const result = await questionApi.list(query)
      if (sequence !== requestSequence) {
        return
      }
      items.value = result.items
      total.value = result.total
    } catch (cause) {
      if (sequence !== requestSequence) {
        return
      }
      items.value = []
      total.value = 0
      error.value = getErrorMessage(cause)
    } finally {
      if (sequence === requestSequence) {
        loading.value = false
      }
    }
  }

  return {
    items,
    total,
    loading,
    error,
    load,
  }
})
