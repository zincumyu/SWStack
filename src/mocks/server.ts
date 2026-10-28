import type {
  AccountStatus,
  AdminDeleteResult,
  AdminOverview,
  AdminQuestion,
  AdminQuestionFilter,
  AdminQuestionPatch,
  AdminStats,
  AdminTag,
  AdminTagInput,
  AdminTagPatch,
  AdminTagStatus,
  AdminUser,
  AdminUserPatch,
  Answer,
  AuthResult,
  BookmarkResult,
  CommunityOverview,
  CreateAnswerInput,
  CreateQuestionInput,
  LoginInput,
  PageResult,
  QuestionDetail,
  QuestionSort,
  QuestionSummary,
  Tag,
  UserProfile,
  UserRole,
  UserSummary,
  VoteResult,
} from '@/api/types'
import type { ApiRequestConfig } from '@/api/http'
import { ApiError } from '@/api/errors'
import {
  buildUserProfile,
  communityStats,
  questions,
  tags,
  toQuestionDetail,
  toQuestionSummary,
  topMembers,
  userProfiles,
} from './data'
import type { QuestionRecord, UserProfileSeed } from './data'
import {
  accountEmail,
  authenticate,
  clearSession,
  getQuestionStatus,
  getTagStatus,
  getUserRole,
  getUserStatus,
  persistSession,
  requireAdmin,
  requireSessionUser,
  setQuestionStatus,
  setTagStatus,
  setUserRole,
  setUserStatus,
  toAuthUser,
} from './admin-state'

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))
const clone = <T>(value: T): T => structuredClone(value)

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asVote(value: unknown): -1 | 0 | 1 {
  if (value === 1 || value === -1) {
    return value
  }
  return 0
}

function findQuestion(id: number): QuestionRecord {
  const record = questions.find((item) => item.id === id)
  if (!record) {
    throw new ApiError('没有找到这个问题', 404)
  }
  return record
}

function findPublicQuestion(id: number): QuestionRecord {
  const record = findQuestion(id)
  if (getQuestionStatus(record.id) === 'hidden') {
    throw new ApiError('没有找到这个问题', 404)
  }
  return record
}

function findUserProfile(id: number): UserProfileSeed {
  const profile = userProfiles.find((item) => item.id === id)
  if (!profile) {
    throw new ApiError('没有找到这个开发者', 404)
  }
  return profile
}

function matchesSearch(record: QuestionRecord, keyword: string): boolean {
  if (!keyword) {
    return true
  }
  const haystack = [
    record.title,
    record.excerpt,
    record.body,
    record.author.name,
    record.author.handle,
    ...record.tags.map((tag) => tag.name),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword.toLowerCase())
}

function makeExcerpt(body: string): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/[#>*_[\]-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 116 ? `${plain.slice(0, 116)}...` : plain
}

function visibleTags(): Tag[] {
  return tags.filter((tag) => getTagStatus(tag.slug) === 'active')
}

function toAdminQuestion(record: QuestionRecord): AdminQuestion {
  return {
    id: record.id,
    title: record.title,
    author: record.author,
    tags: record.tags,
    score: record.score,
    answerCount: record.answersList.length,
    viewCount: record.viewCount,
    status: getQuestionStatus(record.id),
    isFeatured: record.isFeatured,
    createdAt: record.createdAt,
    lastActivityAt: record.lastActivityAt,
  }
}

function toAdminUser(profile: UserProfileSeed): AdminUser {
  return {
    id: profile.id,
    name: profile.name,
    handle: profile.handle,
    email: accountEmail(profile.id, profile.handle),
    reputation: profile.reputation,
    avatarColor: profile.avatarColor,
    title: profile.title,
    role: getUserRole(profile.id),
    status: getUserStatus(profile.id),
    questionCount: profile.questionCount,
    answerCount: profile.answerCount,
    joinedAt: profile.joinedAt,
  }
}

function toAdminTag(tag: Tag): AdminTag {
  return { ...tag, status: getTagStatus(tag.slug) }
}

function buildAdminStats(): AdminStats {
  const hiddenQuestionCount = questions.filter(
    (record) => getQuestionStatus(record.id) === 'hidden',
  ).length
  const answerCount = questions.reduce((total, record) => total + record.answersList.length, 0)
  const solvedCount = questions.filter((record) =>
    record.answersList.some((answer) => answer.accepted),
  ).length
  const unansweredQuestionCount = questions.filter(
    (record) =>
      getQuestionStatus(record.id) === 'published' && record.answersList.length === 0,
  ).length

  return {
    questionCount: questions.length,
    hiddenQuestionCount,
    answerCount,
    userCount: userProfiles.length,
    suspendedUserCount: userProfiles.filter(
      (profile) => getUserStatus(profile.id) === 'suspended',
    ).length,
    tagCount: tags.length,
    hiddenTagCount: tags.filter((tag) => getTagStatus(tag.slug) === 'hidden').length,
    unansweredQuestionCount,
    solvedRate: questions.length ? Math.round((solvedCount / questions.length) * 100) : 0,
  }
}

function buildAdminOverview(): AdminOverview {
  return {
    stats: buildAdminStats(),
    recentQuestions: [...questions]
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
      )
      .slice(0, 5)
      .map(toAdminQuestion),
    recentUsers: [...userProfiles]
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
      .slice(0, 5)
      .map(toAdminUser),
  }
}

const handlers = {
  async 'POST /auth/login'(config: ApiRequestConfig): Promise<AuthResult> {
    const input = (config.data ?? {}) as LoginInput
    const email = readString(input.email)
    const password = readString(input.password)
    if (!email || !password) {
      throw new ApiError('请输入邮箱和密码', 422)
    }

    const user = authenticate(email, password)
    persistSession(user.id, Boolean(input.remember))
    return { user: clone(toAuthUser(user)) }
  },

  async 'POST /auth/logout'(): Promise<{ success: boolean }> {
    clearSession()
    return { success: true }
  },

  async 'GET /session/me'(): Promise<AuthResult['user']> {
    return clone(toAuthUser(requireSessionUser()))
  },

  async 'GET /questions'(config: ApiRequestConfig): Promise<PageResult<QuestionSummary>> {
    const page = Math.max(1, readNumber(config.params?.page, 1))
    const pageSize = Math.min(30, Math.max(1, readNumber(config.params?.pageSize, 8)))
    const sort = readString(config.params?.sort) as QuestionSort
    const tag = readString(config.params?.tag)
    const keyword = readString(config.params?.q)

    let items = questions.filter((record) => {
      if (getQuestionStatus(record.id) === 'hidden') {
        return false
      }
      const tagMatch = !tag || record.tags.some((item) => item.slug === tag)
      return tagMatch && matchesSearch(record, keyword)
    })

    if (sort === 'unanswered') {
      items = items.filter((record) => record.answersList.length === 0)
    }

    const sorted = [...items].sort((a, b) => {
      if (sort === 'votes') {
        return b.score - a.score
      }
      if (sort === 'active') {
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const total = sorted.length
    const start = (page - 1) * pageSize
    return {
      items: sorted.slice(start, start + pageSize).map(toQuestionSummary),
      total,
      page,
      pageSize,
    }
  },

  async 'POST /questions'(config: ApiRequestConfig): Promise<QuestionSummary> {
    const author = requireSessionUser()
    const input = (config.data ?? {}) as CreateQuestionInput
    const title = readString(input.title)
    const body = readString(input.body)
    const requestedTags = Array.isArray(input.tags) ? input.tags.map(readString).filter(Boolean) : []

    if (title.length < 8) {
      throw new ApiError('标题至少需要 8 个字符', 422)
    }
    if (body.length < 20) {
      throw new ApiError('问题描述至少需要 20 个字符', 422)
    }
    if (requestedTags.length === 0) {
      throw new ApiError('请至少添加一个标签', 422)
    }

    const selectedTags = requestedTags.slice(0, 5).map((slug) => {
      const existing = tags.find((tag) => tag.slug === slug)
      return existing ? { slug: existing.slug, name: existing.name } : { slug, name: slug }
    })

    const nextId = Math.max(...questions.map((item) => item.id)) + 1
    const timestamp = new Date().toISOString()
    const record: QuestionRecord = {
      id: nextId,
      title,
      excerpt: makeExcerpt(body),
      body,
      score: 0,
      viewCount: 1,
      isFeatured: false,
      tags: selectedTags,
      author: clone(author),
      createdAt: timestamp,
      lastActivityAt: timestamp,
      viewerVote: 0,
      bookmarked: false,
      answersList: [],
      comments: [],
    }

    questions.unshift(record)
    return clone(toQuestionSummary(record))
  },

  async 'GET /questions/:id'(config: ApiRequestConfig, id: number): Promise<QuestionDetail> {
    const record = findPublicQuestion(id)
    record.viewCount += 1
    const detail = toQuestionDetail(record)
    detail.related = detail.related.filter(
      (item) => getQuestionStatus(item.id) !== 'hidden',
    )
    return clone(detail)
  },

  async 'POST /questions/:id/vote'(config: ApiRequestConfig, id: number): Promise<VoteResult> {
    requireSessionUser()
    const record = findPublicQuestion(id)
    const nextVote = asVote((config.data as { value?: unknown } | undefined)?.value)
    record.score += nextVote - record.viewerVote
    record.viewerVote = nextVote
    return { score: record.score, viewerVote: record.viewerVote }
  },

  async 'POST /questions/:id/bookmark'(config: ApiRequestConfig, id: number): Promise<BookmarkResult> {
    requireSessionUser()
    const record = findPublicQuestion(id)
    const value = (config.data as { bookmarked?: unknown } | undefined)?.bookmarked
    record.bookmarked = typeof value === 'boolean' ? value : !record.bookmarked
    return { bookmarked: record.bookmarked }
  },

  async 'POST /questions/:id/answers'(config: ApiRequestConfig, id: number): Promise<Answer> {
    const author = requireSessionUser()
    const record = findPublicQuestion(id)
    const body = readString((config.data as CreateAnswerInput | undefined)?.body)
    if (body.length < 20) {
      throw new ApiError('回答至少需要 20 个字符', 422)
    }

    const nextId =
      Math.max(0, ...questions.flatMap((item) => item.answersList.map((answer) => answer.id))) + 1
    const answer: Answer = {
      id: nextId,
      questionId: record.id,
      body,
      score: 0,
      accepted: false,
      viewerVote: 0,
      author: clone(author),
      createdAt: new Date().toISOString(),
      comments: [],
    }
    record.answersList.push(answer)
    record.lastActivityAt = answer.createdAt
    return clone(answer)
  },

  async 'POST /answers/:id/vote'(config: ApiRequestConfig, id: number): Promise<VoteResult> {
    requireSessionUser()
    const parent = questions.find(
      (record) =>
        getQuestionStatus(record.id) === 'published' &&
        record.answersList.some((answer) => answer.id === id),
    )
    const answer = parent?.answersList.find((item) => item.id === id)
    if (!answer) {
      throw new ApiError('没有找到这个回答', 404)
    }
    const nextVote = asVote((config.data as { value?: unknown } | undefined)?.value)
    answer.score += nextVote - answer.viewerVote
    answer.viewerVote = nextVote
    return { score: answer.score, viewerVote: answer.viewerVote }
  },

  async 'GET /tags'(): Promise<Tag[]> {
    return clone([...visibleTags()].sort((a, b) => b.questionCount - a.questionCount))
  },

  async 'GET /users'(): Promise<UserProfile[]> {
    return clone(
      userProfiles
        .filter((profile) => getUserStatus(profile.id) === 'active')
        .map((profile) => buildUserProfile(profile.handle))
        .filter((profile): profile is UserProfile => Boolean(profile))
        .sort((a, b) => b.reputation - a.reputation),
    )
  },

  async 'GET /users/:handle'(_config: ApiRequestConfig, handle: string): Promise<UserProfile> {
    const profile = buildUserProfile(handle)
    if (!profile || getUserStatus(profile.id) === 'suspended') {
      throw new ApiError('没有找到这个开发者', 404)
    }
    return clone(profile)
  },

  async 'GET /community/overview'(): Promise<CommunityOverview> {
    return clone({
      stats: communityStats,
      popularTags: [...visibleTags()]
        .sort((a, b) => b.weeklyCount - a.weeklyCount)
        .slice(0, 6),
      topMembers: topMembers.filter((member) => getUserStatus(member.user.id) === 'active'),
    })
  },

  async 'GET /admin/overview'(): Promise<AdminOverview> {
    return clone(buildAdminOverview())
  },

  async 'GET /admin/questions'(config: ApiRequestConfig): Promise<PageResult<AdminQuestion>> {
    const page = Math.max(1, readNumber(config.params?.page, 1))
    const pageSize = Math.min(50, Math.max(1, readNumber(config.params?.pageSize, 10)))
    const keyword = readString(config.params?.q).toLowerCase()
    const rawStatus = readString(config.params?.status)
    const status: AdminQuestionFilter =
      rawStatus === 'hidden' ||
      rawStatus === 'published' ||
      rawStatus === 'unanswered'
        ? rawStatus
        : 'all'

    const filtered = questions.filter((record) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'unanswered'
          ? record.answersList.length === 0
          : getQuestionStatus(record.id) === status)
      const haystack = [
        String(record.id),
        record.title,
        record.author.name,
        record.author.handle,
        ...record.tags.map((tag) => tag.name),
      ]
        .join(' ')
        .toLowerCase()
      return matchesStatus && (!keyword || haystack.includes(keyword))
    })

    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    )
    const total = sorted.length
    const start = (page - 1) * pageSize
    return {
      items: sorted.slice(start, start + pageSize).map(toAdminQuestion),
      total,
      page,
      pageSize,
    }
  },

  async 'PATCH /admin/questions/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<AdminQuestion> {
    const record = findQuestion(id)
    const input = (config.data ?? {}) as AdminQuestionPatch

    if (input.status !== undefined) {
      if (input.status !== 'published' && input.status !== 'hidden') {
        throw new ApiError('无效的问题状态', 422)
      }
      setQuestionStatus(record.id, input.status)
    }
    if (input.featured !== undefined) {
      record.isFeatured = Boolean(input.featured)
    }

    return clone(toAdminQuestion(record))
  },

  async 'DELETE /admin/questions/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminDeleteResult> {
    const index = questions.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new ApiError('没有找到这个问题', 404)
    }
    questions.splice(index, 1)
    return { id, deleted: true }
  },

  async 'GET /admin/users'(config: ApiRequestConfig): Promise<PageResult<AdminUser>> {
    const page = Math.max(1, readNumber(config.params?.page, 1))
    const pageSize = Math.min(50, Math.max(1, readNumber(config.params?.pageSize, 10)))
    const keyword = readString(config.params?.q).toLowerCase()
    const rawRole = readString(config.params?.role)
    const rawStatus = readString(config.params?.status)
    const role: 'all' | UserRole =
      rawRole === 'admin' || rawRole === 'member' ? rawRole : 'all'
    const status: 'all' | AccountStatus =
      rawStatus === 'active' || rawStatus === 'suspended' ? rawStatus : 'all'

    const filtered = userProfiles
      .map(toAdminUser)
      .filter((user) => {
        const haystack = [user.name, user.handle, user.email, user.title]
          .join(' ')
          .toLowerCase()
        return (
          (role === 'all' || user.role === role) &&
          (status === 'all' || user.status === status) &&
          (!keyword || haystack.includes(keyword))
        )
      })
      .sort((a, b) => b.reputation - a.reputation)

    const total = filtered.length
    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    }
  },

  async 'PATCH /admin/users/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<AdminUser> {
    const admin = requireAdmin()
    const profile = findUserProfile(id)
    const input = (config.data ?? {}) as AdminUserPatch
    const currentRole = getUserRole(id)
    const currentStatus = getUserStatus(id)

    if (
      admin.id === id &&
      ((input.role !== undefined && input.role !== currentRole) ||
        (input.status !== undefined && input.status !== currentStatus))
    ) {
      throw new ApiError('不能修改当前登录账号的角色或状态', 422)
    }
    if (input.role !== undefined) {
      if (input.role !== 'admin' && input.role !== 'member') {
        throw new ApiError('无效的账号角色', 422)
      }
      setUserRole(id, input.role)
    }
    if (input.status !== undefined) {
      if (input.status !== 'active' && input.status !== 'suspended') {
        throw new ApiError('无效的账号状态', 422)
      }
      setUserStatus(id, input.status)
    }

    return clone(toAdminUser(profile))
  },

  async 'GET /admin/tags'(): Promise<AdminTag[]> {
    return clone(
      [...tags]
        .map(toAdminTag)
        .sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name)),
    )
  },

  async 'POST /admin/tags'(config: ApiRequestConfig): Promise<AdminTag> {
    const input = (config.data ?? {}) as AdminTagInput
    const name = readString(input.name)
    const slug = readString(input.slug).toLowerCase()
    const description = readString(input.description)

    if (name.length < 2 || name.length > 30) {
      throw new ApiError('标签名称需要 2-30 个字符', 422)
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 32) {
      throw new ApiError('标签标识只能包含小写字母, 数字和连字符', 422)
    }
    if (description.length < 6 || description.length > 200) {
      throw new ApiError('标签描述需要 6-200 个字符', 422)
    }
    if (tags.some((tag) => tag.slug === slug)) {
      throw new ApiError('这个标签标识已被使用', 409)
    }

    const tag: Tag = {
      slug,
      name,
      description,
      questionCount: 0,
      weeklyCount: 0,
      followerCount: 0,
    }
    tags.push(tag)
    setTagStatus(slug, 'active')
    return clone(toAdminTag(tag))
  },

  async 'PATCH /admin/tags/:slug'(
    config: ApiRequestConfig,
    slug: string,
  ): Promise<AdminTag> {
    const tag = tags.find((item) => item.slug === slug)
    if (!tag) {
      throw new ApiError('没有找到这个标签', 404)
    }
    const input = (config.data ?? {}) as AdminTagPatch

    if (input.description !== undefined) {
      const description = readString(input.description)
      if (description.length < 6 || description.length > 200) {
        throw new ApiError('标签描述需要 6-200 个字符', 422)
      }
      tag.description = description
    }
    if (input.status !== undefined) {
      if (input.status !== 'active' && input.status !== 'hidden') {
        throw new ApiError('无效的标签状态', 422)
      }
      setTagStatus(slug, input.status)
    }

    return clone(toAdminTag(tag))
  },
}

export async function mockRequest<T>(config: ApiRequestConfig): Promise<T> {
  await wait(180 + Math.round(Math.random() * 120))

  const method = config.method ?? 'GET'
  const path = config.url.split('?')[0]
  const exact = `${method} ${path}`

  if (path.startsWith('/admin/')) {
    requireAdmin()
  }

  const handlerMap = handlers as unknown as Record<
    string,
    (request: ApiRequestConfig, param?: number | string) => Promise<unknown>
  >
  const direct = handlerMap[exact]
  if (direct) {
    return (await direct(config)) as T
  }

  const rules: Array<{
    pattern: RegExp
    key: keyof typeof handlers
    extract: (match: RegExpMatchArray) => number | string
  }> = [
    { pattern: /^\/questions\/(\d+)\/vote$/, key: 'POST /questions/:id/vote', extract: (m) => Number(m[1]) },
    { pattern: /^\/questions\/(\d+)\/bookmark$/, key: 'POST /questions/:id/bookmark', extract: (m) => Number(m[1]) },
    { pattern: /^\/questions\/(\d+)\/answers$/, key: 'POST /questions/:id/answers', extract: (m) => Number(m[1]) },
    { pattern: /^\/questions\/(\d+)$/, key: 'GET /questions/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/answers\/(\d+)\/vote$/, key: 'POST /answers/:id/vote', extract: (m) => Number(m[1]) },
    { pattern: /^\/users\/([^/]+)$/, key: 'GET /users/:handle', extract: (m) => decodeURIComponent(m[1]) },
    { pattern: /^\/admin\/questions\/(\d+)$/, key: 'PATCH /admin/questions/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/questions\/(\d+)$/, key: 'DELETE /admin/questions/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/users\/(\d+)$/, key: 'PATCH /admin/users/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/tags\/([^/]+)$/, key: 'PATCH /admin/tags/:slug', extract: (m) => decodeURIComponent(m[1]) },
  ]

  for (const rule of rules) {
    if (!exact.startsWith(rule.key.split(' ')[0])) {
      continue
    }
    const match = path.match(rule.pattern)
    if (match) {
      return (await handlerMap[rule.key](config, rule.extract(match))) as T
    }
  }

  throw new ApiError(`Mock API 未实现 ${exact}`, 404)
}
