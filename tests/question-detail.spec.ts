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
const voteMock = vi.mocked(questionApi.vote)
const createAnswerMock = vi.mocked(questionApi.createAnswer)

function detail(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    score: 10,
    viewerVote: 0,
    bookmarked: false,
    answersList: [],
    answerCount: 0,
    lastActivityAt: '2026-11-19T00:00:00.000Z',
    ...overrides,
  } as never
}

describe('question detail store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getMock.mockReset()
    voteMock.mockReset()
    createAnswerMock.mockReset()
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

  it('invalidates an in-flight detail load on reset', async () => {
    let resolveQuestion: (value: unknown) => void = () => undefined
    getMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveQuestion = resolve
      }) as never,
    )
    const store = useQuestionDetailStore()

    const loading = store.load(1)
    store.reset()
    resolveQuestion(detail(1))
    await loading

    expect(store.question).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('does not apply a vote response to a different question', async () => {
    let resolveVote: (value: unknown) => void = () => undefined
    getMock.mockResolvedValueOnce(detail(1)).mockResolvedValueOnce(detail(2))
    voteMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveVote = resolve
      }) as never,
    )
    const store = useQuestionDetailStore()

    await store.load(1)
    const action = store.vote(1)
    await store.load(2)
    resolveVote({ score: 99, viewerVote: 1 })
    await action

    expect(store.question?.id).toBe(2)
    expect(store.question?.score).toBe(10)
    expect(store.question?.viewerVote).toBe(0)
  })

  it('does not append an answer to a different question', async () => {
    let resolveAnswer: (value: unknown) => void = () => undefined
    getMock.mockResolvedValueOnce(detail(1)).mockResolvedValueOnce(detail(2))
    createAnswerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAnswer = resolve
      }) as never,
    )
    const store = useQuestionDetailStore()

    await store.load(1)
    const action = store.submitAnswer('这是一条足够长的测试回答正文')
    await store.load(2)
    resolveAnswer({
      id: 99,
      createdAt: '2026-11-19T00:00:00.000Z',
    })
    await action

    expect(store.question?.id).toBe(2)
    expect(store.question?.answersList).toEqual([])
    expect(store.question?.answerCount).toBe(0)
  })
})
