import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/errors'
import { useNotificationStore } from '@/stores/notifications'
import type { NotificationItem } from '@/api/types'

vi.mock('@/api/notifications', () => ({
  notificationApi: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

const { notificationApi } = await import('@/api/notifications')
const listMock = vi.mocked(notificationApi.list)
const unreadMock = vi.mocked(notificationApi.unreadCount)
const markReadMock = vi.mocked(notificationApi.markRead)
const markAllMock = vi.mocked(notificationApi.markAllRead)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function notification(id: number, read = false): NotificationItem {
  return {
    id,
    type: 'question_answered',
    title: '测试通知',
    body: '通知正文',
    read,
    createdAt: '2026-11-19T00:00:00.000Z',
    link: '/questions/101',
  }
}

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    listMock.mockReset()
    unreadMock.mockReset()
    markReadMock.mockReset()
    markAllMock.mockReset()
  })

  it('keeps a successful list when the unread count request fails', async () => {
    listMock.mockResolvedValueOnce({
      items: [notification(1)],
      total: 1,
      page: 1,
      pageSize: 10,
    })
    unreadMock.mockRejectedValueOnce(new ApiError('未读数加载失败', 503))
    const store = useNotificationStore()

    await store.load()

    expect(store.items).toEqual([notification(1)])
    expect(store.total).toBe(1)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('ignores an unread refresh that resolves after clear', async () => {
    const pending = deferred<{ unread: number }>()
    unreadMock.mockReturnValueOnce(pending.promise)
    const store = useNotificationStore()
    store.unread = 4

    const action = store.refreshUnread()
    store.clear()
    pending.resolve({ unread: 9 })
    await action

    expect(store.unread).toBe(0)
  })

  it('ignores mark-read state changes after the account scope is cleared', async () => {
    listMock.mockResolvedValueOnce({
      items: [notification(1)],
      total: 1,
      page: 1,
      pageSize: 10,
    })
    unreadMock.mockResolvedValueOnce({ unread: 1 })
    const pending = deferred<NotificationItem>()
    markReadMock.mockReturnValueOnce(pending.promise)
    const store = useNotificationStore()
    await store.load()

    const action = store.markRead(1)
    store.clear()
    pending.resolve(notification(1, true))
    await action

    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
    expect(store.unread).toBe(0)
    expect(store.markingId).toBeNull()
  })

  it('does not apply mark-all results to a newly scoped account', async () => {
    const pending = deferred<{ updated: number }>()
    markAllMock.mockReturnValueOnce(pending.promise)
    const store = useNotificationStore()
    store.items = [notification(1)]
    store.total = 1
    store.unread = 1

    const action = store.markAllRead()
    store.clear()
    pending.resolve({ updated: 1 })
    await action

    expect(store.items).toEqual([])
    expect(store.total).toBe(0)
    expect(store.unread).toBe(0)
    expect(store.markingAll).toBe(false)
  })
})
