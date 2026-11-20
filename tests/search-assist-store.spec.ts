import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/errors'
import { useSearchAssistStore } from '@/stores/search-assist'
import type { TrendingSearchTerm } from '@/api/types'

vi.mock('@/api/search', () => ({
  searchApi: {
    search: vi.fn(),
    suggest: vi.fn(),
    trending: vi.fn(),
  },
}))

const { searchApi } = await import('@/api/search')
const trendingMock = vi.mocked(searchApi.trending)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const trendingTerms: TrendingSearchTerm[] = [
  { keyword: 'javascript', count: 126 },
  { keyword: 'typescript', count: 98 },
]

describe('search assist store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    trendingMock.mockReset()
  })

  it('loads trending terms once and caches the result', async () => {
    trendingMock.mockResolvedValueOnce(trendingTerms)
    const store = useSearchAssistStore()

    await store.loadTrending()

    expect(store.trendingLoading).toBe(false)
    expect(store.trendingError).toBeNull()
    expect(store.trending).toEqual(trendingTerms)

    await store.loadTrending()
    expect(trendingMock).toHaveBeenCalledTimes(1)
  })

  it('exposes loading state while the trending request is in flight', async () => {
    const pending = deferred<TrendingSearchTerm[]>()
    trendingMock.mockReturnValueOnce(pending.promise)
    const store = useSearchAssistStore()

    const action = store.loadTrending()
    expect(store.trendingLoading).toBe(true)
    expect(store.trendingError).toBeNull()

    pending.resolve(trendingTerms)
    await action

    expect(store.trendingLoading).toBe(false)
    expect(store.trending).toEqual(trendingTerms)
  })

  it('deduplicates concurrent trending requests, including forced reloads', async () => {
    const pending = deferred<TrendingSearchTerm[]>()
    trendingMock.mockReturnValueOnce(pending.promise)
    const store = useSearchAssistStore()

    const first = store.loadTrending()
    const second = store.loadTrending()
    const forced = store.loadTrending(true)

    expect(trendingMock).toHaveBeenCalledTimes(1)
    expect(store.trendingLoading).toBe(true)

    pending.resolve(trendingTerms)
    await Promise.all([first, second, forced])

    expect(store.trending).toEqual(trendingTerms)
    expect(store.trendingLoading).toBe(false)
  })

  it('bypasses the cache when force loading', async () => {
    trendingMock.mockResolvedValueOnce(trendingTerms)
    trendingMock.mockResolvedValueOnce([{ keyword: 'vue3', count: 84 }])
    const store = useSearchAssistStore()

    await store.loadTrending()
    await store.loadTrending(true)

    expect(trendingMock).toHaveBeenCalledTimes(2)
    expect(store.trending).toEqual([{ keyword: 'vue3', count: 84 }])
  })

  it('records the error and stays retryable after a failed load', async () => {
    trendingMock.mockRejectedValueOnce(new ApiError('热门搜索加载失败', 503))
    const store = useSearchAssistStore()

    await store.loadTrending()

    expect(store.trendingError).toBe('热门搜索加载失败')
    expect(store.trendingLoading).toBe(false)
    expect(store.trending).toEqual([])

    trendingMock.mockResolvedValueOnce(trendingTerms)
    await store.loadTrending()

    expect(store.trendingError).toBeNull()
    expect(store.trending).toEqual(trendingTerms)
    expect(trendingMock).toHaveBeenCalledTimes(2)
  })

  it('clears trending state on reset and reloads afterwards', async () => {
    trendingMock.mockResolvedValueOnce(trendingTerms)
    const store = useSearchAssistStore()
    await store.loadTrending()

    store.reset()

    expect(store.trending).toEqual([])
    expect(store.trendingLoading).toBe(false)
    expect(store.trendingError).toBeNull()

    trendingMock.mockResolvedValueOnce([{ keyword: 'vue3', count: 84 }])
    await store.loadTrending()

    expect(trendingMock).toHaveBeenCalledTimes(2)
    expect(store.trending).toEqual([{ keyword: 'vue3', count: 84 }])
  })
})
