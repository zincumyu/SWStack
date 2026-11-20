import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchApi } from '@/api/search'
import type { TrendingSearchTerm } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useSearchAssistStore = defineStore('search-assist', () => {
  const trending = ref<TrendingSearchTerm[]>([])
  const trendingLoading = ref(false)
  const trendingError = ref<string | null>(null)
  let trendingPromise: Promise<void> | null = null

  function loadTrending(force = false): Promise<void> {
    if (trendingPromise) {
      return trendingPromise
    }
    if (trending.value.length > 0 && !force) {
      return Promise.resolve()
    }

    trendingLoading.value = true
    trendingError.value = null
    trendingPromise = searchApi
      .trending()
      .then((result) => {
        trending.value = result
      })
      .catch((cause) => {
        trendingError.value = getErrorMessage(cause)
      })
      .finally(() => {
        trendingLoading.value = false
        trendingPromise = null
      })

    return trendingPromise
  }

  function reset(): void {
    trending.value = []
    trendingLoading.value = false
    trendingError.value = null
  }

  return {
    trending,
    trendingLoading,
    trendingError,
    loadTrending,
    reset,
  }
})
