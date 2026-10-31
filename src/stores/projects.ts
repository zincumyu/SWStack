import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { projectApi } from '@/api/projects'
import type { ProjectDetail, ProjectQuery, ProjectSummary } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useProjectStore = defineStore('projects', () => {
  const boardEnabled = ref(false)
  const boardLoaded = ref(false)
  const boardLoading = ref(false)
  const boardError = ref<string | null>(null)
  let boardPromise: Promise<void> | null = null

  const projects = ref<ProjectSummary[]>([])
  const total = ref(0)
  const listLoading = ref(false)
  const listError = ref<string | null>(null)
  const lastQuery = ref<ProjectQuery | null>(null)
  let listSequence = 0

  const current = ref<ProjectDetail | null>(null)
  const currentSlug = ref<string | null>(null)
  const detailLoading = ref(false)
  const detailError = ref<string | null>(null)
  let detailSequence = 0

  const isBoardClosed = computed(
    () => boardLoaded.value && !boardEnabled.value && !boardError.value,
  )

  function loadBoard(force = false): Promise<void> {
    if (boardPromise) {
      return boardPromise
    }
    if (boardLoaded.value && !force) {
      return Promise.resolve()
    }

    boardLoading.value = true
    boardError.value = null
    boardPromise = projectApi
      .board()
      .then((result) => {
        boardEnabled.value = result.enabled
        boardLoaded.value = true
      })
      .catch((cause) => {
        boardEnabled.value = false
        boardLoaded.value = true
        boardError.value = getErrorMessage(cause)
      })
      .finally(() => {
        boardLoading.value = false
        boardPromise = null
      })

    return boardPromise
  }

  function setBoardEnabled(enabled: boolean): void {
    boardEnabled.value = enabled
    boardLoaded.value = true
    boardError.value = null
    if (!enabled) {
      clearList()
      clearDetail()
    }
  }

  function clearList(): void {
    listSequence += 1
    projects.value = []
    total.value = 0
    listError.value = null
    listLoading.value = false
  }

  function clearDetail(): void {
    detailSequence += 1
    current.value = null
    currentSlug.value = null
    detailError.value = null
    detailLoading.value = false
  }

  function invalidateProjects(): void {
    clearList()
  }

  function invalidateAll(): void {
    clearList()
    clearDetail()
  }

  async function loadProjects(query: ProjectQuery): Promise<void> {
    const sequence = ++listSequence
    lastQuery.value = { ...query }
    listLoading.value = true
    listError.value = null

    try {
      await loadBoard()
      if (sequence !== listSequence) {
        return
      }
      if (!boardEnabled.value) {
        projects.value = []
        total.value = 0
        if (boardError.value) {
          listError.value = boardError.value
        }
        return
      }

      const result = await projectApi.list(query)
      if (sequence !== listSequence) {
        return
      }
      projects.value = result.items
      total.value = result.total
    } catch (cause) {
      if (sequence !== listSequence) {
        return
      }
      projects.value = []
      total.value = 0
      listError.value = getErrorMessage(cause)
    } finally {
      if (sequence === listSequence) {
        listLoading.value = false
      }
    }
  }

  async function loadProject(slug: string, force = false): Promise<void> {
    if (current.value?.slug === slug && !force) {
      return
    }

    const sequence = ++detailSequence
    currentSlug.value = slug
    detailLoading.value = true
    detailError.value = null
    if (current.value?.slug !== slug) {
      current.value = null
    }

    try {
      await loadBoard()
      if (sequence !== detailSequence) {
        return
      }
      if (!boardEnabled.value) {
        current.value = null
        if (boardError.value) {
          detailError.value = boardError.value
        }
        return
      }

      const result = await projectApi.detail(slug)
      if (sequence !== detailSequence) {
        return
      }
      current.value = result
    } catch (cause) {
      if (sequence !== detailSequence) {
        return
      }
      current.value = null
      detailError.value = getErrorMessage(cause)
    } finally {
      if (sequence === detailSequence) {
        detailLoading.value = false
      }
    }
  }

  return {
    boardEnabled,
    boardLoaded,
    boardLoading,
    boardError,
    isBoardClosed,
    projects,
    total,
    listLoading,
    listError,
    lastQuery,
    current,
    currentSlug,
    detailLoading,
    detailError,
    loadBoard,
    setBoardEnabled,
    invalidateProjects,
    invalidateAll,
    loadProjects,
    loadProject,
  }
})
