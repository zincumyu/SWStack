import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProjectsView from '@/views/ProjectsView.vue'
import type { ProjectSummary } from '@/api/types'

vi.mock('@/api/projects', () => ({
  projectApi: {
    board: vi.fn(),
    list: vi.fn(),
  },
}))

const { projectApi } = await import('@/api/projects')
const boardMock = vi.mocked(projectApi.board)
const listMock = vi.mocked(projectApi.list)

function project(id: number): ProjectSummary {
  return {
    id,
    slug: `project-${id}`,
    name: `项目 ${id}`,
    tagline: '项目简介',
    coverImage: '',
    techStack: ['Vue 3'],
    status: 'building',
    needs: [],
    owner: {
      id: 1,
      name: '陆星',
      handle: 'luxing',
      reputation: 1,
      avatarColor: '#000',
      title: '前端',
    },
    memberCount: 1,
    updateCount: 0,
    lastUpdatedAt: '2026-11-19T00:00:00.000Z',
    isFeatured: false,
  }
}

describe('ProjectsView pagination', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    boardMock.mockReset()
    listMock.mockReset()
    boardMock.mockResolvedValue({ enabled: true })
  })

  it('loads later project pages through the pagination control', async () => {
    listMock.mockImplementation(async (query) => {
      const page = query.page ?? 1
      return page === 1
        ? {
            items: Array.from({ length: 12 }, (_, index) => project(index + 1)),
            total: 13,
            page: 1,
            pageSize: 12,
          }
        : {
            items: [project(13)],
            total: 13,
            page: 2,
            pageSize: 12,
          }
    })

    const wrapper = mount(ProjectsView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ProjectCard: {
            props: ['project'],
            template: '<article class="project-card-stub">{{ project.name }}</article>',
          },
        },
      },
    })
    await flushPromises()

    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 12 }))
    expect(wrapper.findAll('.project-card-stub')).toHaveLength(12)
    expect(wrapper.text()).toContain('1 / 2')

    await wrapper.find('button[aria-label="下一页"]').trigger('click')
    await flushPromises()

    expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, pageSize: 12 }))
    expect(wrapper.findAll('.project-card-stub')).toHaveLength(1)
    expect(wrapper.text()).toContain('项目 13')
    expect(wrapper.text()).toContain('2 / 2')
  })
})
