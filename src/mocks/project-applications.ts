import type {
  ProjectApplication,
  ProjectApplicationInput,
  ProjectApplicationStatus,
} from '@/api/types'
import { users } from './data'

interface ProjectApplicationSeed {
  projectId: number
  applicantHandle: string
  skills: string[]
  focus: string
  message: string
  status: ProjectApplicationStatus
  reviewNote?: string
  createdDaysAgo: number
  reviewedDaysAgo?: number
}

export interface ProjectApplicationRecord {
  id: number
  projectId: number
  applicantHandle: string
  skills: string[]
  focus: string
  message: string
  status: ProjectApplicationStatus
  reviewNote?: string
  createdAt: string
  updatedAt: string
}

const now = Date.now()

function daysAgo(days: number): string {
  return new Date(now - days * 86_400_000).toISOString()
}

const seeds: ProjectApplicationSeed[] = [
  {
    projectId: 1,
    applicantHandle: 'guyan',
    skills: ['React', 'Figma', '交互设计'],
    focus: '任务看板交互',
    message:
      '我做过两个课程项目的看板界面, 熟悉拖拽与筛选交互. 每周可以投入 10 小时左右, 希望把移动端任务视图补完整.',
    status: 'pending',
    createdDaysAgo: 1,
  },
  {
    projectId: 1,
    applicantHandle: 'hejia',
    skills: ['Go', 'PostgreSQL', 'Docker'],
    focus: '后端接口与权限',
    message:
      '在实验室维护过 Go 服务, 熟悉 PostgreSQL 查询优化. 想参与课程空间权限与通知服务的设计, 每周可投入 8-12 小时.',
    status: 'pending',
    createdDaysAgo: 2,
  },
  {
    projectId: 1,
    applicantHandle: 'chenmo',
    skills: ['Python', 'FastAPI'],
    focus: '数据导入',
    message:
      '之前做过教务数据清洗, 想负责课程表导入和去重. 目前课程较多, 预计每周可投入 5 小时左右.',
    status: 'rejected',
    reviewNote: '本周后端人手已经够用, 秋季招新时再联系你, 感谢关注.',
    createdDaysAgo: 16,
    reviewedDaysAgo: 14,
  },
  {
    projectId: 4,
    applicantHandle: 'luxing',
    skills: ['Vue 3', 'TypeScript', 'MapLibre'],
    focus: '地图交互',
    message:
      '我维护过两个 Vue 项目, 也在课程作业里用过 MapLibre. 希望参与回收点地图的筛选与无障碍改造, 每周可投入 8 小时.',
    status: 'pending',
    createdDaysAgo: 3,
  },
  {
    projectId: 6,
    applicantHandle: 'suhe',
    skills: ['Vue 3', 'Capacitor'],
    focus: '离线缓存',
    message:
      '做过 Vue 3 项目的前端架构, 想尝试 Capacitor 的离线缓存策略. 每周大约 6 小时, 希望能先从问题列表缓存做起.',
    status: 'rejected',
    reviewNote: '目前更缺熟悉推送服务的伙伴, 这个方向先不展开了, 谢谢你的申请.',
    createdDaysAgo: 21,
    reviewedDaysAgo: 19,
  },
  {
    projectId: 6,
    applicantHandle: 'tanyue',
    skills: ['Figma', '移动端体验'],
    focus: '移动端体验',
    message:
      '我负责过两个移动端项目的设计验收, 想参与首版问题流与通知页的体验打磨, 每周可投入 6-8 小时.',
    status: 'pending',
    createdDaysAgo: 4,
  },
]

const recordsByProjectId = new Map<number, ProjectApplicationRecord[]>()
let nextApplicationId = 1

for (const seed of seeds) {
  const record: ProjectApplicationRecord = {
    id: nextApplicationId++,
    projectId: seed.projectId,
    applicantHandle: seed.applicantHandle,
    skills: [...seed.skills],
    focus: seed.focus,
    message: seed.message,
    status: seed.status,
    reviewNote: seed.reviewNote,
    createdAt: daysAgo(seed.createdDaysAgo),
    updatedAt: daysAgo(seed.reviewedDaysAgo ?? seed.createdDaysAgo),
  }
  const list = recordsByProjectId.get(seed.projectId) ?? []
  list.push(record)
  recordsByProjectId.set(seed.projectId, list)
}

function applicantOf(record: ProjectApplicationRecord): ProjectApplication['applicant'] {
  return users.find((user) => user.handle === record.applicantHandle) ?? users[0]
}

export function toProjectApplication(record: ProjectApplicationRecord): ProjectApplication {
  return {
    id: record.id,
    projectId: record.projectId,
    applicant: applicantOf(record),
    skills: [...record.skills],
    focus: record.focus,
    message: record.message,
    status: record.status,
    reviewNote: record.reviewNote,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export function listProjectApplications(projectId: number): ProjectApplication[] {
  const records = recordsByProjectId.get(projectId) ?? []
  return [...records]
    .sort((a, b) => {
      const pending = Number(b.status === 'pending') - Number(a.status === 'pending')
      if (pending !== 0) {
        return pending
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .map(toProjectApplication)
}

export function findProjectApplicationRecord(id: number): ProjectApplicationRecord | null {
  for (const records of recordsByProjectId.values()) {
    const record = records.find((item) => item.id === id)
    if (record) {
      return record
    }
  }
  return null
}

export function findViewerApplication(
  projectId: number,
  handle: string | null,
): ProjectApplication | undefined {
  if (!handle) {
    return undefined
  }
  const record = (recordsByProjectId.get(projectId) ?? []).find(
    (item) => item.applicantHandle === handle,
  )
  return record ? toProjectApplication(record) : undefined
}

export function hasApplicantApplied(projectId: number, handle: string): boolean {
  return (recordsByProjectId.get(projectId) ?? []).some((item) => item.applicantHandle === handle)
}

export function createProjectApplication(
  projectId: number,
  handle: string,
  input: ProjectApplicationInput,
): ProjectApplication {
  const timestamp = new Date().toISOString()
  const record: ProjectApplicationRecord = {
    id: nextApplicationId++,
    projectId,
    applicantHandle: handle,
    skills: [...input.skills],
    focus: input.focus,
    message: input.message,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const list = recordsByProjectId.get(projectId) ?? []
  recordsByProjectId.set(projectId, [record, ...list])
  return toProjectApplication(record)
}

export function reviewProjectApplication(
  record: ProjectApplicationRecord,
  status: 'accepted' | 'rejected',
  reviewNote?: string,
): ProjectApplication {
  record.status = status
  record.reviewNote = reviewNote
  record.updatedAt = new Date().toISOString()
  return toProjectApplication(record)
}
