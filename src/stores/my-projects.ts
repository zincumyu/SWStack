import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { projectApi } from '@/api/projects'
import type { MyProject, ProjectDraftInput, ProjectEditData } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'
import { useAdminStore } from '@/stores/admin'
import { useProjectStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'

export const useMyProjectsStore = defineStore('my-projects', () => {
  const sessionStore = useSessionStore()
  const items = ref<MyProject[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)
  let listSequence = 0

  const editor = ref<ProjectEditData | null>(null)
  const editorId = ref<number | null>(null)
  const editorLoading = ref(false)
  const editorError = ref<string | null>(null)
  const saving = ref(false)
  let editorSequence = 0

  async function loadMine(force = false): Promise<void> {
    if (loaded.value && !force) {
      return
    }
    const sequence = ++listSequence
    loading.value = true
    error.value = null

    try {
      const result = await projectApi.mine()
      if (sequence !== listSequence) {
        return
      }
      items.value = result
      loaded.value = true
    } catch (cause) {
      if (sequence !== listSequence) {
        return
      }
      items.value = []
      error.value = getErrorMessage(cause)
    } finally {
      if (sequence === listSequence) {
        loading.value = false
      }
    }
  }

  async function loadEditor(id: number): Promise<void> {
    if (editor.value?.id === id && !editorLoading.value) {
      return
    }
    const sequence = ++editorSequence
    editorId.value = id
    editorLoading.value = true
    editorError.value = null
    editor.value = null

    try {
      const result = await projectApi.editData(id)
      if (sequence !== editorSequence) {
        return
      }
      editor.value = result
    } catch (cause) {
      if (sequence !== editorSequence) {
        return
      }
      editorError.value = getErrorMessage(cause)
    } finally {
      if (sequence === editorSequence) {
        editorLoading.value = false
      }
    }
  }

  function clearEditor(): void {
    editorSequence += 1
    editor.value = null
    editorId.value = null
    editorLoading.value = false
    editorError.value = null
  }

  function reset(): void {
    listSequence += 1
    items.value = []
    loading.value = false
    error.value = null
    loaded.value = false
    editorSequence += 1
    editor.value = null
    editorId.value = null
    editorLoading.value = false
    editorError.value = null
  }

  let scopedHandle = sessionStore.user?.handle ?? null

  watch(
    () => sessionStore.user?.handle ?? null,
    (handle) => {
      if (handle === scopedHandle) {
        return
      }
      const hadUser = scopedHandle !== null
      scopedHandle = handle
      if (hadUser) {
        reset()
      }
    },
  )

  function upsertItem(next: MyProject): void {
    const index = items.value.findIndex((item) => item.id === next.id)
    if (index === -1) {
      items.value = [next, ...items.value]
    } else {
      items.value[index] = next
    }
    items.value = [...items.value].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    useProjectStore().invalidateAll()
    useAdminStore().invalidateProjects()
  }

  async function create(input: ProjectDraftInput): Promise<MyProject> {
    const ownerHandle = sessionStore.user?.handle ?? null
    saving.value = true
    try {
      const created = await projectApi.create(input)
      if ((sessionStore.user?.handle ?? null) === ownerHandle) {
        upsertItem(created)
      }
      return created
    } finally {
      saving.value = false
    }
  }

  async function update(id: number, input: ProjectDraftInput): Promise<MyProject> {
    const ownerHandle = sessionStore.user?.handle ?? null
    saving.value = true
    try {
      const updated = await projectApi.update(id, input)
      if ((sessionStore.user?.handle ?? null) === ownerHandle) {
        upsertItem(updated)
        editor.value = null
      }
      return updated
    } finally {
      saving.value = false
    }
  }

  return {
    items,
    loading,
    error,
    loaded,
    editor,
    editorId,
    editorLoading,
    editorError,
    saving,
    loadMine,
    loadEditor,
    clearEditor,
    reset,
    create,
    update,
  }
})
