export interface UserSummary {
  id: number
  name: string
  handle: string
  reputation: number
  avatarColor: string
  title: string
}

export interface QuestionTag {
  slug: string
  name: string
}

export interface Tag extends QuestionTag {
  description: string
  questionCount: number
  weeklyCount: number
  followerCount: number
}

export interface QuestionSummary {
  id: number
  title: string
  excerpt: string
  score: number
  answerCount: number
  viewCount: number
  hasAcceptedAnswer: boolean
  isFeatured: boolean
  tags: QuestionTag[]
  author: UserSummary
  createdAt: string
  lastActivityAt: string
}

export interface QuestionComment {
  id: number
  body: string
  author: UserSummary
  createdAt: string
}

export interface Answer {
  id: number
  questionId: number
  body: string
  score: number
  accepted: boolean
  viewerVote: -1 | 0 | 1
  author: UserSummary
  createdAt: string
  comments: QuestionComment[]
}

export interface QuestionDetail extends QuestionSummary {
  body: string
  viewerVote: -1 | 0 | 1
  bookmarked: boolean
  answersList: Answer[]
  related: QuestionSummary[]
  comments: QuestionComment[]
}

export type QuestionSort = 'newest' | 'active' | 'unanswered' | 'votes'

export interface QuestionQuery {
  page?: number
  pageSize?: number
  sort?: QuestionSort
  tag?: string
  q?: string
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface CreateAnswerInput {
  body: string
}

export interface CreateQuestionInput {
  title: string
  body: string
  tags: string[]
}

export interface CommunityStats {
  questionCount: number
  answerCount: number
  developerCount: number
  solvedRate: number
  todayQuestionCount: number
  onlineCount: number
}

export interface TopMember {
  user: UserSummary
  weeklyScore: number
  topTag: string
}

export interface CommunityOverview {
  stats: CommunityStats
  popularTags: Tag[]
  topMembers: TopMember[]
}

export interface UserBadge {
  label: string
  tone: 'gold' | 'silver' | 'bronze' | 'neutral'
}

export interface UserProfile extends UserSummary {
  bio: string
  location: string
  school: string
  joinedAt: string
  questionCount: number
  answerCount: number
  viewCount: number
  topTags: Tag[]
  badges: UserBadge[]
  recentQuestions: QuestionSummary[]
}

export interface VoteResult {
  score: number
  viewerVote: -1 | 0 | 1
}

export interface BookmarkResult {
  bookmarked: boolean
}

export type UserRole = 'member' | 'admin'

export type AccountStatus = 'active' | 'suspended'

export interface AuthUser extends UserSummary {
  role: UserRole
}

export interface LoginInput {
  email: string
  password: string
  remember: boolean
}

export interface AuthResult {
  user: AuthUser
}

export type AdminQuestionStatus = 'published' | 'hidden'

export type AdminQuestionFilter = 'all' | AdminQuestionStatus | 'unanswered'

export type AdminTagStatus = 'active' | 'hidden'

export interface AdminStats {
  questionCount: number
  hiddenQuestionCount: number
  answerCount: number
  userCount: number
  suspendedUserCount: number
  tagCount: number
  hiddenTagCount: number
  unansweredQuestionCount: number
  solvedRate: number
}

export interface AdminQuestion {
  id: number
  title: string
  author: UserSummary
  tags: QuestionTag[]
  score: number
  answerCount: number
  viewCount: number
  status: AdminQuestionStatus
  isFeatured: boolean
  createdAt: string
  lastActivityAt: string
}

export interface AdminQuestionQuery {
  page?: number
  pageSize?: number
  q?: string
  status?: AdminQuestionFilter
}

export interface AdminQuestionPatch {
  status?: AdminQuestionStatus
  featured?: boolean
}

export interface AdminUser {
  id: number
  name: string
  handle: string
  email: string
  reputation: number
  avatarColor: string
  title: string
  role: UserRole
  status: AccountStatus
  questionCount: number
  answerCount: number
  joinedAt: string
}

export interface AdminUserQuery {
  page?: number
  pageSize?: number
  q?: string
  role?: 'all' | UserRole
  status?: 'all' | AccountStatus
}

export interface AdminUserPatch {
  role?: UserRole
  status?: AccountStatus
}

export interface AdminTag extends Tag {
  status: AdminTagStatus
}

export interface AdminTagInput {
  name: string
  slug: string
  description: string
}

export interface AdminTagPatch {
  description?: string
  status?: AdminTagStatus
}

export interface AdminOverview {
  stats: AdminStats
  recentQuestions: AdminQuestion[]
  recentUsers: AdminUser[]
}

export interface AdminDeleteResult {
  id: number
  deleted: boolean
}
