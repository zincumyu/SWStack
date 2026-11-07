import { request } from './http'
import type {
  MyProject,
  PageResult,
  ProjectBoardSettings,
  ProjectDetail,
  ProjectDraftInput,
  ProjectEditData,
  ProjectQuery,
  ProjectSummary,
  ProjectUpdate,
  ProjectUpdateDeleteResult,
  ProjectUpdateInput,
  ProjectUpdatesWorkspace,
} from './types'

export const projectApi = {
  board() {
    return request<ProjectBoardSettings>({ url: '/projects/board' })
  },

  list(query: ProjectQuery) {
    return request<PageResult<ProjectSummary>>({
      url: '/projects',
      params: { ...query },
    })
  },

  detail(slug: string) {
    return request<ProjectDetail>({
      url: `/projects/${encodeURIComponent(slug)}`,
    })
  },

  mine() {
    return request<MyProject[]>({ url: '/projects/mine' })
  },

  editData(id: number) {
    return request<ProjectEditData>({ url: `/projects/mine/${id}` })
  },

  create(input: ProjectDraftInput) {
    return request<MyProject>({
      url: '/projects',
      method: 'POST',
      data: input,
    })
  },

  update(id: number, input: ProjectDraftInput) {
    return request<MyProject>({
      url: `/projects/${id}`,
      method: 'PATCH',
      data: input,
    })
  },

  updates(id: number) {
    return request<ProjectUpdatesWorkspace>({
      url: `/projects/mine/${id}/updates`,
    })
  },

  createUpdate(id: number, input: ProjectUpdateInput) {
    return request<ProjectUpdate>({
      url: `/projects/mine/${id}/updates`,
      method: 'POST',
      data: input,
    })
  },

  updateUpdate(updateId: number, input: ProjectUpdateInput) {
    return request<ProjectUpdate>({
      url: `/project-updates/mine/${updateId}`,
      method: 'PATCH',
      data: input,
    })
  },

  deleteUpdate(updateId: number) {
    return request<ProjectUpdateDeleteResult>({
      url: `/project-updates/mine/${updateId}`,
      method: 'DELETE',
    })
  },
}
