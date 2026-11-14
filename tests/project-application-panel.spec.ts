import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { ApiError } from '@/api/errors'
import type { ProjectDetail } from '@/api/types'
import ProjectApplicationPanel from '@/components/projects/ProjectApplicationPanel.vue'

vi.mock('@/api/projects', () => ({
  projectApi: { apply: vi.fn() },
}))

const { projectApi } = await import('@/api/projects')
const applyMock = vi.mocked(projectApi.apply)

function project(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    id: 5,
    slug: 'interview-mate',
    name: 'InterviewMate',
    tagline: '用真实题库和计时模拟面试.',
    coverImage: '/projects/interview-mate.svg',
    techStack: ['Vue 3'],
    status: 'beta',
    needs: ['teammates'],
    owner: {
      id: 8,
      name: '赵青',
      handle: 'zhaoqing',
      reputation: 3240,
      avatarColor: '#6a5560',
      title: '数据库',
    },
    memberCount: 4,
    updateCount: 3,
    lastUpdatedAt: '2026-11-10T00:00:00.000Z',
    isFeatured: false,
    readme: '# InterviewMate',
    screenshots: [],
    members: [],
    updates: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as ProjectDetail
}

function mountPanel(value: ProjectDetail) {
  return mount(ProjectApplicationPanel, {
    props: { project: value },
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

async function fillForm(wrapper: ReturnType<typeof mountPanel>): Promise<void> {
  await wrapper.find('#application-focus').setValue('题库审核')
  await wrapper.find('#application-skill').setValue('TypeScript')
  await wrapper.find('.skill-input-row button').trigger('click')
  await wrapper
    .find('#application-message')
    .setValue('我整理过两轮实习面经, 每周可以投入 6 小时, 希望负责题目审核与追问记录整理.')
}

describe('ProjectApplicationPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    applyMock.mockReset()
  })

  it('shows the apply form for a public teammates project', () => {
    const wrapper = mountPanel(project())
    expect(wrapper.find('.application-form').exists()).toBe(true)
    expect(wrapper.find('#application-focus').exists()).toBe(true)
  })

  it('validates focus, skills and message before calling the API', async () => {
    const wrapper = mountPanel(project())
    await wrapper.find('.form-actions button').trigger('submit')
    await flushPromises()

    expect(applyMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('想参与的模块需要 2-40 个字符')
    expect(wrapper.text()).toContain('请至少添加一项相关技能')
    expect(wrapper.text()).toContain('自我介绍需要 20-1000 个字符')
  })

  it('supports adding and removing skills', async () => {
    const wrapper = mountPanel(project())
    await wrapper.find('#application-skill').setValue('TypeScript')
    await wrapper.find('.skill-input-row button').trigger('click')
    expect(wrapper.findAll('.skill-chip.removable')).toHaveLength(1)

    await wrapper.find('.skill-remove').trigger('click')
    expect(wrapper.findAll('.skill-chip.removable')).toHaveLength(0)
  })

  it('surfaces the duplicate application error returned by the API', async () => {
    applyMock.mockRejectedValueOnce(
      new ApiError('你已经提交过这个项目的申请, 请等待负责人处理', 409),
    )
    const wrapper = mountPanel(project())
    await fillForm(wrapper)
    await wrapper.find('.form-actions button').trigger('submit')
    await flushPromises()

    expect(applyMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.form-error').text()).toContain('你已经提交过这个项目的申请')
  })

  it('switches to the pending state after a successful submit without reloading', async () => {
    applyMock.mockResolvedValueOnce({
      id: 99,
      projectId: 5,
      applicant: project().owner,
      skills: ['TypeScript'],
      focus: '题库审核',
      message: '我整理过两轮实习面经, 每周可以投入 6 小时, 希望负责题目审核与追问记录整理.',
      status: 'pending',
      createdAt: '2026-11-14T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
    })
    const wrapper = mountPanel(project())
    await fillForm(wrapper)
    await wrapper.find('.form-actions button').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.application-form').exists()).toBe(false)
    expect(wrapper.text()).toContain('申请审核中')
  })

  it('shows the rejected result together with the owner reason', () => {
    const wrapper = mountPanel(
      project({
        viewerApplication: {
          id: 12,
          projectId: 5,
          applicant: project().owner,
          skills: ['TypeScript'],
          focus: '离线缓存',
          message: '做过 Vue 3 项目的前端架构, 想尝试离线缓存策略.',
          status: 'rejected',
          reviewNote: '目前更缺熟悉推送服务的伙伴.',
          createdAt: '2026-10-20T00:00:00.000Z',
          updatedAt: '2026-10-22T00:00:00.000Z',
        },
      }),
    )

    expect(wrapper.text()).toContain('申请未通过')
    expect(wrapper.text()).toContain('目前更缺熟悉推送服务的伙伴.')
    expect(wrapper.find('.application-form').exists()).toBe(false)
  })

  it('shows the member state for an existing project member', async () => {
    const wrapper = mountPanel(project({ members: [] }))
    const session = (await import('@/stores/session')).useSessionStore()
    session.user = {
      id: 8,
      name: '赵青',
      handle: 'zhaoqing',
      reputation: 1,
      avatarColor: '#000',
      title: '数据库',
      role: 'member',
      canWriteColumns: false,
    }
    await flushPromises()

    expect(wrapper.text()).toContain('你是项目负责人')
    expect(wrapper.find('.application-form').exists()).toBe(false)
  })
})
