import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/errors'
import { useQuestionDetailStore } from '@/stores/question-detail'

vi.mock('@/api/questions', () => ({
  questionApi: {
    get: vi.fn(),
    vote: vi.fn(),
    bookmark: vi.fn(),
    createAnswer: vi.fn(),
    voteAnswer: vi.fn(),
  },
}))

const { questionApi } = await import('@/api/questions')
const getMock = vi.mocked(questionApi.get)

describe('question detail store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('flags notFound from the API status, not the message text', async () => {
    getMock.mockRejectedValueOnce(new ApiError('记录不存在', 404))
    const store = useQuestionDetailStore()

    await store.load(42)

    expect(store.notFound).toBe(true)
    expect(store.error).toBe('记录不存在')
    expect(store.loading).toBe(false)
  })

  it('does not confuse other failures with a 404', async () => {
    getMock.mockRejectedValueOnce(new ApiError('没有找到服务器, 请重试', 500))
    const store = useQuestionDetailStore()

    await store.load(42)

    expect(store.notFound).toBe(false)
  })

  it('ignores a stale response that resolves after a newer request', async () => {
    let resolveFirst: (value: unknown) => void = () => undefined
    getMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve
      }) as never,
    )
    getMock.mockResolvedValueOnce({ id: 2, title: 'newer' } as never)
    const store = useQuestionDetailStore()

    const first = store.load(1)
    await store.load(2)
    resolveFirst({ id: 1, title: 'stale' })
    await first

    expect(store.question?.id).toBe(2)
  })
})
