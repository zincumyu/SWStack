import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchApi } from '@/api/search'
import type { SearchQuery, SearchResults } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useSearchStore = defineStore('search', () => {
  const result = ref<SearchResults | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let sequence = 0

  async function search(query: SearchQuery): Promise<void> {
    const current = ++sequence
    loading.value = true
    error.value = null
    try {
      const response = await searchApi.search(query)
      if (current === sequence) {
        result.value = response
      }
    } catch (cause) {
      if (current === sequence) {
        result.value = null
        error.value = getErrorMessage(cause)
      }
    } finally {
      if (current === sequence) {
        loading.value = false
      }
    }
  }

  function reset(): void {
    sequence += 1
    result.value = null
    loading.value = false
    error.value = null
  }

  return {
    result,
    loading,
    error,
    search,
    reset,
  }
})
