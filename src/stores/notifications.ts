import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationApi } from '@/api/notifications'
import type { NotificationFilter, NotificationItem, NotificationQuery } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<NotificationItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = 10
  const filter = ref<NotificationFilter>('all')
  const unread = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const markingId = ref<number | null>(null)
  const markingAll = ref(false)
  let sequence = 0
  let scope = 0

  async function load(options: { page?: number; filter?: NotificationFilter } = {}): Promise<void> {
    const nextPage = Math.max(1, options.page ?? page.value)
    const nextFilter = options.filter ?? filter.value
    const current = ++sequence
    const currentScope = scope

    page.value = nextPage
    filter.value = nextFilter
    loading.value = true
    error.value = null

    const query: NotificationQuery = {
      page: nextPage,
      pageSize,
      filter: nextFilter,
    }

    try {
      const [listResult, countResult] = await Promise.allSettled([
        notificationApi.list(query),
        notificationApi.unreadCount(),
      ])
      if (current !== sequence || currentScope !== scope) {
        return
      }

      if (listResult.status === 'fulfilled') {
        items.value = listResult.value.items
        total.value = listResult.value.total
      } else {
        items.value = []
        total.value = 0
        error.value = getErrorMessage(listResult.reason)
      }

      if (countResult.status === 'fulfilled') {
        unread.value = countResult.value.unread
      }
    } finally {
      if (current === sequence && currentScope === scope) {
        loading.value = false
      }
    }
  }

  async function refreshUnread(): Promise<void> {
    const currentScope = scope
    try {
      const result = await notificationApi.unreadCount()
      if (currentScope === scope) {
        unread.value = result.unread
      }
    } catch {
      // Keep the previous count if the background refresh fails.
    }
  }

  async function markRead(id: number): Promise<void> {
    const item = items.value.find((entry) => entry.id === id)
    if (!item || item.read) {
      return
    }

    const currentScope = scope
    markingId.value = id
    try {
      const updated = await notificationApi.markRead(id)
      if (currentScope !== scope) {
        return
      }
      if (filter.value === 'unread') {
        items.value = items.value.filter((entry) => entry.id !== id)
        total.value = Math.max(0, total.value - 1)
      } else {
        const index = items.value.findIndex((entry) => entry.id === id)
        if (index !== -1) {
          items.value[index] = updated
        }
      }
      unread.value = Math.max(0, unread.value - 1)

      if (filter.value === 'unread' && items.value.length === 0) {
        const totalPages = Math.max(1, Math.ceil(total.value / pageSize))
        const nextPage = Math.min(page.value, totalPages)
        if (nextPage !== page.value || total.value > 0) {
          await load({ page: nextPage, filter: 'unread' })
        }
      }
    } finally {
      if (currentScope === scope && markingId.value === id) {
        markingId.value = null
      }
    }
  }

  async function markAllRead(): Promise<number> {
    const currentScope = scope
    markingAll.value = true
    try {
      const result = await notificationApi.markAllRead()
      if (currentScope !== scope) {
        return 0
      }
      items.value =
        filter.value === 'unread' ? [] : items.value.map((item) => ({ ...item, read: true }))
      if (filter.value === 'unread') {
        total.value = 0
        page.value = 1
      }
      unread.value = 0
      return result.updated
    } finally {
      if (currentScope === scope) {
        markingAll.value = false
      }
    }
  }

  function clear(): void {
    scope += 1
    sequence += 1
    items.value = []
    total.value = 0
    page.value = 1
    filter.value = 'all'
    unread.value = 0
    loading.value = false
    error.value = null
    markingId.value = null
    markingAll.value = false
  }

  return {
    items,
    total,
    page,
    pageSize,
    filter,
    unread,
    loading,
    error,
    markingId,
    markingAll,
    load,
    refreshUnread,
    markRead,
    markAllRead,
    clear,
  }
})
