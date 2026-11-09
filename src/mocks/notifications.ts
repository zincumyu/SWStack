import type { NotificationItem, NotificationQuery, NotificationType, PageResult } from '@/api/types'
import { users } from './data'

export interface NotificationDraft {
  type: NotificationType
  title: string
  body: string
  link: string
}

interface NotificationSeed {
  userId: number
  draft: NotificationDraft
  read: boolean
  createdAt: string
}

const now = Date.now()

function minutesAgo(minutes: number): string {
  return new Date(now - minutes * 60_000).toISOString()
}

function daysAgo(days: number): string {
  return new Date(now - days * 86_400_000).toISOString()
}

const seeds: NotificationSeed[] = [
  {
    userId: 6,
    draft: {
      type: 'question_answered',
      title: '你的问题收到新回答',
      body: '何嘉 回答了你的问题: Docker 多阶段构建中如何减小 Node 前端镜像体积.',
      link: '/questions/105',
    },
    read: false,
    createdAt: minutesAgo(180),
  },
  {
    userId: 6,
    draft: {
      type: 'project_approved',
      title: '项目已通过审核',
      body: '你的项目 CampusFlow 已通过审核并上线.',
      link: '/projects/campus-flow',
    },
    read: false,
    createdAt: daysAgo(2),
  },
  {
    userId: 6,
    draft: {
      type: 'project_rejected',
      title: '项目未通过审核',
      body: '你的项目 CampusFlow 未通过审核. 审核备注: 封面截图不清晰, 请补充运行截图后重新提交.',
      link: '/my/projects',
    },
    read: true,
    createdAt: daysAgo(14),
  },
]

const notificationsByUserId = new Map<number, NotificationItem[]>()
let nextId = 1

for (const seed of seeds) {
  const list = notificationsByUserId.get(seed.userId) ?? []
  list.push({
    id: nextId,
    ...seed.draft,
    read: seed.read,
    createdAt: seed.createdAt,
  })
  notificationsByUserId.set(seed.userId, list)
  nextId += 1
}

function userList(userId: number): NotificationItem[] {
  return notificationsByUserId.get(userId) ?? []
}

function sortedForUser(userId: number): NotificationItem[] {
  return [...userList(userId)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function pageResult(
  items: NotificationItem[],
  page: number,
  pageSize: number,
): PageResult<NotificationItem> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  }
}

export function userIdByHandle(handle: string): number | null {
  return users.find((user) => user.handle === handle)?.id ?? null
}

export function notifyUser(userId: number, draft: NotificationDraft): NotificationItem | null {
  if (!users.some((user) => user.id === userId)) {
    return null
  }
  const item: NotificationItem = {
    id: nextId,
    ...draft,
    read: false,
    createdAt: new Date().toISOString(),
  }
  nextId += 1
  const list = notificationsByUserId.get(userId) ?? []
  list.push(item)
  notificationsByUserId.set(userId, list)
  return item
}

export function notifyUserByHandle(
  handle: string,
  draft: NotificationDraft,
): NotificationItem | null {
  const userId = userIdByHandle(handle)
  return userId === null ? null : notifyUser(userId, draft)
}

export function listNotifications(
  userId: number,
  query: NotificationQuery,
): PageResult<NotificationItem> {
  const page = Math.max(1, Math.trunc(query.page ?? 1))
  const pageSize = Math.min(50, Math.max(1, Math.trunc(query.pageSize ?? 10)))
  const filtered =
    query.filter === 'unread'
      ? sortedForUser(userId).filter((item) => !item.read)
      : sortedForUser(userId)
  return pageResult(filtered, page, pageSize)
}

export function countUnreadNotifications(userId: number): number {
  return userList(userId).filter((item) => !item.read).length
}

export function markNotificationRead(
  userId: number,
  id: number,
  read = true,
): NotificationItem | null {
  const item = userList(userId).find((entry) => entry.id === id)
  if (!item) {
    return null
  }
  item.read = read
  return item
}

export function markAllNotificationsRead(userId: number): number {
  let updated = 0
  for (const item of userList(userId)) {
    if (!item.read) {
      item.read = true
      updated += 1
    }
  }
  return updated
}
