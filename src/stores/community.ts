import { defineStore } from 'pinia'
import { ref } from 'vue'
import { communityApi } from '@/api/community'
import { tagApi } from '@/api/tags'
import type { CommunityStats, Tag, TopMember } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useCommunityStore = defineStore('community', () => {
  const stats = ref<CommunityStats | null>(null)
  const popularTags = ref<Tag[]>([])
  const topMembers = ref<TopMember[]>([])
  const allTags = ref<Tag[]>([])
  const overviewLoading = ref(false)
  const overviewError = ref<string | null>(null)
  const tagsLoading = ref(false)
  const tagsError = ref<string | null>(null)
  let overviewPromise: Promise<void> | null = null
  let tagsPromise: Promise<void> | null = null

  function loadOverview(force = false): Promise<void> {
    if (overviewPromise) {
      return overviewPromise
    }
    if (stats.value && !force) {
      return Promise.resolve()
    }

    overviewLoading.value = true
    overviewError.value = null
    overviewPromise = communityApi
      .overview()
      .then((result) => {
        stats.value = result.stats
        popularTags.value = result.popularTags
        topMembers.value = result.topMembers
      })
      .catch((cause) => {
        overviewError.value = getErrorMessage(cause)
      })
      .finally(() => {
        overviewLoading.value = false
        overviewPromise = null
      })

    return overviewPromise
  }

  function loadTags(force = false): Promise<void> {
    if (tagsPromise) {
      return tagsPromise
    }
    if (allTags.value.length > 0 && !force) {
      return Promise.resolve()
    }

    tagsLoading.value = true
    tagsError.value = null
    tagsPromise = tagApi
      .list()
      .then((result) => {
        allTags.value = result
      })
      .catch((cause) => {
        tagsError.value = getErrorMessage(cause)
      })
      .finally(() => {
        tagsLoading.value = false
        tagsPromise = null
      })

    return tagsPromise
  }

  function invalidateTags(): void {
    allTags.value = []
  }

  return {
    stats,
    popularTags,
    topMembers,
    allTags,
    overviewLoading,
    overviewError,
    tagsLoading,
    tagsError,
    loadOverview,
    loadTags,
    invalidateTags,
  }
})
