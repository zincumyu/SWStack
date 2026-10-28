import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi } from '@/api/admin'
import type {
  AdminOverview,
  AdminQuestion,
  AdminQuestionPatch,
  AdminQuestionQuery,
  AdminTag,
  AdminTagInput,
  AdminTagPatch,
  AdminUser,
  AdminUserPatch,
  AdminUserQuery,
} from '@/api/types'
import { getErrorMessage } from '@/utils/errors'
import { useCommunityStore } from '@/stores/community'
import { useUserDirectoryStore } from '@/stores/users'

export const useAdminStore = defineStore('admin', () => {
  const overview = ref<AdminOverview | null>(null)
  const overviewLoading = ref(false)
  const overviewError = ref<string | null>(null)
  let overviewPromise: Promise<void> | null = null

  const questions = ref<AdminQuestion[]>([])
  const questionTotal = ref(0)
  const questionsLoading = ref(false)
  const questionsError = ref<string | null>(null)
  const questionBusyId = ref<number | null>(null)
  const lastQuestionQuery = ref<AdminQuestionQuery | null>(null)
  let questionSequence = 0

  const users = ref<AdminUser[]>([])
  const userTotal = ref(0)
  const usersLoading = ref(false)
  const usersError = ref<string | null>(null)
  const userBusyId = ref<number | null>(null)
  const lastUserQuery = ref<AdminUserQuery | null>(null)
  let userSequence = 0

  const tags = ref<AdminTag[]>([])
  const tagsLoading = ref(false)
  const tagsError = ref<string | null>(null)
  const tagBusySlug = ref<string | null>(null)
  let tagsPromise: Promise<void> | null = null

  function loadOverview(force = false): Promise<void> {
    if (overviewPromise) {
      return overviewPromise
    }
    if (overview.value && !force) {
      return Promise.resolve()
    }

    overviewLoading.value = true
    overviewError.value = null
    overviewPromise = adminApi
      .overview()
      .then((result) => {
        overview.value = result
      })
      .catch((cause) => {
        overviewError.value = getErrorMessage(cause)
      })
      .finally(() => {
        overviewLoading.value = false
        overviewPromise = null
      })

    return overviewPromise
  }

  async function loadQuestions(query: AdminQuestionQuery): Promise<void> {
    const sequence = ++questionSequence
    lastQuestionQuery.value = { ...query }
    questionsLoading.value = true
    questionsError.value = null

    try {
      const result = await adminApi.questions(query)
      if (sequence !== questionSequence) {
        return
      }
      questions.value = result.items
      questionTotal.value = result.total
    } catch (cause) {
      if (sequence !== questionSequence) {
        return
      }
      questions.value = []
      questionTotal.value = 0
      questionsError.value = getErrorMessage(cause)
    } finally {
      if (sequence === questionSequence) {
        questionsLoading.value = false
      }
    }
  }

  async function updateQuestion(
    id: number,
    patch: AdminQuestionPatch,
  ): Promise<AdminQuestion> {
    questionBusyId.value = id
    try {
      const updated = await adminApi.updateQuestion(id, patch)
      const query = lastQuestionQuery.value
      const statusFilter = query?.status
      const stillMatches =
        !statusFilter ||
        statusFilter === 'all' ||
        statusFilter === 'unanswered' ||
        statusFilter === updated.status

      if (stillMatches) {
        const index = questions.value.findIndex((item) => item.id === id)
        if (index !== -1) {
          questions.value[index] = updated
        }
      } else {
        questions.value = questions.value.filter((item) => item.id !== id)
        questionTotal.value = Math.max(0, questionTotal.value - 1)
      }
      overview.value = null
      return updated
    } finally {
      questionBusyId.value = null
    }
  }

  async function deleteQuestion(id: number): Promise<void> {
    questionBusyId.value = id
    try {
      await adminApi.deleteQuestion(id)
      questions.value = questions.value.filter((item) => item.id !== id)
      questionTotal.value = Math.max(0, questionTotal.value - 1)
      overview.value = null
    } finally {
      questionBusyId.value = null
    }
  }

  async function loadUsers(query: AdminUserQuery): Promise<void> {
    const sequence = ++userSequence
    lastUserQuery.value = { ...query }
    usersLoading.value = true
    usersError.value = null

    try {
      const result = await adminApi.users(query)
      if (sequence !== userSequence) {
        return
      }
      users.value = result.items
      userTotal.value = result.total
    } catch (cause) {
      if (sequence !== userSequence) {
        return
      }
      users.value = []
      userTotal.value = 0
      usersError.value = getErrorMessage(cause)
    } finally {
      if (sequence === userSequence) {
        usersLoading.value = false
      }
    }
  }

  async function updateUser(id: number, patch: AdminUserPatch): Promise<AdminUser> {
    userBusyId.value = id
    try {
      const updated = await adminApi.updateUser(id, patch)
      const query = lastUserQuery.value
      const roleMatches =
        !query?.role || query.role === 'all' || query.role === updated.role
      const statusMatches =
        !query?.status || query.status === 'all' || query.status === updated.status

      if (roleMatches && statusMatches) {
        const index = users.value.findIndex((item) => item.id === id)
        if (index !== -1) {
          users.value[index] = updated
        }
      } else {
        users.value = users.value.filter((item) => item.id !== id)
        userTotal.value = Math.max(0, userTotal.value - 1)
      }
      overview.value = null
      useUserDirectoryStore().invalidateMembers()
      void useCommunityStore().loadOverview(true)
      return updated
    } finally {
      userBusyId.value = null
    }
  }

  function loadTags(force = false): Promise<void> {
    if (tagsPromise) {
      return tagsPromise
    }
    if (tags.value.length > 0 && !force) {
      return Promise.resolve()
    }

    tagsLoading.value = true
    tagsError.value = null
    tagsPromise = adminApi
      .tags()
      .then((result) => {
        tags.value = result
      })
      .catch((cause) => {
        tagsError.value = getErrorMessage(cause)
      })
      .finally(() => {
        tagsLoading.value = false
        tagsPromise = null
      })

    return tagsPromise
  }

  async function createTag(input: AdminTagInput): Promise<AdminTag> {
    const created = await adminApi.createTag(input)
    tags.value = [...tags.value, created].sort(
      (a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name),
    )
    overview.value = null
    const communityStore = useCommunityStore()
    communityStore.invalidateTags()
    void communityStore.loadOverview(true)
    return created
  }

  async function updateTag(slug: string, patch: AdminTagPatch): Promise<AdminTag> {
    tagBusySlug.value = slug
    try {
      const updated = await adminApi.updateTag(slug, patch)
      const index = tags.value.findIndex((item) => item.slug === slug)
      if (index !== -1) {
        tags.value[index] = updated
      }
      overview.value = null
      const communityStore = useCommunityStore()
      communityStore.invalidateTags()
      void communityStore.loadOverview(true)
      return updated
    } finally {
      tagBusySlug.value = null
    }
  }

  return {
    overview,
    overviewLoading,
    overviewError,
    questions,
    questionTotal,
    questionsLoading,
    questionsError,
    questionBusyId,
    users,
    userTotal,
    usersLoading,
    usersError,
    userBusyId,
    tags,
    tagsLoading,
    tagsError,
    tagBusySlug,
    loadOverview,
    loadQuestions,
    updateQuestion,
    deleteQuestion,
    loadUsers,
    updateUser,
    loadTags,
    createTag,
    updateTag,
  }
})
