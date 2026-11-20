import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMyProjectsStore } from '@/stores/my-projects'
import { useSessionStore } from '@/stores/session'
import type {
  MyProject,
  ProjectDraftInput,
  ProjectEditData,
  ProjectReviewStatus,
  UserSummary,
} from '@/api/types'

vi.mock('@/api/projects', () => ({
  projectApi: {
    mine: vi.fn(),
    editData: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

const { projectApi } = await import('@/api/projects')
const updateMock = vi.mocked(projectApi.update)

const input: ProjectDraftInput = {
  name: '项目',
  slug: 'project',
  tagline: '项目简介',
  coverImage: '/cover.png',
  screenshots: [],
  techStack: ['Vue 3'],
  status: 'building',
  needs: [],
  readme: '# 项目',
}

const owner: UserSummary = {
  id: 6,
  name: '苏禾',
  handle: 'suhe',
  reputation: 860,
  avatarColor: '#000',
  title: '前端',
}

function editData(id: number): ProjectEditData {
  return {
    id,
    ...input,
    reviewStatus: 'approved',
    visibility: 'published',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-19T00:00:00.000Z',
  }
}

function myProject(id: number, reviewStatus: ProjectReviewStatus): MyProject {
  return {
    id,
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    coverImage: input.coverImage,
    techStack: input.techStack,
    status: input.status,
    needs: input.needs,
    owner,
    memberCount: 1,
    updateCount: 0,
    lastUpdatedAt: '2026-11-19T00:00:00.000Z',
    isFeatured: false,
    reviewStatus,
    visibility: 'published',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-19T00:00:00.000Z',
  }
}

describe('my projects store editor scope', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    updateMock.mockReset()
  })

  it('does not clear a newly opened editor when an old project update resolves', async () => {
    const session = useSessionStore()
    session.user = {
      id: 6,
      name: '苏禾',
      handle: 'suhe',
      reputation: 860,
      avatarColor: '#000',
      title: '前端',
      role: 'member',
      canWriteColumns: false,
    }
    const store = useMyProjectsStore()
    store.editor = editData(2)
    updateMock.mockResolvedValueOnce(myProject(1, 'pending'))

    await store.update(1, input)

    expect(store.editor?.id).toBe(2)
  })
})
