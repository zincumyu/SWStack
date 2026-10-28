import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/api/users'
import type { UserProfile } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'

export const useUserDirectoryStore = defineStore('user-directory', () => {
  const members = ref<UserProfile[]>([])
  const membersLoading = ref(false)
  const membersError = ref<string | null>(null)
  const profile = ref<UserProfile | null>(null)
  const profileLoading = ref(false)
  const profileError = ref<string | null>(null)
  let membersPromise: Promise<void> | null = null
  let profileSequence = 0

  function loadMembers(): Promise<void> {
    if (membersPromise) {
      return membersPromise
    }
    if (members.value.length > 0) {
      return Promise.resolve()
    }

    membersLoading.value = true
    membersError.value = null
    membersPromise = userApi
      .list()
      .then((result) => {
        members.value = result
      })
      .catch((cause) => {
        membersError.value = getErrorMessage(cause)
      })
      .finally(() => {
        membersLoading.value = false
        membersPromise = null
      })

    return membersPromise
  }

  async function loadProfile(handle: string): Promise<void> {
    const sequence = ++profileSequence
    profileLoading.value = true
    profileError.value = null
    profile.value = null

    try {
      const result = await userApi.get(handle)
      if (sequence === profileSequence) {
        profile.value = result
      }
    } catch (cause) {
      if (sequence === profileSequence) {
        profileError.value = getErrorMessage(cause)
      }
    } finally {
      if (sequence === profileSequence) {
        profileLoading.value = false
      }
    }
  }

  function invalidateMembers(): void {
    members.value = []
    membersError.value = null
  }

  return {
    members,
    membersLoading,
    membersError,
    profile,
    profileLoading,
    profileError,
    loadMembers,
    loadProfile,
    invalidateMembers,
  }
})
