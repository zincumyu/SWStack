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

export type ProjectStatus = 'idea' | 'building' | 'beta' | 'launched' | 'archived'

export type ProjectNeed = 'feedback' | 'teammates'

export type ProjectStatusFilter = 'all' | ProjectStatus

export type ProjectNeedFilter = 'all' | ProjectNeed

export type ProjectReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ProjectMember {
  user: UserSummary
  role: string
  isOwner: boolean
}

export interface ProjectUpdate {
  id: number
  title: string
  body: string
  createdAt: string
  author: UserSummary
}

export interface UploadedImage {
  url: string
  name: string
  mimeType: string
  size: number
}

export interface ProjectSummary {
  id: number
  slug: string
  name: string
  tagline: string
  coverImage: string
  techStack: string[]
  status: ProjectStatus
  needs: ProjectNeed[]
  owner: UserSummary
  teamName?: string
  memberCount: number
  updateCount: number
  lastUpdatedAt: string
  isFeatured: boolean
  githubUrl?: string
  demoUrl?: string
}

export interface ProjectDetail extends ProjectSummary {
  readme: string
  screenshots: string[]
  members: ProjectMember[]
  updates: ProjectUpdate[]
  createdAt: string
}

export interface ProjectDraftInput {
  name: string
  slug: string
  tagline: string
  coverImage: string
  screenshots: string[]
  techStack: string[]
  status: ProjectStatus
  needs: ProjectNeed[]
  teamName?: string
  githubUrl?: string
  demoUrl?: string
  readme: string
}

export interface ProjectEditData extends ProjectDraftInput {
  id: number
  reviewStatus: ProjectReviewStatus
  reviewNote?: string
  submittedAt?: string
  reviewedAt?: string
  visibility: AdminProjectVisibility
  createdAt: string
  updatedAt: string
}

export interface MyProject extends ProjectSummary {
  reviewStatus: ProjectReviewStatus
  reviewNote?: string
  submittedAt?: string
  reviewedAt?: string
  visibility: AdminProjectVisibility
  createdAt: string
  updatedAt: string
}

export interface ProjectBoardSettings {
  enabled: boolean
}

export interface ProjectQuery {
  page?: number
  pageSize?: number
  q?: string
  status?: ProjectStatusFilter
  need?: ProjectNeedFilter
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
  projectCount: number
  hiddenProjectCount: number
  pendingProjectCount: number
  projectBoardEnabled: boolean
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

export type AdminProjectVisibility = 'published' | 'hidden'

export interface AdminProject extends ProjectSummary {
  visibility: AdminProjectVisibility
  reviewStatus: ProjectReviewStatus
  reviewNote?: string
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AdminProjectDetail extends AdminProject {
  readme: string
  screenshots: string[]
  members: ProjectMember[]
  updates: ProjectUpdate[]
}

export interface AdminProjectQuery {
  page?: number
  pageSize?: number
  q?: string
  visibility?: 'all' | AdminProjectVisibility
  review?: 'all' | ProjectReviewStatus
  need?: 'all' | ProjectNeed
}

export interface AdminProjectPatch {
  visibility?: AdminProjectVisibility
  featured?: boolean
  reviewStatus?: 'approved' | 'rejected'
  reviewNote?: string
}

export interface AdminProjectsResult extends PageResult<AdminProject> {
  boardEnabled: boolean
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
