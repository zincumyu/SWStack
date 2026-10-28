import { ApiError } from '@/api/errors'
import type {
  AccountStatus,
  AdminQuestionStatus,
  AdminTagStatus,
  AuthUser,
  UserRole,
  UserSummary,
} from '@/api/types'
import { users } from './data'

const SESSION_KEY = 'swstack.mock.session'

interface MockAccount {
  email: string
  password: string
  userId: number
}

const accounts: MockAccount[] = [
  { email: 'admin@swstack.dev', password: 'admin123', userId: 1 },
  { email: 'student@swstack.dev', password: 'student123', userId: 6 },
]

const roleByUserId = new Map<number, UserRole>([[1, 'admin']])
const userStatusById = new Map<number, AccountStatus>()
const questionStatusById = new Map<number, AdminQuestionStatus>()
const tagStatusBySlug = new Map<string, AdminTagStatus>()

export function getUserRole(userId: number): UserRole {
  return roleByUserId.get(userId) ?? 'member'
}

export function getUserStatus(userId: number): AccountStatus {
  return userStatusById.get(userId) ?? 'active'
}

export function setUserRole(userId: number, role: UserRole): void {
  roleByUserId.set(userId, role)
}

export function setUserStatus(userId: number, status: AccountStatus): void {
  userStatusById.set(userId, status)
}

export function getQuestionStatus(id: number): AdminQuestionStatus {
  return questionStatusById.get(id) ?? 'published'
}

export function setQuestionStatus(id: number, status: AdminQuestionStatus): void {
  questionStatusById.set(id, status)
}

export function getTagStatus(slug: string): AdminTagStatus {
  return tagStatusBySlug.get(slug) ?? 'active'
}

export function setTagStatus(slug: string, status: AdminTagStatus): void {
  tagStatusBySlug.set(slug, status)
}

export function accountEmail(userId: number, handle: string): string {
  return (
    accounts.find((account) => account.userId === userId)?.email ??
    `${handle}@campus.swstack.dev`
  )
}

export function authenticate(email: string, password: string): UserSummary {
  const account = accounts.find(
    (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
  )
  if (!account) {
    throw new ApiError('邮箱或密码错误', 401)
  }

  const user = users.find((item) => item.id === account.userId)
  if (!user) {
    throw new ApiError('账号不存在', 401)
  }
  if (getUserStatus(user.id) === 'suspended') {
    throw new ApiError('账号已被停用, 请联系管理员', 403)
  }
  return user
}

function readUserId(storage: Storage): number | null {
  try {
    const raw = storage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as { userId?: unknown }
    return typeof parsed.userId === 'number' ? parsed.userId : null
  } catch {
    return null
  }
}

export function currentSessionUser(): UserSummary | null {
  const userId = readUserId(window.localStorage) ?? readUserId(window.sessionStorage)
  if (userId === null) {
    return null
  }
  const user = users.find((item) => item.id === userId)
  if (!user || getUserStatus(user.id) === 'suspended') {
    return null
  }
  return user
}

export function persistSession(userId: number, remember: boolean): void {
  clearSession()
  const storage = remember ? window.localStorage : window.sessionStorage
  try {
    storage.setItem(SESSION_KEY, JSON.stringify({ userId }))
  } catch {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId }))
    } catch {
      // Ignore storage access failures.
    }
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore storage access failures.
  }
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore storage access failures.
  }
}

export function toAuthUser(user: UserSummary): AuthUser {
  return { ...user, role: getUserRole(user.id) }
}

export function requireSessionUser(): UserSummary {
  const user = currentSessionUser()
  if (!user) {
    throw new ApiError('请先登录', 401)
  }
  return user
}

export function requireAdmin(): UserSummary {
  const user = requireSessionUser()
  if (getUserRole(user.id) !== 'admin') {
    throw new ApiError('需要管理员权限', 403)
  }
  return user
}
