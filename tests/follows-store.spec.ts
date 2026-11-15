import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/errors'
import { useFollowStore } from '@/stores/follows'
import type { FollowResult, FollowStatus, FollowingFeedItem, PageResult } from '@/api/types'

vi.mock('@/api/follows', () => ({
  followApi: {
    status: vi.fn(),
    toggleUser: vi.fn(),
    toggleTag: vi.fn(),
    feed: vi.fn(),
  },
}))

const { followApi } = await import('@/api/follows')
const statusMock = vi.mocked(followApi.status)
const toggleUserMock = vi.mocked(followApi.toggleUser)
const toggleTagMock = vi.mocked(followApi.toggleTag)
const feedMock = vi.mocked(followApi.feed)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function feedItem(id: string): FollowingFeedItem {
  return {
    id,
    type: 'question',
    createdAt: '2026-01-01T00:00:00.000Z',
    question: { id: 1 },
  } as unknown as FollowingFeedItem
}

function pageResult(
  items: FollowingFeedItem[],
  overrides: Partial<PageResult<FollowingFeedItem>> = {},
): PageResult<FollowingFeedItem> {
  return { items, total: items.length, page: 1, pageSize: 12, ...overrides }
}

describe('follow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    statusMock.mockReset()
    toggleUserMock.mockReset()
    toggleTagMock.mockReset()
    feedMock.mockReset()
  })

  it('loads the follow status once and caches it', async () => {
    statusMock.mockResolvedValueOnce({ users: ['zhouqi'], tags: ['vue3'] })
    const store = useFollowStore()

    await store.loadStatus()

    expect(store.statusLoading).toBe(false)
    expect(store.statusError).toBeNull()
    expect(store.statusLoaded).toBe(true)
    expect(store.userHandles).toEqual(['zhouqi'])
    expect(store.tagSlugs).toEqual(['vue3'])

    await store.loadStatus()
    expect(statusMock).toHaveBeenCalledTimes(1)
  })

  it('bypasses the cache when loading with force', async () => {
    statusMock.mockResolvedValueOnce({ users: ['zhouqi'], tags: [] })
    statusMock.mockResolvedValueOnce({ users: ['hejia'], tags: ['docker'] })
    const store = useFollowStore()

    await store.loadStatus()
    await store.loadStatus(true)

    expect(statusMock).toHaveBeenCalledTimes(2)
    expect(store.userHandles).toEqual(['hejia'])
    expect(store.tagSlugs).toEqual(['docker'])
  })

  it('deduplicates concurrent status loads', async () => {
    const pending = deferred<FollowStatus>()
    statusMock.mockReturnValueOnce(pending.promise)
    const store = useFollowStore()

    const first = store.loadStatus()
    const second = store.loadStatus()

    expect(store.statusLoading).toBe(true)
    expect(statusMock).toHaveBeenCalledTimes(1)

    pending.resolve({ users: ['luxing'], tags: ['fastapi'] })
    await Promise.all([first, second])

    expect(store.statusLoaded).toBe(true)
    expect(store.statusLoading).toBe(false)
    expect(store.userHandles).toEqual(['luxing'])
  })

  it('keeps the status retryable after a load failure', async () => {
    statusMock.mockRejectedValueOnce(new ApiError('关注状态加载失败', 503))
    const store = useFollowStore()

    await store.loadStatus()

    expect(store.statusError).toBe('关注状态加载失败')
    expect(store.statusLoaded).toBe(false)
    expect(store.statusLoading).toBe(false)
    expect(store.userHandles).toEqual([])

    statusMock.mockResolvedValueOnce({ users: ['zhouqi'], tags: [] })
    await store.loadStatus()

    expect(store.statusError).toBeNull()
    expect(store.statusLoaded).toBe(true)
    expect(statusMock).toHaveBeenCalledTimes(2)
  })

  it('marks a user as pending while following and applies the result', async () => {
    const pending = deferred<FollowResult>()
    toggleUserMock.mockReturnValueOnce(pending.promise)
    const store = useFollowStore()

    const action = store.toggleUser('zhouqi')

    expect(store.isPendingUser('zhouqi')).toBe(true)
    expect(store.pendingUsers).toEqual(['zhouqi'])
    await expect(store.toggleUser('zhouqi')).rejects.toThrow('关注操作正在进行')

    pending.resolve({ following: true, followerCount: 1421 })
    await expect(action).resolves.toEqual({ following: true, followerCount: 1421 })

    expect(store.isFollowingUser('zhouqi')).toBe(true)
    expect(store.userHandles).toEqual(['zhouqi'])
    expect(store.pendingUsers).toEqual([])
  })

  it('unfollows a user and reflects the API result', async () => {
    statusMock.mockResolvedValueOnce({ users: ['hejia', 'zhouqi'], tags: [] })
    toggleUserMock.mockResolvedValueOnce({ following: false, followerCount: 1419 })
    const store = useFollowStore()
    await store.loadStatus()

    await store.toggleUser('zhouqi')

    expect(store.isFollowingUser('zhouqi')).toBe(false)
    expect(store.userHandles).toEqual(['hejia'])
  })

  it('rolls back user state and clears pending when the request fails', async () => {
    statusMock.mockResolvedValueOnce({ users: ['zhouqi'], tags: [] })
    toggleUserMock.mockRejectedValueOnce(new ApiError('网络错误', 500))
    const store = useFollowStore()
    await store.loadStatus()

    await expect(store.toggleUser('zhouqi')).rejects.toThrow('网络错误')

    expect(store.userHandles).toEqual(['zhouqi'])
    expect(store.isPendingUser('zhouqi')).toBe(false)

    toggleUserMock.mockRejectedValueOnce(new ApiError('网络错误', 500))
    await expect(store.toggleUser('hejia')).rejects.toThrow('网络错误')
    expect(store.isFollowingUser('hejia')).toBe(false)
  })

  it('marks a tag as pending and applies follow and unfollow results', async () => {
    const pending = deferred<FollowResult>()
    toggleTagMock.mockReturnValueOnce(pending.promise)
    const store = useFollowStore()

    const action = store.toggleTag('vue3')

    expect(store.isPendingTag('vue3')).toBe(true)
    await expect(store.toggleTag('vue3')).rejects.toThrow('关注操作正在进行')

    pending.resolve({ following: true, followerCount: 3241 })
    await action
    expect(store.isFollowingTag('vue3')).toBe(true)
    expect(store.tagSlugs).toEqual(['vue3'])

    toggleTagMock.mockResolvedValueOnce({ following: false, followerCount: 3240 })
    await store.toggleTag('vue3')

    expect(store.isFollowingTag('vue3')).toBe(false)
    expect(store.tagSlugs).toEqual([])
    expect(store.pendingTags).toEqual([])
  })

  it('keeps tag state unchanged and clears pending when following fails', async () => {
    statusMock.mockResolvedValueOnce({ users: [], tags: ['vue3'] })
    toggleTagMock.mockRejectedValueOnce(new ApiError('标签关注失败', 500))
    const store = useFollowStore()
    await store.loadStatus()

    await expect(store.toggleTag('vue3')).rejects.toThrow('标签关注失败')

    expect(store.tagSlugs).toEqual(['vue3'])
    expect(store.isPendingTag('vue3')).toBe(false)
  })

  it('loads feed pages and records pagination metadata', async () => {
    feedMock.mockResolvedValueOnce(
      pageResult([feedItem('question-1')], { total: 5, page: 1, pageSize: 2 }),
    )
    const store = useFollowStore()

    await store.loadFeed(1)

    expect(store.feedLoading).toBe(false)
    expect(store.feedError).toBeNull()
    expect(store.feedLoaded).toBe(true)
    expect(store.feedItems).toEqual([feedItem('question-1')])
    expect(store.feedTotal).toBe(5)
    expect(store.feedPage).toBe(1)
    expect(store.feedPageSize).toBe(2)

    feedMock.mockResolvedValueOnce(
      pageResult([feedItem('question-3')], { total: 5, page: 2, pageSize: 2 }),
    )
    await store.loadFeed(2)

    expect(feedMock).toHaveBeenLastCalledWith({ page: 2, pageSize: 2 })
    expect(store.feedPage).toBe(2)
    expect(store.feedItems).toEqual([feedItem('question-3')])
  })

  it('stores a feed error without marking the feed as loaded', async () => {
    feedMock.mockRejectedValueOnce(new ApiError('关注动态加载失败', 503))
    const store = useFollowStore()

    await store.loadFeed()

    expect(store.feedError).toBe('关注动态加载失败')
    expect(store.feedLoading).toBe(false)
    expect(store.feedLoaded).toBe(false)
    expect(store.feedItems).toEqual([])
  })

  it('ignores a stale feed response that resolves after a newer request', async () => {
    const stale = deferred<PageResult<FollowingFeedItem>>()
    feedMock.mockReturnValueOnce(stale.promise)
    feedMock.mockResolvedValueOnce(
      pageResult([feedItem('question-2')], { total: 2, page: 2, pageSize: 1 }),
    )
    const store = useFollowStore()

    const first = store.loadFeed(1)
    await store.loadFeed(2)

    stale.resolve(pageResult([feedItem('question-1')], { total: 2, page: 1, pageSize: 1 }))
    await first

    expect(store.feedItems).toEqual([feedItem('question-2')])
    expect(store.feedPage).toBe(2)
    expect(store.feedLoading).toBe(false)
  })

  it('reloads the first feed page after a successful follow toggle', async () => {
    feedMock.mockResolvedValueOnce(pageResult([feedItem('question-1')]))
    const store = useFollowStore()
    await store.loadFeed()

    toggleUserMock.mockResolvedValueOnce({ following: true, followerCount: 1 })
    feedMock.mockResolvedValueOnce(pageResult([feedItem('question-2')]))
    await store.toggleUser('zhouqi')

    expect(feedMock).toHaveBeenCalledTimes(2)
    expect(feedMock).toHaveBeenLastCalledWith({ page: 1, pageSize: 12 })
  })

  it('ignores an in-flight feed response after reset', async () => {
    const pending = deferred<PageResult<FollowingFeedItem>>()
    feedMock.mockReturnValueOnce(pending.promise)
    const store = useFollowStore()

    const loading = store.loadFeed()
    store.reset()
    pending.resolve(pageResult([feedItem('question-1')]))
    await loading

    expect(store.feedItems).toEqual([])
    expect(store.feedLoading).toBe(false)
    expect(store.feedLoaded).toBe(false)
  })

  it('resets all follow and feed state', async () => {
    statusMock.mockResolvedValueOnce({ users: ['zhouqi'], tags: ['vue3'] })
    feedMock.mockResolvedValueOnce(
      pageResult([feedItem('question-1')], { total: 3, page: 1, pageSize: 12 }),
    )
    const store = useFollowStore()
    await store.loadStatus()
    await store.loadFeed()

    store.reset()

    expect(store.userHandles).toEqual([])
    expect(store.tagSlugs).toEqual([])
    expect(store.statusLoaded).toBe(false)
    expect(store.statusLoading).toBe(false)
    expect(store.statusError).toBeNull()
    expect(store.pendingUsers).toEqual([])
    expect(store.pendingTags).toEqual([])
    expect(store.feedItems).toEqual([])
    expect(store.feedTotal).toBe(0)
    expect(store.feedPage).toBe(1)
    expect(store.feedLoaded).toBe(false)
    expect(store.feedLoading).toBe(false)
    expect(store.feedError).toBeNull()
  })
})
