import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { AuthUser } from '@/api/types'
import { useSessionStore } from '@/stores/session'
import { useSearchHistoryStore } from '@/stores/search-history'

const baseUser: AuthUser = {
  id: 6,
  name: '苏禾',
  handle: 'suhe',
  reputation: 4630,
  avatarColor: '#7a6241',
  title: '全栈开发 / 开源社团',
  role: 'member',
  canWriteColumns: false,
}

function historyKey(userId: number): string {
  return `swstack:search-history:${userId}`
}

function setSessionUser(userId: number | null): void {
  const session = useSessionStore()
  session.user = userId === null ? null : { ...baseUser, id: userId }
}

function storedHistory(userId: number): unknown {
  const raw = window.localStorage.getItem(historyKey(userId))
  return raw === null ? null : JSON.parse(raw)
}

function startSession(userId: number | null): void {
  setActivePinia(createPinia())
  setSessionUser(userId)
}

describe('search history store', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('ignores guests and blank terms', () => {
    const history = useSearchHistoryStore()

    history.remember('Vue')
    expect(history.recent).toEqual([])
    expect(storedHistory(6)).toBeNull()

    setSessionUser(6)
    history.remember('   ')
    expect(history.recent).toEqual([])
    expect(window.localStorage.getItem(historyKey(6))).toBeNull()
  })

  it('normalizes terms and deduplicates case-insensitively', () => {
    setSessionUser(6)
    const history = useSearchHistoryStore()

    history.remember('  Vue   3  ')
    expect(history.recent).toEqual(['Vue 3'])

    history.remember('vue 3')
    expect(history.recent).toEqual(['vue 3'])
    expect(storedHistory(6)).toEqual(['vue 3'])

    history.remember('FastAPI')
    expect(history.recent).toEqual(['FastAPI', 'vue 3'])
    expect(storedHistory(6)).toEqual(['FastAPI', 'vue 3'])
  })

  it('caps the history at six entries with newest first', () => {
    setSessionUser(6)
    const history = useSearchHistoryStore()

    for (const term of ['one', 'two', 'three', 'four', 'five', 'six', 'seven']) {
      history.remember(term)
    }

    expect(history.recent).toEqual(['seven', 'six', 'five', 'four', 'three', 'two'])
    expect(storedHistory(6)).toEqual(history.recent)
  })

  it('truncates long terms to eighty characters', () => {
    setSessionUser(6)
    const history = useSearchHistoryStore()

    history.remember(`  ${'x'.repeat(100)}  `)

    expect(history.recent).toEqual(['x'.repeat(80)])
  })

  it('persists per user and reloads the matching history', async () => {
    setSessionUser(6)
    const first = useSearchHistoryStore()
    first.remember('Vue')
    first.remember('TypeScript')

    startSession(6)
    const reloaded = useSearchHistoryStore()
    expect(reloaded.recent).toEqual(['TypeScript', 'Vue'])

    setSessionUser(4)
    await nextTick()
    expect(reloaded.recent).toEqual([])
    expect(window.localStorage.getItem(historyKey(4))).toBeNull()

    setSessionUser(6)
    await nextTick()
    expect(reloaded.recent).toEqual(['TypeScript', 'Vue'])
  })

  it('falls back to an empty history for corrupt or non-string storage', () => {
    window.localStorage.setItem(historyKey(6), '{not-json')
    startSession(6)
    expect(useSearchHistoryStore().recent).toEqual([])

    window.localStorage.setItem(
      historyKey(6),
      JSON.stringify(['alpha', 42, null, '  beta   gamma ']),
    )
    startSession(6)
    expect(useSearchHistoryStore().recent).toEqual(['alpha', 'beta gamma'])
  })

  it('removes one term and clears the whole history', () => {
    setSessionUser(6)
    const history = useSearchHistoryStore()
    history.remember('Vue')
    history.remember('FastAPI')

    history.remove('vue')
    expect(history.recent).toEqual(['FastAPI'])
    expect(storedHistory(6)).toEqual(['FastAPI'])

    history.clear()
    expect(history.recent).toEqual([])
    expect(storedHistory(6)).toEqual([])
  })

  it('resets the in-memory list on sign out and restores it on the next sign in', async () => {
    setSessionUser(6)
    const history = useSearchHistoryStore()
    history.remember('Vue')
    expect(history.recent).toEqual(['Vue'])

    setSessionUser(null)
    await nextTick()
    expect(history.recent).toEqual([])
    expect(storedHistory(6)).toEqual(['Vue'])

    setSessionUser(6)
    await nextTick()
    expect(history.recent).toEqual(['Vue'])
  })
})
