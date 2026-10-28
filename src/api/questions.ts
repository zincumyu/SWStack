import { request } from './http'
import type {
  Answer,
  BookmarkResult,
  CreateAnswerInput,
  CreateQuestionInput,
  PageResult,
  QuestionDetail,
  QuestionQuery,
  QuestionSummary,
  VoteResult,
} from './types'

export const questionApi = {
  list(query: QuestionQuery) {
    return request<PageResult<QuestionSummary>>({
      url: '/questions',
      params: { ...query },
    })
  },

  get(id: number) {
    return request<QuestionDetail>({ url: `/questions/${id}` })
  },

  vote(id: number, value: -1 | 0 | 1) {
    return request<VoteResult>({
      url: `/questions/${id}/vote`,
      method: 'POST',
      data: { value },
    })
  },

  bookmark(id: number, bookmarked: boolean) {
    return request<BookmarkResult>({
      url: `/questions/${id}/bookmark`,
      method: 'POST',
      data: { bookmarked },
    })
  },

  createAnswer(id: number, input: CreateAnswerInput) {
    return request<Answer>({
      url: `/questions/${id}/answers`,
      method: 'POST',
      data: input,
    })
  },

  voteAnswer(id: number, value: -1 | 0 | 1) {
    return request<VoteResult>({
      url: `/answers/${id}/vote`,
      method: 'POST',
      data: { value },
    })
  },

  create(input: CreateQuestionInput) {
    return request<QuestionSummary>({
      url: '/questions',
      method: 'POST',
      data: input,
    })
  },
}
