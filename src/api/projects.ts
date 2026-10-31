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
}
