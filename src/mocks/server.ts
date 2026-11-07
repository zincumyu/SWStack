import type {
  AccountStatus,
  AdminColumn,
  AdminColumnDetail,
  AdminColumnQuery,
  AdminDeleteResult,
  AdminOverview,
  AdminProject,
  AdminProjectDetail,
  AdminProjectPatch,
  AdminProjectQuery,
  AdminProjectsResult,
  AdminProjectUpdatesWorkspace,
  AdminQuestion,
  AdminQuestionFilter,
  AdminQuestionPatch,
  AdminStats,
  AdminTag,
  AdminTagInput,
  AdminTagPatch,
  AdminUser,
  AdminUserPatch,
  Answer,
  AuthResult,
  BookmarkResult,
  ColumnDetail,
  ColumnInput,
  ColumnLevel,
  ColumnLevelFilter,
  ColumnQuery,
  ColumnResource,
  ColumnStatus,
  ColumnSummary,
  CommunityOverview,
  CreateAnswerInput,
  CreateQuestionInput,
  LoginInput,
  MyProject,
  NotificationItem,
  NotificationQuery,
  NotificationReadAllResult,
  NotificationUnreadCount,
  PageResult,
  ProjectBoardSettings,
  ProjectDetail,
  ProjectDraftInput,
  ProjectEditData,
  ProjectNeed,
  ProjectNeedFilter,
  ProjectReviewStatus,
  ProjectStatus,
  ProjectStatusFilter,
  ProjectSummary,
  ProjectUpdate,
  ProjectUpdateDeleteResult,
  ProjectUpdateInput,
  ProjectUpdatesWorkspace,
  QuestionDetail,
  QuestionSort,
  QuestionSummary,
  SearchResults,
  SearchType,
  SearchUserResult,
  Tag,
  UploadedImage,
  UserProfile,
  UserRole,
  VoteResult,
} from '@/api/types'
import type { ApiRequestConfig } from '@/api/http'
import { ApiError } from '@/api/errors'
import {
  isProjectImageRef,
  PROJECT_SCREENSHOT_LIMIT,
  validateProjectImageFile,
} from '@/utils/project-images'
import {
  buildUserProfile,
  communityStats,
  questions,
  tags,
  toQuestionDetail,
  toQuestionSummary,
  topMembers,
  userProfiles,
  users,
} from './data'
import type { QuestionRecord, UserProfileSeed } from './data'
import {
  accountEmail,
  authenticate,
  clearSession,
  getQuestionStatus,
  getTagStatus,
  getUserColumnAccess,
  getUserRole,
  getUserStatus,
  persistSession,
  requireAdmin,
  requireColumnWriter,
  requireSessionUser,
  setQuestionStatus,
  setTagStatus,
  setUserColumnAccess,
  setUserRole,
  setUserStatus,
  toAuthUser,
} from './admin-state'
import {
  applyProjectInput,
  applyProjectUpdate,
  createProjectSeed,
  createProjectUpdate,
  deleteProjectUpdate,
  findProjectUpdate,
  getProjectBoardEnabled,
  getProjectReviewStatus,
  getProjectStats,
  isProjectPublic,
  projectSeeds,
  setProjectBoardEnabled,
  setProjectReview,
  setProjectVisibility,
  toAdminProject,
  toAdminProjectDetail,
  toMyProject,
  toProjectDetail,
  toProjectEditData,
  toProjectSummary,
  toProjectUpdates,
} from './projects'
import {
  createAdminColumn,
  createMyColumn,
  deleteAdminColumn,
  getAdminColumn,
  getPublicColumn,
  isColumnSlugTaken,
  listAdminColumns,
  listMyColumns,
  listPublicColumns,
  patchAdminColumn,
  searchPublicColumns,
  setMyColumnStatus,
  updateAdminColumn,
  updateMyColumn,
} from './columns'
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notifyUser,
  notifyUserByHandle,
} from './notifications'

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))
const clone = <T>(value: T): T => structuredClone(value)

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) {
        reject(new ApiError('图片读取失败', 500))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new ApiError('图片读取失败', 500))
    reader.onabort = () => reject(new ApiError('图片上传已取消', 499))
    reader.readAsDataURL(file)
  })
}

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

type ProjectRecord = (typeof projectSeeds)[number]

function requireProjectBoard(): void {
  if (!getProjectBoardEnabled()) {
    throw new ApiError('项目板块暂未开放', 403)
  }
}

function notifyColumnUnpublished(column: AdminColumn, actorId: number): void {
  if (column.author.id === actorId) {
    return
  }
  notifyUser(column.author.id, {
    type: 'column_unpublished',
    title: '专栏已被管理员下线',
    body: `你的专栏 ${column.title} 已被管理员下线. 内容已保留为草稿, 需要管理员重新发布后才会公开.`,
    link: `/my/columns/${column.id}/edit`,
  })
}

function matchesProjectSearch(seed: ProjectRecord, keyword: string): boolean {
  if (!keyword) {
    return true
  }
  const owner = users.find((user) => user.handle === seed.ownerHandle)
  const haystack = [
    seed.name,
    seed.slug,
    seed.tagline,
    seed.teamName ?? '',
    owner?.name ?? '',
    owner?.handle ?? '',
    ...seed.techStack,
    ...seed.members.map((member) => member.handle),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword.toLowerCase())
}

const PROJECT_STATUSES: ProjectStatus[] = [
  'idea',
  'building',
  'beta',
  'launched',
  'archived',
]
const PROJECT_NEEDS: ProjectNeed[] = ['feedback', 'teammates']
const RESERVED_PROJECT_SLUGS = new Set(['board'])
const COLUMN_LEVELS: ColumnLevel[] = ['beginner', 'intermediate', 'advanced']
const COLUMN_STATUSES: ColumnStatus[] = ['draft', 'published']
const COLUMN_RESOURCE_LIMIT = 8

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function readOptionalUrl(value: unknown, label: string): string | undefined {
  const url = readString(value)
  if (!url) {
    return undefined
  }
  if (!isHttpUrl(url) || url.length > 300) {
    throw new ApiError(`${label}需要是有效的 http(s) 地址`, 422)
  }
  return url
}

function readProjectInput(
  value: unknown,
  currentId?: number,
): ProjectDraftInput {
  const input = (value ?? {}) as Partial<ProjectDraftInput>
  const name = readString(input.name)
  const slug = readString(input.slug).toLowerCase()
  const tagline = readString(input.tagline)
  const readme = readString(input.readme)
  const coverImage = readString(input.coverImage)
  const teamName = readString(input.teamName)

  if (name.length < 2 || name.length > 60) {
    throw new ApiError('项目名称需要 2-60 个字符', 422)
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 2 || slug.length > 40) {
    throw new ApiError('项目地址标识只能包含小写字母, 数字和连字符', 422)
  }
  if (RESERVED_PROJECT_SLUGS.has(slug)) {
    throw new ApiError('这个项目地址标识不可用', 422)
  }
  if (projectSeeds.some((seed) => seed.slug === slug && seed.id !== currentId)) {
    throw new ApiError('这个项目地址标识已被使用', 409)
  }
  if (tagline.length < 8 || tagline.length > 140) {
    throw new ApiError('项目简介需要 8-140 个字符', 422)
  }
  if (readme.length < 50 || readme.length > 12000) {
    throw new ApiError('README 需要 50-12000 个字符', 422)
  }
  if (!isProjectImageRef(coverImage)) {
    throw new ApiError('项目封面需要是上传图片, 本地占位图或 http(s) 地址', 422)
  }
  const screenshots = Array.from(
    new Set(
      Array.isArray(input.screenshots)
        ? input.screenshots.map(readString).filter((item) => item.length > 0)
        : [],
    ),
  )
  if (screenshots.length > PROJECT_SCREENSHOT_LIMIT) {
    throw new ApiError(`最多上传 ${PROJECT_SCREENSHOT_LIMIT} 张详情截图`, 422)
  }
  if (screenshots.some((item) => !isProjectImageRef(item))) {
    throw new ApiError('详情截图格式不支持', 422)
  }
  if (teamName.length > 30) {
    throw new ApiError('团队名称不能超过 30 个字符', 422)
  }

  const techStack = Array.isArray(input.techStack)
    ? input.techStack
        .map(readString)
        .filter((item) => item.length > 0 && item.length <= 24)
        .filter((item, index, list) => {
          const key = item.toLowerCase()
          return list.findIndex((other) => other.toLowerCase() === key) === index
        })
        .slice(0, 8)
    : []
  if (techStack.length === 0) {
    throw new ApiError('请至少填写一项技术栈', 422)
  }

  const status = input.status as ProjectStatus
  if (!PROJECT_STATUSES.includes(status)) {
    throw new ApiError('无效的项目状态', 422)
  }

  const rawNeeds = Array.isArray(input.needs) ? input.needs : []
  if (rawNeeds.some((need) => !PROJECT_NEEDS.includes(need as ProjectNeed))) {
    throw new ApiError('无效的项目需求', 422)
  }
  const needs = Array.from(new Set(rawNeeds)) as ProjectNeed[]

  return {
    name,
    slug,
    tagline,
    coverImage,
    screenshots,
    techStack,
    status,
    needs,
    teamName: teamName || undefined,
    githubUrl: readOptionalUrl(input.githubUrl, 'GitHub 地址'),
    demoUrl: readOptionalUrl(input.demoUrl, 'Demo 地址'),
    readme,
  }
}

function readProjectUpdateInput(value: unknown): ProjectUpdateInput {
  const input = (value ?? {}) as Partial<ProjectUpdateInput>
  const title = readString(input.title)
  const body = readString(input.body)
  if (title.length < 4 || title.length > 80) {
    throw new ApiError('开发日志标题需要 4-80 个字符', 422)
  }
  if (body.length < 20 || body.length > 3000) {
    throw new ApiError('开发日志内容需要 20-3000 个字符', 422)
  }
  return { title, body }
}

function readColumnInput(value: unknown, currentId?: number): ColumnInput {
  const input = (value ?? {}) as Partial<ColumnInput>
  const title = readString(input.title)
  const slug = readString(input.slug).toLowerCase()
  const summary = readString(input.summary)
  const body = readString(input.body)
  const level = input.level as ColumnLevel
  const status = input.status as ColumnStatus

  if (title.length < 4 || title.length > 80) {
    throw new ApiError('专栏标题需要 4-80 个字符', 422)
  }
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    slug.length < 2 ||
    slug.length > 64
  ) {
    throw new ApiError('专栏地址标识只能包含小写字母, 数字和连字符', 422)
  }
  if (isColumnSlugTaken(slug, currentId)) {
    throw new ApiError('这个专栏地址标识已被使用', 409)
  }
  if (summary.length < 20 || summary.length > 200) {
    throw new ApiError('专栏摘要需要 20-200 个字符', 422)
  }
  if (body.length < 100 || body.length > 20000) {
    throw new ApiError('专栏正文需要 100-20000 个字符', 422)
  }
  if (!COLUMN_LEVELS.includes(level)) {
    throw new ApiError('无效的专栏难度', 422)
  }
  if (!COLUMN_STATUSES.includes(status)) {
    throw new ApiError('无效的专栏状态', 422)
  }

  const tagSlugs = Array.from(
    new Set(
      Array.isArray(input.tags)
        ? input.tags.map((item) => readString(item).toLowerCase()).filter(Boolean)
        : [],
    ),
  )
  if (tagSlugs.length < 1 || tagSlugs.length > 5) {
    throw new ApiError('请选择 1-5 个专栏标签', 422)
  }
  for (const slugValue of tagSlugs) {
    const tag = tags.find((item) => item.slug === slugValue)
    if (!tag || getTagStatus(tag.slug) !== 'active') {
      throw new ApiError('专栏标签不可用', 422)
    }
  }

  const rawResources = Array.isArray(input.resources) ? input.resources : []
  if (rawResources.length > COLUMN_RESOURCE_LIMIT) {
    throw new ApiError(`资源链接最多 ${COLUMN_RESOURCE_LIMIT} 条`, 422)
  }
  const resources: ColumnResource[] = rawResources.map((item) => {
    const resource = (item ?? {}) as Partial<ColumnResource>
    const resourceTitle = readString(resource.title)
    const url = readString(resource.url)
    const description = readString(resource.description)
    if (resourceTitle.length < 2 || resourceTitle.length > 60) {
      throw new ApiError('资源名称需要 2-60 个字符', 422)
    }
    if (!isHttpUrl(url) || url.length > 400) {
      throw new ApiError('资源链接需要是有效的 http(s) 地址', 422)
    }
    if (description.length > 160) {
      throw new ApiError('资源说明不能超过 160 个字符', 422)
    }
    return { title: resourceTitle, url, description }
  })

  return {
    title,
    slug,
    summary,
    level,
    tags: tagSlugs,
    body,
    resources,
    status,
    featured: input.featured === true,
  }
}

function readColumnLevel(value: unknown): ColumnLevelFilter {
  const level = readString(value) as ColumnLevel
  return COLUMN_LEVELS.includes(level) ? level : 'all'
}

function requireOwnColumn(id: number, handle: string): AdminColumnDetail {
  const column = getAdminColumn(id)
  if (!column) {
    throw new ApiError('没有找到这篇专栏', 404)
  }
  if (column.author.handle !== handle) {
    throw new ApiError('只能管理自己的专栏', 403)
  }
  return column
}

function visibleTags(): Tag[] {
  return tags.filter((tag) => getTagStatus(tag.slug) === 'active')
}

const SEARCH_TYPES: SearchType[] = [
  'all',
  'questions',
  'projects',
  'columns',
  'tags',
  'users',
]

function readSearchType(value: unknown): SearchType {
  const type = readString(value) as SearchType
  return SEARCH_TYPES.includes(type) ? type : 'all'
}

function toSearchUserResult(profile: UserProfile): SearchUserResult {
  return {
    id: profile.id,
    name: profile.name,
    handle: profile.handle,
    reputation: profile.reputation,
    avatarColor: profile.avatarColor,
    title: profile.title,
    bio: profile.bio,
    school: profile.school,
    questionCount: profile.questionCount,
    answerCount: profile.answerCount,
  }
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
    canWriteColumns: getUserColumnAccess(profile.id),
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
  const projectStats = getProjectStats()

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
    ...projectStats,
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

  async 'GET /questions/:id'(_config: ApiRequestConfig, id: number): Promise<QuestionDetail> {
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
    if (record.author.id !== author.id) {
      notifyUser(record.author.id, {
        type: 'question_answered',
        title: '你的问题收到新回答',
        body: `${author.name} 回答了你的问题: ${record.title}.`,
        link: `/questions/${record.id}`,
      })
    }
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

  async 'GET /search'(config: ApiRequestConfig): Promise<SearchResults> {
    requireSessionUser()
    const keyword = readString(config.params?.q)
    const normalized = keyword.toLowerCase()
    const type = readSearchType(config.params?.type)
    const requestedPage = Math.max(1, Math.trunc(readNumber(config.params?.page, 1)))
    const requestedPageSize = Math.min(
      20,
      Math.max(1, Math.trunc(readNumber(config.params?.pageSize, 8))),
    )
    const previewSize = 4

    const matchedQuestions = normalized
      ? questions
          .filter(
            (record) =>
              getQuestionStatus(record.id) === 'published' &&
              matchesSearch(record, keyword),
          )
          .sort((a, b) => {
            const aTitle = a.title.toLowerCase().includes(normalized) ? 1 : 0
            const bTitle = b.title.toLowerCase().includes(normalized) ? 1 : 0
            return (
              bTitle - aTitle ||
              b.score - a.score ||
              new Date(b.lastActivityAt).getTime() -
                new Date(a.lastActivityAt).getTime()
            )
          })
          .map(toQuestionSummary)
      : []

    const matchedProjects = normalized && getProjectBoardEnabled()
      ? projectSeeds
          .filter(
            (seed) => isProjectPublic(seed) && matchesProjectSearch(seed, keyword),
          )
          .map(toProjectSummary)
          .sort(
            (a, b) =>
              Number(b.isFeatured) - Number(a.isFeatured) ||
              new Date(b.lastUpdatedAt).getTime() -
                new Date(a.lastUpdatedAt).getTime(),
          )
      : []

    const matchedColumns = normalized ? searchPublicColumns(keyword) : []

    const matchedTags = normalized
      ? visibleTags()
          .filter((tag) =>
            `${tag.name} ${tag.description}`.toLowerCase().includes(normalized),
          )
          .sort((a, b) => b.questionCount - a.questionCount)
      : []

    const matchedUsers = normalized
      ? userProfiles
          .filter((profile) => getUserStatus(profile.id) === 'active')
          .map((profile) => buildUserProfile(profile.handle))
          .filter((profile): profile is UserProfile => Boolean(profile))
          .filter((profile) =>
            [
              profile.name,
              profile.handle,
              profile.title,
              profile.bio,
              profile.school,
              ...profile.topTags.map((tag) => tag.name),
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalized),
          )
          .sort((a, b) => b.reputation - a.reputation)
          .map(toSearchUserResult)
      : []

    const counts = {
      questions: matchedQuestions.length,
      projects: matchedProjects.length,
      columns: matchedColumns.length,
      tags: matchedTags.length,
      users: matchedUsers.length,
    }
    const allTotal = Object.values(counts).reduce((sum, value) => sum + value, 0)
    const scopeTotal = type === 'all' ? allTotal : counts[type]
    const pageSize = type === 'all' ? previewSize : requestedPageSize
    const page =
      type === 'all'
        ? 1
        : Math.min(requestedPage, Math.max(1, Math.ceil(scopeTotal / pageSize)))
    const output: SearchResults = {
      keyword,
      type,
      page,
      pageSize,
      total: scopeTotal,
      counts,
      questions: [],
      projects: [],
      columns: [],
      tags: [],
      users: [],
    }

    if (type === 'all') {
      output.questions = matchedQuestions.slice(0, previewSize)
      output.projects = matchedProjects.slice(0, previewSize)
      output.columns = matchedColumns.slice(0, previewSize)
      output.tags = matchedTags.slice(0, previewSize)
      output.users = matchedUsers.slice(0, previewSize)
    } else {
      const start = (page - 1) * pageSize
      if (type === 'questions') {
        output.questions = matchedQuestions.slice(start, start + pageSize)
      } else if (type === 'projects') {
        output.projects = matchedProjects.slice(start, start + pageSize)
      } else if (type === 'columns') {
        output.columns = matchedColumns.slice(start, start + pageSize)
      } else if (type === 'tags') {
        output.tags = matchedTags.slice(start, start + pageSize)
      } else {
        output.users = matchedUsers.slice(start, start + pageSize)
      }
    }

    return clone(output)
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

  async 'GET /notifications'(
    config: ApiRequestConfig,
  ): Promise<PageResult<NotificationItem>> {
    const user = requireSessionUser()
    const rawFilter = readString(config.params?.filter)
    const query: NotificationQuery = {
      page: readNumber(config.params?.page, 1),
      pageSize: readNumber(config.params?.pageSize, 10),
      filter: rawFilter === 'unread' ? 'unread' : 'all',
    }
    return clone(listNotifications(user.id, query))
  },

  async 'GET /notifications/unread-count'(): Promise<NotificationUnreadCount> {
    const user = requireSessionUser()
    return { unread: countUnreadNotifications(user.id) }
  },

  async 'PATCH /notifications/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<NotificationItem> {
    const user = requireSessionUser()
    const input = (config.data ?? {}) as { read?: unknown }
    const read = typeof input.read === 'boolean' ? input.read : true
    const updated = markNotificationRead(user.id, id, read)
    if (!updated) {
      throw new ApiError('没有找到这条通知', 404)
    }
    return clone(updated)
  },

  async 'POST /notifications/read-all'(): Promise<NotificationReadAllResult> {
    const user = requireSessionUser()
    return { updated: markAllNotificationsRead(user.id) }
  },

  async 'GET /projects/board'(): Promise<ProjectBoardSettings> {
    return { enabled: getProjectBoardEnabled() }
  },

  async 'GET /projects'(config: ApiRequestConfig): Promise<PageResult<ProjectSummary>> {
    requireProjectBoard()
    const page = Math.max(1, readNumber(config.params?.page, 1))
    const pageSize = Math.min(24, Math.max(1, readNumber(config.params?.pageSize, 12)))
    const keyword = readString(config.params?.q)
    const rawStatus = readString(config.params?.status)
    const rawNeed = readString(config.params?.need)
    const status: ProjectStatusFilter =
      rawStatus === 'idea' ||
      rawStatus === 'building' ||
      rawStatus === 'beta' ||
      rawStatus === 'launched' ||
      rawStatus === 'archived'
        ? rawStatus
        : 'all'
    const need: ProjectNeedFilter =
      rawNeed === 'feedback' || rawNeed === 'teammates' ? rawNeed : 'all'

    const items = projectSeeds.filter(
      (seed) =>
        isProjectPublic(seed) &&
        matchesProjectSearch(seed, keyword) &&
        (status === 'all' || seed.status === status) &&
        (need === 'all' || seed.needs.includes(need)),
    )
    const sorted = items
      .map(toProjectSummary)
      .sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime(),
      )
    const total = sorted.length
    const start = (page - 1) * pageSize

    return {
      items: clone(sorted.slice(start, start + pageSize)),
      total,
      page,
      pageSize,
    }
  },

  async 'GET /projects/:slug'(
    _config: ApiRequestConfig,
    slug: string,
  ): Promise<ProjectDetail> {
    requireProjectBoard()
    const seed = projectSeeds.find((item) => item.slug === slug)
    if (!seed || !isProjectPublic(seed)) {
      throw new ApiError('没有找到这个项目', 404)
    }
    return clone(toProjectDetail(seed))
  },

  async 'GET /projects/mine'(): Promise<MyProject[]> {
    const user = requireSessionUser()
    return clone(
      projectSeeds
        .filter((seed) => seed.ownerHandle === user.handle)
        .map(toMyProject)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    )
  },

  async 'GET /projects/mine/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<ProjectEditData> {
    const user = requireSessionUser()
    const seed = projectSeeds.find((item) => item.id === id)
    if (!seed) {
      throw new ApiError('没有找到这个项目', 404)
    }
    if (seed.ownerHandle !== user.handle) {
      throw new ApiError('只能编辑自己的项目', 403)
    }
    return clone(toProjectEditData(seed))
  },

  async 'POST /projects'(config: ApiRequestConfig): Promise<MyProject> {
    const user = requireSessionUser()
    const input = readProjectInput(config.data)
    const seed = createProjectSeed(input, user.handle)
    return clone(toMyProject(seed))
  },

  async 'POST /uploads/images'(
    config: ApiRequestConfig,
  ): Promise<UploadedImage> {
    requireSessionUser()
    const form = config.data
    if (!(form instanceof FormData)) {
      throw new ApiError('请通过表单上传图片', 422)
    }
    const file = form.get('file')
    if (!(file instanceof File)) {
      throw new ApiError('请选择要上传的图片', 422)
    }
    const fileError = validateProjectImageFile(file)
    if (fileError) {
      throw new ApiError(fileError, 422)
    }
    const url = await readFileAsDataUrl(file)
    return {
      url,
      name: file.name.slice(0, 120),
      mimeType: file.type,
      size: file.size,
    }
  },

  async 'PATCH /projects/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<MyProject> {
    const user = requireSessionUser()
    const seed = projectSeeds.find((item) => item.id === id)
    if (!seed) {
      throw new ApiError('没有找到这个项目', 404)
    }
    if (seed.ownerHandle !== user.handle) {
      throw new ApiError('只能编辑自己的项目', 403)
    }
    const input = readProjectInput(config.data, id)
    applyProjectInput(seed, input)
    return clone(toMyProject(seed))
  },

  async 'GET /projects/mine/:id/updates'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<ProjectUpdatesWorkspace> {
    const user = requireSessionUser()
    const seed = projectSeeds.find((item) => item.id === id)
    if (!seed) {
      throw new ApiError('没有找到这个项目', 404)
    }
    if (seed.ownerHandle !== user.handle) {
      throw new ApiError('只能管理自己项目的开发日志', 403)
    }
    return clone({
      project: toMyProject(seed),
      updates: toProjectUpdates(seed),
    })
  },

  async 'POST /projects/mine/:id/updates'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<ProjectUpdate> {
    const user = requireSessionUser()
    const seed = projectSeeds.find((item) => item.id === id)
    if (!seed) {
      throw new ApiError('没有找到这个项目', 404)
    }
    if (seed.ownerHandle !== user.handle) {
      throw new ApiError('只能管理自己项目的开发日志', 403)
    }
    const input = readProjectUpdateInput(config.data)
    return clone(createProjectUpdate(seed, input, user.handle))
  },

  async 'PATCH /project-updates/mine/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<ProjectUpdate> {
    const user = requireSessionUser()
    const found = findProjectUpdate(id)
    if (!found) {
      throw new ApiError('没有找到这条开发日志', 404)
    }
    if (found.seed.ownerHandle !== user.handle) {
      throw new ApiError('只能管理自己项目的开发日志', 403)
    }
    const input = readProjectUpdateInput(config.data)
    return clone(applyProjectUpdate(found.update, input))
  },

  async 'DELETE /project-updates/mine/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<ProjectUpdateDeleteResult> {
    const user = requireSessionUser()
    const found = findProjectUpdate(id)
    if (!found) {
      throw new ApiError('没有找到这条开发日志', 404)
    }
    if (found.seed.ownerHandle !== user.handle) {
      throw new ApiError('只能管理自己项目的开发日志', 403)
    }
    deleteProjectUpdate(found.seed, id)
    return { id, deleted: true }
  },

  async 'GET /admin/projects/:id/updates'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminProjectUpdatesWorkspace> {
    const seed = projectSeeds.find((item) => item.id === id)
    if (!seed) {
      throw new ApiError('没有找到这个项目', 404)
    }
    return clone({
      project: toAdminProject(seed),
      updates: toProjectUpdates(seed),
    })
  },

  async 'DELETE /admin/project-updates/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<ProjectUpdateDeleteResult> {
    const found = findProjectUpdate(id)
    if (!found) {
      throw new ApiError('没有找到这条开发日志', 404)
    }
    deleteProjectUpdate(found.seed, id)
    return { id, deleted: true }
  },

  async 'GET /columns'(config: ApiRequestConfig): Promise<PageResult<ColumnSummary>> {
    const query: ColumnQuery = {
      page: readNumber(config.params?.page, 1),
      pageSize: readNumber(config.params?.pageSize, 6),
      q: readString(config.params?.q),
      level: readColumnLevel(config.params?.level),
      tag: readString(config.params?.tag),
    }
    return clone(listPublicColumns(query))
  },

  async 'GET /columns/:slug'(
    _config: ApiRequestConfig,
    slug: string,
  ): Promise<ColumnDetail> {
    const column = getPublicColumn(slug)
    if (!column) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    return clone(column)
  },

  async 'GET /my/columns'(config: ApiRequestConfig): Promise<PageResult<AdminColumn>> {
    const user = requireColumnWriter()
    return clone(
      listMyColumns(user.handle, {
        page: readNumber(config.params?.page, 1),
        pageSize: readNumber(config.params?.pageSize, 8),
      }),
    )
  },

  async 'GET /my/columns/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminColumnDetail> {
    const user = requireColumnWriter()
    return clone(requireOwnColumn(id, user.handle))
  },

  async 'POST /my/columns'(config: ApiRequestConfig): Promise<AdminColumnDetail> {
    const user = requireColumnWriter()
    const input = readColumnInput(config.data)
    return clone(createMyColumn(input, user.handle))
  },

  async 'PUT /my/columns/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<AdminColumnDetail> {
    const user = requireColumnWriter()
    const existing = requireOwnColumn(id, user.handle)
    const input = readColumnInput(config.data, id)
    if (existing.moderationLocked && input.status === 'published') {
      throw new ApiError('这篇专栏已被管理员下线, 请联系管理员重新发布', 422)
    }
    const updated = updateMyColumn(id, input)
    if (!updated) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    return clone(updated)
  },

  async 'PATCH /my/columns/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<AdminColumn> {
    const user = requireColumnWriter()
    const existing = requireOwnColumn(id, user.handle)
    const input = (config.data ?? {}) as { status?: unknown; featured?: unknown }
    if (input.featured !== undefined) {
      throw new ApiError('编辑精选由管理员设置', 422)
    }
    const status = readString(input.status) as ColumnStatus
    if (!COLUMN_STATUSES.includes(status)) {
      throw new ApiError('无效的专栏状态', 422)
    }
    if (existing.moderationLocked && status === 'published') {
      throw new ApiError('这篇专栏已被管理员下线, 请联系管理员重新发布', 422)
    }
    const updated = setMyColumnStatus(id, status)
    if (!updated) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    return clone(updated)
  },

  async 'DELETE /my/columns/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminDeleteResult> {
    const user = requireColumnWriter()
    requireOwnColumn(id, user.handle)
    if (!deleteAdminColumn(id)) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    return { id, deleted: true }
  },

  async 'GET /admin/columns'(
    config: ApiRequestConfig,
  ): Promise<PageResult<AdminColumn>> {
    const statusValue = readString(config.params?.status)
    const status: 'all' | ColumnStatus =
      statusValue === 'draft' || statusValue === 'published' ? statusValue : 'all'
    const query: AdminColumnQuery = {
      page: readNumber(config.params?.page, 1),
      pageSize: readNumber(config.params?.pageSize, 10),
      q: readString(config.params?.q),
      level: readColumnLevel(config.params?.level),
      status,
    }
    return clone(listAdminColumns(query))
  },

  async 'GET /admin/columns/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminColumnDetail> {
    const column = getAdminColumn(id)
    if (!column) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    return clone(column)
  },

  async 'POST /admin/columns'(
    config: ApiRequestConfig,
  ): Promise<AdminColumnDetail> {
    const user = requireSessionUser()
    const input = readColumnInput(config.data)
    return clone(createAdminColumn(input, user.handle))
  },

  async 'PUT /admin/columns/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<AdminColumnDetail> {
    const admin = requireAdmin()
    const before = getAdminColumn(id)
    if (!before) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    const input = readColumnInput(config.data, id)
    const updated = updateAdminColumn(id, input)
    if (!updated) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    if (before.status === 'published' && updated.status === 'draft') {
      notifyColumnUnpublished(updated, admin.id)
    }
    return clone(updated)
  },

  async 'PATCH /admin/columns/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<AdminColumn> {
    const admin = requireAdmin()
    const before = getAdminColumn(id)
    if (!before) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    const input = (config.data ?? {}) as {
      status?: unknown
      featured?: unknown
    }
    const patch: { status?: ColumnStatus; featured?: boolean } = {}
    if (input.status !== undefined) {
      const status = readString(input.status) as ColumnStatus
      if (!COLUMN_STATUSES.includes(status)) {
        throw new ApiError('无效的专栏状态', 422)
      }
      patch.status = status
    }
    if (typeof input.featured === 'boolean') {
      patch.featured = input.featured
    }
    if (patch.status === undefined && patch.featured === undefined) {
      throw new ApiError('没有需要更新的字段', 422)
    }
    const updated = patchAdminColumn(id, patch)
    if (!updated) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    if (before.status === 'published' && updated.status === 'draft') {
      notifyColumnUnpublished(updated, admin.id)
    }
    return clone(updated)
  },

  async 'DELETE /admin/columns/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminDeleteResult> {
    if (!deleteAdminColumn(id)) {
      throw new ApiError('没有找到这篇专栏', 404)
    }
    return { id, deleted: true }
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
    const previousColumnAccess = getUserColumnAccess(id)

    if (
      admin.id === id &&
      ((input.role !== undefined && input.role !== currentRole) ||
        (input.status !== undefined && input.status !== currentStatus))
    ) {
      throw new ApiError('不能修改当前登录账号的角色或状态', 422)
    }
    if (admin.id === id && input.canWriteColumns !== undefined) {
      throw new ApiError('不能修改当前登录账号的专栏权限', 422)
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
    if (input.canWriteColumns !== undefined) {
      if (typeof input.canWriteColumns !== 'boolean') {
        throw new ApiError('专栏权限必须为布尔值', 422)
      }
      setUserColumnAccess(id, input.canWriteColumns)
    }

    const nextColumnAccess = getUserColumnAccess(id)
    if (input.canWriteColumns !== undefined && previousColumnAccess !== nextColumnAccess) {
      notifyUser(id, {
        type: nextColumnAccess ? 'column_access_granted' : 'column_access_revoked',
        title: nextColumnAccess ? '专栏写作权限已开通' : '专栏写作权限已撤销',
        body: nextColumnAccess
          ? '管理员已为你开通专栏写作权限. 现在可以创建和维护自己的专栏.'
          : '管理员已撤销你的专栏写作权限. 已发布的专栏仍然公开, 但暂时无法继续编辑或新建专栏.',
        link: nextColumnAccess ? '/my/columns' : '/columns',
      })
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

  async 'GET /admin/projects'(config: ApiRequestConfig): Promise<AdminProjectsResult> {
    const query = (config.params ?? {}) as AdminProjectQuery
    const page = Math.max(1, readNumber(query.page, 1))
    const pageSize = Math.min(50, Math.max(1, readNumber(query.pageSize, 10)))
    const keyword = readString(query.q).toLowerCase()
    const visibility: 'all' | 'published' | 'hidden' =
      query.visibility === 'published' || query.visibility === 'hidden'
        ? query.visibility
        : 'all'
    const review: 'all' | ProjectReviewStatus =
      query.review === 'pending' ||
      query.review === 'approved' ||
      query.review === 'rejected'
        ? query.review
        : 'all'
    const need: 'all' | 'feedback' | 'teammates' =
      query.need === 'feedback' || query.need === 'teammates' ? query.need : 'all'

    const filtered = projectSeeds
      .map(toAdminProject)
      .filter((project) => {
        const haystack = [
          project.name,
          project.slug,
          project.tagline,
          project.teamName ?? '',
          project.owner.name,
          project.owner.handle,
          ...project.techStack,
        ]
          .join(' ')
          .toLowerCase()
        return (
          (visibility === 'all' || project.visibility === visibility) &&
          (review === 'all' || project.reviewStatus === review) &&
          (need === 'all' || project.needs.includes(need)) &&
          (!keyword || haystack.includes(keyword))
        )
      })
      .sort(
        (a, b) =>
          Number(b.reviewStatus === 'pending') - Number(a.reviewStatus === 'pending') ||
          new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime(),
      )

    const total = filtered.length
    const start = (page - 1) * pageSize
    return {
      items: clone(filtered.slice(start, start + pageSize)),
      total,
      page,
      pageSize,
      boardEnabled: getProjectBoardEnabled(),
    }
  },

  async 'GET /admin/projects/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminProjectDetail> {
    const seed = projectSeeds.find((item) => item.id === id)
    if (!seed) {
      throw new ApiError('没有找到这个项目', 404)
    }
    return clone(toAdminProjectDetail(seed))
  },

  async 'PATCH /admin/projects/board'(
    config: ApiRequestConfig,
  ): Promise<ProjectBoardSettings> {
    const input = (config.data ?? {}) as { enabled?: unknown }
    if (typeof input.enabled !== 'boolean') {
      throw new ApiError('无效的板块状态', 422)
    }
    setProjectBoardEnabled(input.enabled)
    return { enabled: input.enabled }
  },

  async 'PATCH /admin/projects/:id'(
    config: ApiRequestConfig,
    id: number,
  ): Promise<AdminProject> {
    const seed = projectSeeds.find((item) => item.id === id)
    if (!seed) {
      throw new ApiError('没有找到这个项目', 404)
    }
    const input = (config.data ?? {}) as AdminProjectPatch
    const previousReview = getProjectReviewStatus(id)

    if (input.visibility !== undefined) {
      if (input.visibility !== 'published' && input.visibility !== 'hidden') {
        throw new ApiError('无效的项目状态', 422)
      }
      setProjectVisibility(id, input.visibility)
    }
    if (input.featured !== undefined) {
      seed.isFeatured = Boolean(input.featured)
    }
    if (input.reviewStatus !== undefined) {
      if (input.reviewStatus !== 'approved' && input.reviewStatus !== 'rejected') {
        throw new ApiError('无效的审核状态', 422)
      }
      const note = readString(input.reviewNote)
      if (input.reviewStatus === 'rejected' && note.length < 5) {
        throw new ApiError('驳回项目时需要填写审核备注, 至少 5 个字符', 422)
      }
      setProjectReview(id, input.reviewStatus, note || undefined)
      if (input.reviewStatus === 'approved' && input.visibility === undefined) {
        setProjectVisibility(id, 'published')
      }
      if (previousReview !== input.reviewStatus) {
        if (input.reviewStatus === 'approved') {
          notifyUserByHandle(seed.ownerHandle, {
            type: 'project_approved',
            title: '项目已通过审核',
            body: `你的项目 ${seed.name} 已通过审核并上线.`,
            link: `/projects/${seed.slug}`,
          })
        } else {
          notifyUserByHandle(seed.ownerHandle, {
            type: 'project_rejected',
            title: '项目未通过审核',
            body: `你的项目 ${seed.name} 未通过审核. 审核备注: ${note}`,
            link: '/my/projects',
          })
        }
      }
    }

    return clone(toAdminProject(seed))
  },

  async 'DELETE /admin/projects/:id'(
    _config: ApiRequestConfig,
    id: number,
  ): Promise<AdminDeleteResult> {
    const index = projectSeeds.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new ApiError('没有找到这个项目', 404)
    }
    projectSeeds.splice(index, 1)
    return { id, deleted: true }
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
    { pattern: /^\/notifications\/(\d+)$/, key: 'PATCH /notifications/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/questions\/(\d+)\/vote$/, key: 'POST /questions/:id/vote', extract: (m) => Number(m[1]) },
    { pattern: /^\/questions\/(\d+)\/bookmark$/, key: 'POST /questions/:id/bookmark', extract: (m) => Number(m[1]) },
    { pattern: /^\/questions\/(\d+)\/answers$/, key: 'POST /questions/:id/answers', extract: (m) => Number(m[1]) },
    { pattern: /^\/questions\/(\d+)$/, key: 'GET /questions/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/answers\/(\d+)\/vote$/, key: 'POST /answers/:id/vote', extract: (m) => Number(m[1]) },
    { pattern: /^\/users\/([^/]+)$/, key: 'GET /users/:handle', extract: (m) => decodeURIComponent(m[1]) },
    { pattern: /^\/projects\/mine\/(\d+)$/, key: 'GET /projects/mine/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/projects\/mine\/(\d+)\/updates$/, key: 'GET /projects/mine/:id/updates', extract: (m) => Number(m[1]) },
    { pattern: /^\/projects\/mine\/(\d+)\/updates$/, key: 'POST /projects/mine/:id/updates', extract: (m) => Number(m[1]) },
    { pattern: /^\/project-updates\/mine\/(\d+)$/, key: 'PATCH /project-updates/mine/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/project-updates\/mine\/(\d+)$/, key: 'DELETE /project-updates/mine/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/projects\/(\d+)$/, key: 'PATCH /projects/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/projects\/([^/]+)$/, key: 'GET /projects/:slug', extract: (m) => decodeURIComponent(m[1]) },
    { pattern: /^\/my\/columns\/(\d+)$/, key: 'GET /my/columns/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/my\/columns\/(\d+)$/, key: 'PUT /my/columns/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/my\/columns\/(\d+)$/, key: 'PATCH /my/columns/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/my\/columns\/(\d+)$/, key: 'DELETE /my/columns/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/columns\/([^/]+)$/, key: 'GET /columns/:slug', extract: (m) => decodeURIComponent(m[1]) },
    { pattern: /^\/admin\/questions\/(\d+)$/, key: 'PATCH /admin/questions/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/questions\/(\d+)$/, key: 'DELETE /admin/questions/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/projects\/(\d+)\/updates$/, key: 'GET /admin/projects/:id/updates', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/project-updates\/(\d+)$/, key: 'DELETE /admin/project-updates/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/projects\/(\d+)$/, key: 'GET /admin/projects/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/projects\/(\d+)$/, key: 'PATCH /admin/projects/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/projects\/(\d+)$/, key: 'DELETE /admin/projects/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/columns\/(\d+)$/, key: 'GET /admin/columns/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/columns\/(\d+)$/, key: 'PUT /admin/columns/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/columns\/(\d+)$/, key: 'PATCH /admin/columns/:id', extract: (m) => Number(m[1]) },
    { pattern: /^\/admin\/columns\/(\d+)$/, key: 'DELETE /admin/columns/:id', extract: (m) => Number(m[1]) },
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
