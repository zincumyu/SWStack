import { defineStore } from 'pinia'
import { ref } from 'vue'
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
      notFound.value = cause instanceof Error && cause.message.includes('没有找到')
    } finally {
      if (sequence === requestSequence) {
        loading.value = false
      }
    }
  }

  async function vote(value: -1 | 0 | 1): Promise<void> {
    if (!question.value) {
      return
    }
    const next = question.value.viewerVote === value ? 0 : value
    const result = await questionApi.vote(question.value.id, next)
    if (question.value) {
      question.value.score = result.score
      question.value.viewerVote = result.viewerVote
    }
  }

  async function toggleBookmark(): Promise<boolean> {
    if (!question.value) {
      return false
    }
    const result = await questionApi.bookmark(question.value.id, !question.value.bookmarked)
    if (question.value) {
      question.value.bookmarked = result.bookmarked
    }
    return result.bookmarked
  }

  async function submitAnswer(body: string): Promise<Answer> {
    if (!question.value) {
      throw new Error('问题尚未加载')
    }
    const answer = await questionApi.createAnswer(question.value.id, { body })
    if (question.value) {
      question.value.answersList.push(answer)
      question.value.answerCount = question.value.answersList.length
      question.value.lastActivityAt = answer.createdAt
    }
    return answer
  }

  async function voteAnswer(answerId: number, value: -1 | 0 | 1): Promise<void> {
    if (!question.value) {
      return
    }
    const target = question.value.answersList.find((answer) => answer.id === answerId)
    if (!target) {
      return
    }
    const next = target.viewerVote === value ? 0 : value
    const result = await questionApi.voteAnswer(answerId, next)
    target.score = result.score
    target.viewerVote = result.viewerVote
  }

  function reset(): void {
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
