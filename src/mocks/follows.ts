import type {
  FollowResult,
  FollowStatus,
  FollowingFeedItem,
  FollowingFeedQuery,
  PageResult,
  UserProfile,
} from '@/api/types'
import { ApiError } from '@/api/errors'
import { getQuestionStatus, getTagStatus, getUserStatus } from './admin-state'
import { listPublishedColumns } from './columns'
import { buildUserProfile, questions, tags, toQuestionSummary, users } from './data'
import {
  getProjectBoardEnabled,
  isProjectPublic,
  projectSeeds,
  toProjectSummary,
  toProjectUpdates,
} from './projects'

const followedUsersByUserId = new Map<number, Set<string>>()
const followedTagsByUserId = new Map<number, Set<string>>()

const seedFollows: Record<number, { users: string[]; tags: string[] }> = {
  6: { users: ['zhouqi', 'hejia', 'luxing'], tags: ['vue3', 'typescript', 'fastapi'] },
}

function ensureSet(map: Map<number, Set<string>>, userId: number): Set<string> {
  const existing = map.get(userId)
  if (existing) {
    return existing
  }
  const created = new Set<string>()
  map.set(userId, created)
  return created
}

for (const [userId, seed] of Object.entries(seedFollows)) {
  const followedUsers = ensureSet(followedUsersByUserId, Number(userId))
  for (const handle of seed.users) {
    if (users.some((user) => user.handle === handle)) {
      followedUsers.add(handle)
    }
  }

  const followedTags = ensureSet(followedTagsByUserId, Number(userId))
  for (const slug of seed.tags) {
    const tag = tags.find((item) => item.slug === slug)
    if (tag && getTagStatus(slug) === 'active') {
      followedTags.add(slug)
      tag.followerCount += 1
    }
  }
}

function followedUsers(userId: number): Set<string> {
  return followedUsersByUserId.get(userId) ?? new Set<string>()
}

function followedTags(userId: number): Set<string> {
  return followedTagsByUserId.get(userId) ?? new Set<string>()
}

function countUserFollowers(handle: string): number {
  let count = 0
  for (const followed of followedUsersByUserId.values()) {
    if (followed.has(handle)) {
      count += 1
    }
  }
  return count
}

function baseFollowerCount(handle: string): number {
  return buildUserProfile(handle)?.followerCount ?? 0
}

export function withFollowStats(profile: UserProfile): UserProfile {
  return {
    ...profile,
    followerCount: profile.followerCount + countUserFollowers(profile.handle),
    followingCount: followedUsers(profile.id).size,
  }
}

export function getFollowStatus(userId: number): FollowStatus {
  return {
    users: [...followedUsers(userId)],
    tags: [...followedTags(userId)],
  }
}

export function toggleUserFollow(userId: number, handle: string): FollowResult {
  const target = users.find((user) => user.handle === handle)
  if (!target || getUserStatus(target.id) !== 'active') {
    throw new ApiError('没有找到这个开发者', 404)
  }

  const viewer = users.find((user) => user.id === userId)
  if (viewer?.handle === handle) {
    throw new ApiError('不能关注自己', 422)
  }

  const followed = ensureSet(followedUsersByUserId, userId)
  const nextFollowing = !followed.has(handle)
  if (nextFollowing) {
    followed.add(handle)
  } else {
    followed.delete(handle)
  }

  return {
    following: nextFollowing,
    followerCount: baseFollowerCount(handle) + countUserFollowers(handle),
  }
}

export function toggleTagFollow(userId: number, slug: string): FollowResult {
  const tag = tags.find((item) => item.slug === slug)
  if (!tag || getTagStatus(slug) !== 'active') {
    throw new ApiError('没有找到这个标签', 404)
  }

  const followed = ensureSet(followedTagsByUserId, userId)
  const nextFollowing = !followed.has(slug)
  if (nextFollowing) {
    followed.add(slug)
    tag.followerCount += 1
  } else {
    followed.delete(slug)
    tag.followerCount = Math.max(0, tag.followerCount - 1)
  }

  return {
    following: nextFollowing,
    followerCount: tag.followerCount,
  }
}

function activeFollowedUser(handle: string, followed: Set<string>): boolean {
  if (!followed.has(handle)) {
    return false
  }
  const user = users.find((item) => item.handle === handle)
  return Boolean(user && getUserStatus(user.id) === 'active')
}

function activeFollowedTag(slug: string, followed: Set<string>): boolean {
  return followed.has(slug) && getTagStatus(slug) === 'active'
}

export function listFollowingFeed(
  userId: number,
  query: FollowingFeedQuery,
): PageResult<FollowingFeedItem> {
  const followedUserSet = followedUsers(userId)
  const followedTagSet = followedTags(userId)
  const itemsById = new Map<string, FollowingFeedItem>()

  for (const record of questions) {
    if (
      getQuestionStatus(record.id) !== 'published' ||
      getUserStatus(record.author.id) !== 'active'
    ) {
      continue
    }
    const matchesUser = activeFollowedUser(record.author.handle, followedUserSet)
    const matchesTag = record.tags.some((tag) => activeFollowedTag(tag.slug, followedTagSet))
    if (!matchesUser && !matchesTag) {
      continue
    }
    const question = toQuestionSummary(record)
    itemsById.set(`question-${record.id}`, {
      id: `question-${record.id}`,
      type: 'question',
      createdAt: record.createdAt,
      question,
    })
  }

  for (const column of listPublishedColumns()) {
    if (getUserStatus(column.author.id) !== 'active') {
      continue
    }
    const matchesUser = activeFollowedUser(column.author.handle, followedUserSet)
    const matchesTag = column.tags.some((tag) => activeFollowedTag(tag.slug, followedTagSet))
    if (!matchesUser && !matchesTag) {
      continue
    }
    itemsById.set(`column-${column.id}`, {
      id: `column-${column.id}`,
      type: 'column',
      createdAt: column.publishedAt ?? column.createdAt,
      column,
    })
  }

  if (getProjectBoardEnabled()) {
    for (const seed of projectSeeds) {
      if (!isProjectPublic(seed)) {
        continue
      }
      const latestUpdate = toProjectUpdates(seed)[0]
      if (!latestUpdate || getUserStatus(latestUpdate.author.id) !== 'active') {
        continue
      }
      const matchesOwner = activeFollowedUser(seed.ownerHandle, followedUserSet)
      const matchesAuthor = activeFollowedUser(latestUpdate.author.handle, followedUserSet)
      if (!matchesOwner && !matchesAuthor) {
        continue
      }
      itemsById.set(`project-update-${latestUpdate.id}`, {
        id: `project-update-${latestUpdate.id}`,
        type: 'projectUpdate',
        createdAt: latestUpdate.createdAt,
        project: toProjectSummary(seed),
        update: latestUpdate,
      })
    }
  }

  const items = [...itemsById.values()].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id.localeCompare(a.id),
  )
  const total = items.length
  const pageSize = Math.min(24, Math.max(1, Math.trunc(query.pageSize ?? 12)))
  const requestedPage = Math.max(1, Math.trunc(query.page ?? 1))
  const page = total > 0 ? Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize))) : 1
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
}
