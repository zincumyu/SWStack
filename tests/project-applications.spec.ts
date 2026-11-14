import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { notificationApi } from '@/api/notifications'
import { projectApi } from '@/api/projects'
import { clearSession, persistSession } from '@/mocks/admin-state'
import { projectSeeds, setProjectVisibility } from '@/mocks/projects'
import type { ProjectSeed } from '@/mocks/projects'

const STUDENT_ID = 6
const CHENMO_ID = 3
const HEJIA_ID = 4
const ZHAOQING_ID = 8
const JIANGRAN_ID = 11
const OWNER_OF_INTERVIEW_MATE = ZHAOQING_ID
const OWNER_OF_GREEN_LOOP = JIANGRAN_ID

function signIn(userId: number): void {
  clearSession()
  persistSession(userId, false)
}

function signOut(): void {
  clearSession()
}

function seedById(id: number): ProjectSeed {
  const seed = projectSeeds.find((item) => item.id === id)
  if (!seed) {
    throw new Error(`missing project seed ${id}`)
  }
  return seed
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

const validInput = {
  skills: ['Vue 3', 'TypeScript'],
  focus: '地图交互',
  message: '我做过两个 Vue 项目, 每周可以投入 8 小时, 想先完成回收点筛选与无障碍改造.',
}

describe('project applications', () => {
  afterEach(() => {
    signOut()
  })

  it('rejects guests with 401 on every application endpoint', async () => {
    await expectStatus(projectApi.apply(4, validInput), 401)
    await expectStatus(projectApi.applications(4), 401)
    await expectStatus(projectApi.reviewApplication(1, { status: 'accepted' }), 401)
  })

  it('validates focus, skills and message before creating an application', async () => {
    signIn(CHENMO_ID)

    await expectStatus(projectApi.apply(4, { ...validInput, focus: '短' }), 422)
    await expectStatus(projectApi.apply(4, { ...validInput, skills: [] }), 422)
    await expectStatus(projectApi.apply(4, { ...validInput, skills: ['A'] }), 422)
    await expectStatus(projectApi.apply(4, { ...validInput, message: '太短了' }), 422)
    await expectStatus(
      projectApi.apply(4, {
        ...validInput,
        skills: ['一', '二', '三', '四', '五', '六', '七', '八', '九'],
      }),
      422,
    )
  })

  it('creates a pending application and exposes it only to the applicant', async () => {
    signIn(CHENMO_ID)

    const created = await projectApi.apply(4, validInput)
    expect(created.status).toBe('pending')
    expect(created.projectId).toBe(4)
    expect(created.applicant.handle).toBe('chenmo')
    expect(created.skills).toEqual(validInput.skills)

    const detail = await projectApi.detail('green-loop')
    expect(detail.viewerApplication?.id).toBe(created.id)
    expect(detail.viewerApplication?.status).toBe('pending')

    signIn(HEJIA_ID)
    const otherDetail = await projectApi.detail('green-loop')
    expect(otherDetail.viewerApplication).toBeUndefined()

    signIn(CHENMO_ID)
    await expectStatus(projectApi.apply(4, validInput), 409)
  })

  it('refuses applications from members, owners and projects without a teammate need', async () => {
    signIn(STUDENT_ID)
    await expectStatus(projectApi.apply(4, validInput), 409)

    signIn(OWNER_OF_GREEN_LOOP)
    await expectStatus(projectApi.apply(4, validInput), 409)

    signIn(HEJIA_ID)
    await expectStatus(projectApi.apply(2, validInput), 422)
  })

  it('returns 404 for non-public projects', async () => {
    signIn(CHENMO_ID)
    setProjectVisibility(5, 'hidden')
    try {
      await expectStatus(projectApi.apply(5, validInput), 404)
    } finally {
      setProjectVisibility(5, 'published')
    }
  })

  it('only lets the project owner read the application list', async () => {
    signIn(CHENMO_ID)
    await expectStatus(projectApi.applications(4), 403)

    signIn(OWNER_OF_GREEN_LOOP)
    const workspace = await projectApi.applications(4)
    expect(workspace.project.id).toBe(4)
    expect(workspace.applications.length).toBeGreaterThan(0)
    expect(workspace.applications[0].status).toBe('pending')

    signIn(STUDENT_ID)
    const ownerWorkspace = await projectApi.applications(1)
    const statuses = ownerWorkspace.applications.map((item) => item.status)
    expect(statuses).toEqual(expect.arrayContaining(['pending', 'rejected']))
    expect(statuses.indexOf('rejected')).toBeGreaterThan(statuses.lastIndexOf('pending'))
  })

  it('rejects an application with a required reason and notifies the applicant', async () => {
    signIn(CHENMO_ID)
    const before = await notificationApi.unreadCount()
    const created = await projectApi.apply(5, validInput)

    signIn(OWNER_OF_INTERVIEW_MATE)
    await expectStatus(projectApi.reviewApplication(created.id, { status: 'rejected' }), 422)
    await expectStatus(
      projectApi.reviewApplication(created.id, { status: 'rejected', reviewNote: '太短' }),
      422,
    )

    const rejected = await projectApi.reviewApplication(created.id, {
      status: 'rejected',
      reviewNote: '当前更需要熟悉 Node.js 与 Redis 的同学, 之后有合适任务再联系你.',
    })
    expect(rejected.status).toBe('rejected')
    expect(rejected.reviewNote).toContain('Node.js')

    await expectStatus(projectApi.reviewApplication(created.id, { status: 'accepted' }), 409)

    signIn(CHENMO_ID)
    const after = await notificationApi.unreadCount()
    expect(after.unread).toBe(before.unread + 1)

    const notifications = await notificationApi.list({ page: 1, filter: 'all' })
    const latest = notifications.items[0]
    expect(latest.type).toBe('project_application_rejected')
    expect(latest.body).toContain('Node.js')
    expect(latest.link).toBe('/projects/interview-mate')
  })

  it('accepts an application, adds the member and notifies the applicant', async () => {
    signIn(HEJIA_ID)
    const created = await projectApi.apply(4, {
      ...validInput,
      focus: '回收点数据',
      message: '我在实验室维护过数据采集脚本, 每周可投入 6 小时, 想负责回收点数据校验.',
    })
    const beforeDetail = await projectApi.detail('green-loop')
    const beforeCount = beforeDetail.memberCount

    signIn(OWNER_OF_GREEN_LOOP)
    const accepted = await projectApi.reviewApplication(created.id, {
      status: 'accepted',
      reviewNote: '欢迎加入, 先从回收点数据校验开始.',
    })
    expect(accepted.status).toBe('accepted')

    const afterDetail = await projectApi.detail('green-loop')
    expect(afterDetail.memberCount).toBe(beforeCount + 1)
    const member = afterDetail.members.find((item) => item.user.handle === 'hejia')
    expect(member?.role).toBe('回收点数据')

    signIn(HEJIA_ID)
    const detail = await projectApi.detail('green-loop')
    expect(detail.viewerApplication?.status).toBe('accepted')

    const notifications = await notificationApi.list({ page: 1, filter: 'all' })
    expect(notifications.items[0].type).toBe('project_application_accepted')
    expect(notifications.items[0].link).toBe('/projects/green-loop')
  })

  it('notifies the owner when a new application arrives', async () => {
    const owner = seedById(5).ownerHandle
    const ownerId = owner === 'zhaoqing' ? ZHAOQING_ID : 0
    signIn(ownerId)
    await notificationApi.markAllRead()

    signIn(HEJIA_ID)
    await projectApi.apply(5, {
      ...validInput,
      focus: '题库审核',
      message: '我整理过两轮实习面经, 每周可投入 5 小时, 希望负责题目与追问记录的审核.',
    })

    signIn(ownerId)
    const notifications = await notificationApi.list({ page: 1, filter: 'all' })
    expect(notifications.items[0].type).toBe('project_application_received')
    expect(notifications.items[0].link).toBe('/my/projects/5/applications')
  })
})
