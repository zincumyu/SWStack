import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/api/errors'
import { questionApi } from '@/api/questions'
import type { Answer, QuestionDetail } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useQuestionDetailStore = defineStore('question-detail', () => {
  const question = ref<QuestionDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notFound = ref(false)
  let requestSequence = 0

  async function load(id: number): Promise<void> {
    const sequence = ++requestSequence
    loading.value = true
    error.value = null
    notFound.value = false
    question.value = null

    try {
      const result = await questionApi.get(id)
      if (sequence === requestSequence) {
        question.value = result
      }
    } catch (cause) {
      if (sequence !== requestSequence) {
        return
      }
      error.value = getErrorMessage(cause)
      notFound.value = cause instanceof ApiError && cause.status === 404
    } finally {
      if (sequence === requestSequence) {
        loading.value = false
      }
    }
  }

  async function vote(value: -1 | 0 | 1): Promise<void> {
    const current = question.value
    if (!current) {
      return
    }
    const questionId = current.id
    const next = current.viewerVote === value ? 0 : value
    const result = await questionApi.vote(questionId, next)
    if (question.value?.id !== questionId) {
      return
    }
    question.value.score = result.score
    question.value.viewerVote = result.viewerVote
  }

  async function toggleBookmark(): Promise<boolean> {
    const current = question.value
    if (!current) {
      return false
    }
    const questionId = current.id
    const result = await questionApi.bookmark(questionId, !current.bookmarked)
    if (question.value?.id !== questionId) {
      return result.bookmarked
    }
    question.value.bookmarked = result.bookmarked
    return result.bookmarked
  }

  async function submitAnswer(body: string): Promise<Answer> {
    const current = question.value
    if (!current) {
      throw new Error('问题尚未加载')
    }
    const questionId = current.id
    const answer = await questionApi.createAnswer(questionId, { body })
    if (question.value?.id === questionId) {
      question.value.answersList.push(answer)
      question.value.answerCount = question.value.answersList.length
      question.value.lastActivityAt = answer.createdAt
    }
    return answer
  }

  async function voteAnswer(answerId: number, value: -1 | 0 | 1): Promise<void> {
    const current = question.value
    if (!current) {
      return
    }
    const questionId = current.id
    const target = current.answersList.find((answer) => answer.id === answerId)
    if (!target) {
      return
    }
    const next = target.viewerVote === value ? 0 : value
    const result = await questionApi.voteAnswer(answerId, next)
    const latest = question.value
    if (latest?.id !== questionId) {
      return
    }
    const latestTarget = latest.answersList.find((answer) => answer.id === answerId)
    if (latestTarget) {
      latestTarget.score = result.score
      latestTarget.viewerVote = result.viewerVote
    }
  }

  function reset(): void {
    requestSequence += 1
    question.value = null
    loading.value = false
    error.value = null
    notFound.value = false
  }

  return {
    question,
    loading,
    error,
    notFound,
    load,
    vote,
    toggleBookmark,
    submitAnswer,
    voteAnswer,
    reset,
  }
})
