import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'

const STORAGE_PREFIX = 'swstack:search-history'
const HISTORY_LIMIT = 6
const TERM_LIMIT = 80

function storageKey(userId: number): string {
  return `${STORAGE_PREFIX}:${userId}`
}

function readHistory(userId: number): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => normalizeTerm(item))
      .filter((item) => item.length > 0)
      .slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

function normalizeTerm(term: string): string {
  return term.replace(/\s+/g, ' ').trim().slice(0, TERM_LIMIT)
}

export const useSearchHistoryStore = defineStore('search-history', () => {
  const sessionStore = useSessionStore()
  const recent = ref<string[]>([])

  function persist(userId: number): void {
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(recent.value))
    } catch {
      // Storage can be unavailable in privacy mode.
    }
  }

  watch(
    () => sessionStore.user?.id ?? null,
    (userId) => {
      recent.value = userId ? readHistory(userId) : []
    },
    { immediate: true },
  )

  function remember(term: string): void {
    const userId = sessionStore.user?.id
    const value = normalizeTerm(term)
    if (!userId || !value) {
      return
    }
    const normalized = value.toLowerCase()
    const next = recent.value.filter((item) => item.toLowerCase() !== normalized)
    next.unshift(value)
    recent.value = next.slice(0, HISTORY_LIMIT)
    persist(userId)
  }

  function remove(term: string): void {
    const userId = sessionStore.user?.id
    if (!userId) {
      return
    }
    const normalized = normalizeTerm(term).toLowerCase()
    recent.value = recent.value.filter((item) => item.toLowerCase() !== normalized)
    persist(userId)
  }

  function clear(): void {
    const userId = sessionStore.user?.id
    if (!userId) {
      return
    }
    recent.value = []
    persist(userId)
  }

  return {
    recent,
    remember,
    remove,
    clear,
  }
})
