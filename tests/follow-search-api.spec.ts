import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { followApi } from '@/api/follows'
import { searchApi } from '@/api/search'
import type { FollowStatus, FollowingFeedItem } from '@/api/types'
import { clearSession, persistSession, setTagStatus, setUserStatus } from '@/mocks/admin-state'

const SUHE_ID = 6
const HEJIA_ID = 4
const ZHOUQI_ID = 2
const LINYI_ID = 7

function signIn(userId: number): void {
  clearSession()
  persistSession(userId, false)
}

function signOut(): void {
  clearSession()
}

async function expectStatus(action: Promise<unknown>, status: number): Promise<void> {
  let failure: unknown = null
  try {
    await action
  } catch (cause) {
    failure = cause
  }
  expect(failure).toBeInstanceOf(ApiError)
  expect((failure as ApiError).status).toBe(status)
}

function itemMatchesFollows(item: FollowingFeedItem, status: FollowStatus): boolean {
  switch (item.type) {
    case 'question':
      return (
        status.users.includes(item.question.author.handle) ||
        item.question.tags.some((tag) => status.tags.includes(tag.slug))
      )
    case 'column':
      return (
        status.users.includes(item.column.author.handle) ||
        item.column.tags.some((tag) => status.tags.includes(tag.slug))
      )
    case 'projectUpdate':
      return (
        status.users.includes(item.project.owner.handle) ||
        status.users.includes(item.update.author.handle)
      )
  }
}

function expectSortedByDateDesc(items: FollowingFeedItem[]): void {
  for (let index = 1; index < items.length; index += 1) {
    expect(new Date(items[index - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(items[index].createdAt).getTime(),
    )
  }
}

async function restoreFollows(viewerId: number, initial: FollowStatus): Promise<void> {
  signIn(viewerId)
  const current = await followApi.status()
  for (const handle of current.users) {
    if (!initial.users.includes(handle)) {
      await followApi.toggleUser(handle)
    }
  }
  for (const slug of current.tags) {
    if (!initial.tags.includes(slug)) {
      await followApi.toggleTag(slug)
    }
  }
  for (const handle of initial.users) {
    if (!current.users.includes(handle)) {
      await followApi.toggleUser(handle)
    }
  }
  for (const slug of initial.tags) {
    if (!current.tags.includes(slug)) {
      await followApi.toggleTag(slug)
    }
  }
}

describe('follow and search mock API', () => {
  afterEach(() => {
    signOut()
  })

  it('requires a session for every follow and search assist endpoint', async () => {
    await expectStatus(followApi.status(), 401)
    await expectStatus(followApi.toggleUser('zhouqi'), 401)
    await expectStatus(followApi.toggleTag('vue3'), 401)
    await expectStatus(followApi.feed(), 401)
    await expectStatus(searchApi.suggest('vue'), 401)
    await expectStatus(searchApi.trending(), 401)
  })

  it('returns the seeded follow status for the signed-in user', async () => {
    signIn(SUHE_ID)

    const status = await followApi.status()

    expect(status).toEqual({
      users: ['zhouqi', 'hejia', 'luxing'],
      tags: ['vue3', 'typescript', 'fastapi'],
    })
  })

  it('toggles a user follow on and off with matching follower counts', async () => {
    signIn(HEJIA_ID)
    const initial = await followApi.status()
    try {
      const followed = await followApi.toggleUser('zhouqi')
      expect(followed.following).toBe(true)
      expect(followed.followerCount).toBeGreaterThan(0)

      const during = await followApi.status()
      expect(during.users).toContain('zhouqi')

      const unfollowed = await followApi.toggleUser('zhouqi')
      expect(unfollowed.following).toBe(false)
      expect(unfollowed.followerCount).toBe(followed.followerCount - 1)

      const after = await followApi.status()
      expect(after.users).not.toContain('zhouqi')
    } finally {
      await restoreFollows(HEJIA_ID, initial)
    }
  })

  it('rejects unknown, suspended and self user follows', async () => {
    signIn(HEJIA_ID)
    await expectStatus(followApi.toggleUser('nobody'), 404)

    setUserStatus(LINYI_ID, 'suspended')
    try {
      await expectStatus(followApi.toggleUser('linyi'), 404)
    } finally {
      setUserStatus(LINYI_ID, 'active')
    }

    signIn(ZHOUQI_ID)
    await expectStatus(followApi.toggleUser('zhouqi'), 422)
  })

  it('toggles a tag follow on and off with matching follower counts', async () => {
    signIn(HEJIA_ID)
    const initial = await followApi.status()
    try {
      const followed = await followApi.toggleTag('docker')
      expect(followed.following).toBe(true)
      expect(followed.followerCount).toBeGreaterThan(0)

      const during = await followApi.status()
      expect(during.tags).toContain('docker')

      const unfollowed = await followApi.toggleTag('docker')
      expect(unfollowed.following).toBe(false)
      expect(unfollowed.followerCount).toBe(followed.followerCount - 1)

      const after = await followApi.status()
      expect(after.tags).not.toContain('docker')
    } finally {
      await restoreFollows(HEJIA_ID, initial)
    }
  })

  it('rejects unknown and hidden tags', async () => {
    signIn(HEJIA_ID)
    await expectStatus(followApi.toggleTag('no-such-tag'), 404)

    setTagStatus('docker', 'hidden')
    try {
      await expectStatus(followApi.toggleTag('docker'), 404)
    } finally {
      setTagStatus('docker', 'active')
    }
  })

  it('returns an empty feed for a user without follows', async () => {
    signIn(HEJIA_ID)

    const feed = await followApi.feed({ page: 1, pageSize: 5 })

    expect(feed).toEqual({ items: [], total: 0, page: 1, pageSize: 5 })
  })

  it('filters the following feed by followed users and tags, newest first', async () => {
    signIn(SUHE_ID)
    const status = await followApi.status()

    const full = await followApi.feed({ page: 1, pageSize: 24 })

    expect(full.total).toBe(11)
    expect(full.page).toBe(1)
    expect(full.pageSize).toBe(24)
    expect(full.items).toHaveLength(11)
    expectSortedByDateDesc(full.items)

    for (const item of full.items) {
      expect(itemMatchesFollows(item, status)).toBe(true)
    }

    const types = new Set(full.items.map((item) => item.type))
    expect(types).toEqual(new Set(['question', 'column', 'projectUpdate']))
  })

  it('paginates the following feed and clamps out-of-range pages and sizes', async () => {
    signIn(SUHE_ID)
    const full = await followApi.feed({ page: 1, pageSize: 24 })

    const firstPage = await followApi.feed({ page: 1, pageSize: 4 })
    const secondPage = await followApi.feed({ page: 2, pageSize: 4 })
    const lastPage = await followApi.feed({ page: 99, pageSize: 4 })

    expect(firstPage.items).toHaveLength(4)
    expect(secondPage.items).toHaveLength(4)
    expect(secondPage.page).toBe(2)
    expect(lastPage.page).toBe(3)
    expect(lastPage.items).toHaveLength(full.total - 8)

    expect(firstPage.items.map((item) => item.id)).toEqual(
      full.items.slice(0, 4).map((item) => item.id),
    )
    expect(secondPage.items.map((item) => item.id)).toEqual(
      full.items.slice(4, 8).map((item) => item.id),
    )
    expectSortedByDateDesc([...firstPage.items, ...secondPage.items, ...lastPage.items])

    const clampedSize = await followApi.feed({ page: 1, pageSize: 100 })
    expect(clampedSize.pageSize).toBe(24)
    expect(clampedSize.items).toHaveLength(full.total)

    const minimumSize = await followApi.feed({ page: 1, pageSize: 0 })
    expect(minimumSize.pageSize).toBe(1)
    expect(minimumSize.items).toHaveLength(1)
  })

  it('returns ranked search suggestions with a bounded limit', async () => {
    signIn(SUHE_ID)

    const exact = await searchApi.suggest('vue3')
    expect(exact.keyword).toBe('vue3')
    expect(exact.items[0]).toMatchObject({ kind: 'tag', label: 'vue3', target: '/tags/vue3' })
    for (const item of exact.items) {
      expect(['question', 'project', 'column', 'tag', 'user']).toContain(item.kind)
      expect(typeof item.label).toBe('string')
      expect(typeof item.description).toBe('string')
      expect(item.target.startsWith('/')).toBe(true)
    }

    const trimmed = await searchApi.suggest('  vue3  ')
    expect(trimmed.keyword).toBe('vue3')
    expect(trimmed.items[0]).toMatchObject({ kind: 'tag', label: 'vue3' })

    const broad = await searchApi.suggest('e', 100)
    expect(broad.items).toHaveLength(10)

    const single = await searchApi.suggest('vue3', 0)
    expect(single.items).toHaveLength(1)

    expect(await searchApi.suggest('   ')).toEqual({ keyword: '', items: [] })
    expect(await searchApi.suggest('no-such-term')).toEqual({
      keyword: 'no-such-term',
      items: [],
    })
  })

  it('returns trending terms ordered by weekly count and skips hidden tags', async () => {
    signIn(SUHE_ID)

    const trending = await searchApi.trending()

    expect(trending).toHaveLength(8)
    expect(trending[0]).toEqual({ keyword: 'javascript', count: 126 })
    for (let index = 1; index < trending.length; index += 1) {
      expect(trending[index - 1].count).toBeGreaterThanOrEqual(trending[index].count)
    }

    setTagStatus('javascript', 'hidden')
    try {
      const hidden = await searchApi.trending()
      expect(hidden).toHaveLength(8)
      expect(hidden[0]).toEqual({ keyword: 'typescript', count: 98 })
      expect(hidden.some((term) => term.keyword === 'javascript')).toBe(false)
    } finally {
      setTagStatus('javascript', 'active')
    }
  })
})
