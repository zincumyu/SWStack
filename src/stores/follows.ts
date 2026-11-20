import { defineStore } from 'pinia'
import { ref } from 'vue'
import { followApi } from '@/api/follows'
import type { FollowResult, FollowingFeedItem } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useFollowStore = defineStore('follows', () => {
  const userHandles = ref<string[]>([])
  const tagSlugs = ref<string[]>([])
  const statusLoaded = ref(false)
  const statusLoading = ref(false)
  const statusError = ref<string | null>(null)
  const pendingUsers = ref<string[]>([])
  const pendingTags = ref<string[]>([])

  const feedItems = ref<FollowingFeedItem[]>([])
  const feedTotal = ref(0)
  const feedPage = ref(1)
  const feedPageSize = ref(12)
  const feedLoaded = ref(false)
  const feedLoading = ref(false)
  const feedError = ref<string | null>(null)

  let statusPromise: Promise<void> | null = null
  let feedSequence = 0
  let scope = 0

  function isFollowingUser(handle: string): boolean {
    return userHandles.value.includes(handle)
  }

  function isFollowingTag(slug: string): boolean {
    return tagSlugs.value.includes(slug)
  }

  function isPendingUser(handle: string): boolean {
    return pendingUsers.value.includes(handle)
  }

  function isPendingTag(slug: string): boolean {
    return pendingTags.value.includes(slug)
  }

  function loadStatus(force = false): Promise<void> {
    if (statusPromise) {
      return statusPromise
    }
    if (statusLoaded.value && !force) {
      return Promise.resolve()
    }

    const currentScope = scope
    statusLoading.value = true
    statusError.value = null
    let request: Promise<void> | null = null
    request = followApi
      .status()
      .then((result) => {
        if (currentScope !== scope) {
          return
        }
        userHandles.value = result.users
        tagSlugs.value = result.tags
        statusLoaded.value = true
      })
      .catch((cause) => {
        if (currentScope === scope) {
          statusError.value = getErrorMessage(cause)
        }
      })
      .finally(() => {
        if (currentScope !== scope) {
          return
        }
        statusLoading.value = false
        if (statusPromise === request) {
          statusPromise = null
        }
      })
    statusPromise = request

    return statusPromise
  }

  async function toggleUser(handle: string): Promise<FollowResult> {
    if (isPendingUser(handle)) {
      throw new Error('关注操作正在进行')
    }
    const currentScope = scope
    pendingUsers.value = [...pendingUsers.value, handle]
    try {
      const result = await followApi.toggleUser(handle)
      if (currentScope !== scope) {
        return result
      }
      const next = new Set(userHandles.value)
      if (result.following) {
        next.add(handle)
      } else {
        next.delete(handle)
      }
      userHandles.value = [...next]
      if (feedLoaded.value) {
        void loadFeed(1)
      }
      return result
    } finally {
      if (currentScope === scope) {
        pendingUsers.value = pendingUsers.value.filter((item) => item !== handle)
      }
    }
  }

  async function toggleTag(slug: string): Promise<FollowResult> {
    if (isPendingTag(slug)) {
      throw new Error('关注操作正在进行')
    }
    const currentScope = scope
    pendingTags.value = [...pendingTags.value, slug]
    try {
      const result = await followApi.toggleTag(slug)
      if (currentScope !== scope) {
        return result
      }
      const next = new Set(tagSlugs.value)
      if (result.following) {
        next.add(slug)
      } else {
        next.delete(slug)
      }
      tagSlugs.value = [...next]
      if (feedLoaded.value) {
        void loadFeed(1)
      }
      return result
    } finally {
      if (currentScope === scope) {
        pendingTags.value = pendingTags.value.filter((item) => item !== slug)
      }
    }
  }

  async function loadFeed(page = 1): Promise<void> {
    const sequence = ++feedSequence
    feedLoading.value = true
    feedError.value = null

    try {
      const result = await followApi.feed({
        page,
        pageSize: feedPageSize.value,
      })
      if (sequence !== feedSequence) {
        return
      }
      feedItems.value = result.items
      feedTotal.value = result.total
      feedPage.value = result.page
      feedPageSize.value = result.pageSize
      feedLoaded.value = true
    } catch (cause) {
      if (sequence === feedSequence) {
        feedError.value = getErrorMessage(cause)
      }
    } finally {
      if (sequence === feedSequence) {
        feedLoading.value = false
      }
    }
  }

  function reset(): void {
    scope += 1
    statusPromise = null
    userHandles.value = []
    tagSlugs.value = []
    statusLoaded.value = false
    statusLoading.value = false
    statusError.value = null
    pendingUsers.value = []
    pendingTags.value = []
    feedSequence += 1
    feedItems.value = []
    feedTotal.value = 0
    feedPage.value = 1
    feedLoaded.value = false
    feedLoading.value = false
    feedError.value = null
  }

  return {
    userHandles,
    tagSlugs,
    statusLoaded,
    statusLoading,
    statusError,
    pendingUsers,
    pendingTags,
    feedItems,
    feedTotal,
    feedPage,
    feedPageSize,
    feedLoaded,
    feedLoading,
    feedError,
    isFollowingUser,
    isFollowingTag,
    isPendingUser,
    isPendingTag,
    loadStatus,
    toggleUser,
    toggleTag,
    loadFeed,
    reset,
  }
})
