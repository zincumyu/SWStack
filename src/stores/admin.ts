import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi } from '@/api/admin'
import type {
  AdminOverview,
  AdminProject,
  AdminProjectDetail,
  AdminProjectPatch,
  AdminProjectQuery,
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
import { useProjectStore } from '@/stores/projects'
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

  const projects = ref<AdminProject[]>([])
  const projectTotal = ref(0)
  const projectsLoading = ref(false)
  const projectsError = ref<string | null>(null)
  const projectBusyId = ref<number | null>(null)
  const projectBoardEnabled = ref(false)
  const projectBoardLoaded = ref(false)
  const projectBoardSaving = ref(false)
  const lastProjectQuery = ref<AdminProjectQuery | null>(null)
  let projectSequence = 0

  const reviewTarget = ref<AdminProjectDetail | null>(null)
  const reviewLoading = ref(false)
  const reviewError = ref<string | null>(null)
  let reviewSequence = 0

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

  async function loadProjects(query: AdminProjectQuery): Promise<void> {
    const sequence = ++projectSequence
    lastProjectQuery.value = { ...query }
    projectsLoading.value = true
    projectsError.value = null

    try {
      const result = await adminApi.projects(query)
      if (sequence !== projectSequence) {
        return
      }
      projects.value = result.items
      projectTotal.value = result.total
      projectBoardEnabled.value = result.boardEnabled
      projectBoardLoaded.value = true
      useProjectStore().setBoardEnabled(result.boardEnabled)
    } catch (cause) {
      if (sequence !== projectSequence) {
        return
      }
      projects.value = []
      projectTotal.value = 0
      projectsError.value = getErrorMessage(cause)
    } finally {
      if (sequence === projectSequence) {
        projectsLoading.value = false
      }
    }
  }

  function invalidateProjects(): void {
    projectSequence += 1
    projects.value = []
    projectTotal.value = 0
    projectsError.value = null
    projectsLoading.value = false
    overview.value = null
    reviewSequence += 1
    reviewTarget.value = null
    reviewLoading.value = false
    reviewError.value = null
  }

  async function loadReviewProject(id: number, force = false): Promise<void> {
    if (reviewTarget.value?.id === id && !force) {
      return
    }
    const sequence = ++reviewSequence
    reviewLoading.value = true
    reviewError.value = null
    reviewTarget.value = null

    try {
      const result = await adminApi.project(id)
      if (sequence !== reviewSequence) {
        return
      }
      reviewTarget.value = result
    } catch (cause) {
      if (sequence !== reviewSequence) {
        return
      }
      reviewError.value = getErrorMessage(cause)
    } finally {
      if (sequence === reviewSequence) {
        reviewLoading.value = false
      }
    }
  }

  async function updateProject(
    id: number,
    patch: AdminProjectPatch,
  ): Promise<AdminProject> {
    projectBusyId.value = id
    try {
      const updated = await adminApi.updateProject(id, patch)
      const query = lastProjectQuery.value
      const visibilityMatches =
        !query?.visibility ||
        query.visibility === 'all' ||
        query.visibility === updated.visibility
      const reviewMatches =
        !query?.review ||
        query.review === 'all' ||
        query.review === updated.reviewStatus
      const needMatches =
        !query?.need || query.need === 'all' || updated.needs.includes(query.need)

      if (visibilityMatches && reviewMatches && needMatches) {
        const index = projects.value.findIndex((item) => item.id === id)
        if (index !== -1) {
          projects.value[index] = updated
        }
      } else {
        projects.value = projects.value.filter((item) => item.id !== id)
        projectTotal.value = Math.max(0, projectTotal.value - 1)
      }
      if (reviewTarget.value?.id === id) {
        reviewTarget.value = { ...reviewTarget.value, ...updated }
      }
      overview.value = null
      useProjectStore().invalidateAll()
      return updated
    } finally {
      projectBusyId.value = null
    }
  }

  async function deleteProject(id: number): Promise<void> {
    projectBusyId.value = id
    try {
      await adminApi.deleteProject(id)
      projects.value = projects.value.filter((item) => item.id !== id)
      projectTotal.value = Math.max(0, projectTotal.value - 1)
      if (reviewTarget.value?.id === id) {
        reviewTarget.value = null
      }
      overview.value = null
      useProjectStore().invalidateAll()
    } finally {
      projectBusyId.value = null
    }
  }

  async function updateProjectBoard(enabled: boolean): Promise<boolean> {
    projectBoardSaving.value = true
    try {
      const result = await adminApi.updateProjectBoard(enabled)
      projectBoardEnabled.value = result.enabled
      projectBoardLoaded.value = true
      overview.value = null
      const projectStore = useProjectStore()
      projectStore.setBoardEnabled(result.enabled)
      projectStore.invalidateAll()
      return result.enabled
    } finally {
      projectBoardSaving.value = false
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
    projects,
    projectTotal,
    projectsLoading,
    projectsError,
    projectBusyId,
    projectBoardEnabled,
    projectBoardLoaded,
    projectBoardSaving,
    reviewTarget,
    reviewLoading,
    reviewError,
    loadOverview,
    loadQuestions,
    updateQuestion,
    deleteQuestion,
    loadUsers,
    updateUser,
    loadTags,
    createTag,
    updateTag,
    loadProjects,
    loadReviewProject,
    updateProject,
    deleteProject,
    updateProjectBoard,
    invalidateProjects,
  }
})
