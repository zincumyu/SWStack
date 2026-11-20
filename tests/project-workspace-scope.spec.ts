import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import * as vueRouter from 'vue-router'
import MyProjectUpdatesView from '@/views/MyProjectUpdatesView.vue'
import MyProjectApplicationsView from '@/views/MyProjectApplicationsView.vue'
import AdminProjectUpdatesView from '@/views/admin/AdminProjectUpdatesView.vue'
import { projectApi } from '@/api/projects'
import { adminApi } from '@/api/admin'

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  const { reactive } = await import('vue')
  const route = reactive({
    name: 'project-updates',
    params: { id: '1' },
  })
  return {
    ...actual,
    useRoute: () => route,
    __testRoute: route,
  }
})

vi.mock('@/api/projects', () => ({
  projectApi: {
    board: vi.fn(),
    updates: vi.fn(),
    applications: vi.fn(),
    createUpdate: vi.fn(),
    updateUpdate: vi.fn(),
    deleteUpdate: vi.fn(),
    reviewApplication: vi.fn(),
    mine: vi.fn(),
  },
}))

vi.mock('@/api/admin', () => ({
  adminApi: {
    projectUpdates: vi.fn(),
    deleteProjectUpdate: vi.fn(),
  },
}))

const route = (
  vueRouter as typeof vueRouter & {
    __testRoute: { name: string; params: { id: string } }
  }
).__testRoute
const boardMock = vi.mocked(projectApi.board)
const updatesMock = vi.mocked(projectApi.updates)
const applicationsMock = vi.mocked(projectApi.applications)
const createUpdateMock = vi.mocked(projectApi.createUpdate)
const adminUpdatesMock = vi.mocked(adminApi.projectUpdates)

const owner = {
  id: 1,
  name: '陆星',
  handle: 'luxing',
  reputation: 12480,
  avatarColor: '#57606a',
  title: '前端',
}

function workspace(id: number) {
  return {
    project: {
      id,
      slug: `project-${id}`,
      name: `项目 ${id}`,
      tagline: `项目 ${id} 的简介`,
      coverImage: '/projects/cover.png',
      techStack: ['Vue 3'],
      status: 'building',
      needs: [],
      owner,
      memberCount: 1,
      updateCount: 0,
      lastUpdatedAt: '2026-11-19T00:00:00.000Z',
      isFeatured: false,
      reviewStatus: 'approved',
      visibility: 'published',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-19T00:00:00.000Z',
    },
    updates: [],
    applications: [],
  } as never
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const stubs = {
  RouterLink: { template: '<a><slot /></a>' },
  AdminPageHeader: true,
  ProjectReviewBadge: true,
  ProjectStatusBadge: true,
  UserAvatar: true,
  ProjectUpdateList: {
    props: ['updates'],
    template: '<div class="updates-stub">{{ updates.map((item) => item.title).join("|") }}</div>',
  },
}

const wrappers: Array<ReturnType<typeof mount>> = []

function mountView(component: Parameters<typeof mount>[0]) {
  const wrapper = mount(component, {
    global: { stubs },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('project workspace route scope', () => {
  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    route.name = 'project-updates'
    route.params.id = '1'
    boardMock.mockReset()
    updatesMock.mockReset()
    applicationsMock.mockReset()
    createUpdateMock.mockReset()
    adminUpdatesMock.mockReset()
    boardMock.mockResolvedValue({ enabled: true })
  })

  it('does not let a delayed update workspace overwrite a newly routed project', async () => {
    const first = deferred<unknown>()
    updatesMock.mockImplementation((id) =>
      id === 1 ? (first.promise as never) : Promise.resolve(workspace(2)),
    )

    const wrapper = mountView(MyProjectUpdatesView)
    await flushPromises()
    expect(updatesMock).toHaveBeenCalledWith(1)

    route.params.id = '2'
    await flushPromises()

    expect(updatesMock).toHaveBeenCalledWith(2)
    expect(wrapper.text()).toContain('项目 2')

    first.resolve(workspace(1))
    await flushPromises()

    expect(wrapper.text()).toContain('项目 2')
    expect(wrapper.text()).not.toContain('项目 1')
  })

  it('loads the new application workspace while the previous project is pending', async () => {
    const first = deferred<unknown>()
    applicationsMock.mockImplementation((id) =>
      id === 1 ? (first.promise as never) : Promise.resolve(workspace(2)),
    )

    const wrapper = mountView(MyProjectApplicationsView)
    await flushPromises()
    expect(applicationsMock).toHaveBeenCalledWith(1)

    route.params.id = '2'
    await flushPromises()

    expect(applicationsMock).toHaveBeenCalledWith(2)
    expect(wrapper.text()).toContain('项目 2')

    first.resolve(workspace(1))
    await flushPromises()

    expect(wrapper.text()).toContain('项目 2')
    expect(wrapper.text()).not.toContain('项目 1')
  })

  it('does not leave the admin workspace stuck after switching projects', async () => {
    const first = deferred<unknown>()
    adminUpdatesMock.mockImplementation((id) =>
      id === 1 ? (first.promise as never) : Promise.resolve(workspace(2)),
    )

    const wrapper = mountView(AdminProjectUpdatesView)
    await flushPromises()
    expect(adminUpdatesMock).toHaveBeenCalledWith(1)

    route.params.id = '2'
    await flushPromises()

    expect(adminUpdatesMock).toHaveBeenCalledWith(2)
    expect(wrapper.text()).toContain('项目 2')

    first.resolve(workspace(1))
    await flushPromises()

    expect(wrapper.text()).toContain('项目 2')
    expect(wrapper.text()).not.toContain('项目 1')
  })

  it('ignores a log created for the previous project after a route switch', async () => {
    const sync = deferred<unknown>()
    let secondProjectLoads = 0
    updatesMock.mockImplementation((id) => {
      if (id === 1) {
        return Promise.resolve(workspace(1))
      }
      secondProjectLoads += 1
      return secondProjectLoads === 1 ? Promise.resolve(workspace(2)) : (sync.promise as never)
    })
    const pendingCreate = deferred<unknown>()
    createUpdateMock.mockReturnValueOnce(pendingCreate.promise as never)

    const wrapper = mountView(MyProjectUpdatesView)
    await flushPromises()

    await wrapper.find('#update-title').setValue('A 项目新日志')
    await wrapper
      .find('#update-body')
      .setValue('这是一段足够长的开发日志正文，用来验证旧项目响应不会写入新项目。')
    await wrapper.find('.composer-panel').trigger('submit')

    route.params.id = '2'
    await flushPromises()
    expect(wrapper.text()).toContain('项目 2')

    pendingCreate.resolve({
      id: 77,
      title: 'A 项目新日志',
      body: '旧项目日志',
      createdAt: '2026-11-19T00:00:00.000Z',
      author: owner,
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('A 项目新日志')
    expect(secondProjectLoads).toBe(1)
    expect(updatesMock.mock.calls.map(([id]) => id)).toEqual([1, 2])
  })
})
