import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import { ApiError } from '@/api/errors'
import type { AuthUser, LoginInput } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useSessionStore = defineStore('session', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)
  let pending: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  function load(): Promise<void> {
    if (initialized.value) {
      return Promise.resolve()
    }
    if (pending) {
      return pending
    }

    loading.value = true
    error.value = null
    pending = authApi
      .me()
      .then((result) => {
        user.value = result
      })
      .catch((cause) => {
        if (cause instanceof ApiError && cause.status === 401) {
          user.value = null
          error.value = null
          return
        }
        error.value = getErrorMessage(cause)
      })
      .finally(() => {
        loading.value = false
        initialized.value = true
        pending = null
      })

    return pending
  }

  async function login(input: LoginInput): Promise<AuthUser> {
    if (pending) {
      await pending
    }
    loading.value = true
    error.value = null
    try {
      const result = await authApi.login(input)
      user.value = result.user
      initialized.value = true
      return result.user
    } catch (cause) {
      error.value = getErrorMessage(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await authApi.logout()
    } finally {
      user.value = null
      error.value = null
      initialized.value = true
      loading.value = false
    }
  }

  return {
    user,
    loading,
    initialized,
    error,
    isAuthenticated,
    isAdmin,
    load,
    login,
    logout,
  }
})
