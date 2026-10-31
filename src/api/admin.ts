import { request } from './http'
import type {
  AdminDeleteResult,
  AdminOverview,
  AdminProject,
  AdminProjectDetail,
  AdminProjectPatch,
  AdminProjectQuery,
  AdminProjectsResult,
  AdminQuestion,
  AdminQuestionPatch,
  AdminQuestionQuery,
  AdminTag,
  AdminTagInput,
  AdminTagPatch,
  AdminUser,
  AdminUserPatch,
  AdminUserQuery,
  PageResult,
  ProjectBoardSettings,
} from './types'

export const adminApi = {
  overview() {
    return request<AdminOverview>({ url: '/admin/overview' })
  },

  questions(query: AdminQuestionQuery) {
    return request<PageResult<AdminQuestion>>({
      url: '/admin/questions',
      params: { ...query },
    })
  },

  updateQuestion(id: number, patch: AdminQuestionPatch) {
    return request<AdminQuestion>({
      url: `/admin/questions/${id}`,
      method: 'PATCH',
      data: patch,
    })
  },

  deleteQuestion(id: number) {
    return request<AdminDeleteResult>({
      url: `/admin/questions/${id}`,
      method: 'DELETE',
    })
  },

  users(query: AdminUserQuery) {
    return request<PageResult<AdminUser>>({
      url: '/admin/users',
      params: { ...query },
    })
  },

  updateUser(id: number, patch: AdminUserPatch) {
    return request<AdminUser>({
      url: `/admin/users/${id}`,
      method: 'PATCH',
      data: patch,
    })
  },

  tags() {
    return request<AdminTag[]>({ url: '/admin/tags' })
  },

  createTag(input: AdminTagInput) {
    return request<AdminTag>({
      url: '/admin/tags',
      method: 'POST',
      data: input,
    })
  },

  updateTag(slug: string, patch: AdminTagPatch) {
    return request<AdminTag>({
      url: `/admin/tags/${encodeURIComponent(slug)}`,
      method: 'PATCH',
      data: patch,
    })
  },

  projects(query: AdminProjectQuery) {
    return request<AdminProjectsResult>({
      url: '/admin/projects',
      params: { ...query },
    })
  },

  project(id: number) {
    return request<AdminProjectDetail>({ url: `/admin/projects/${id}` })
  },

  updateProject(id: number, patch: AdminProjectPatch) {
    return request<AdminProject>({
      url: `/admin/projects/${id}`,
      method: 'PATCH',
      data: patch,
    })
  },

  deleteProject(id: number) {
    return request<AdminDeleteResult>({
      url: `/admin/projects/${id}`,
      method: 'DELETE',
    })
  },

  updateProjectBoard(enabled: boolean) {
    return request<ProjectBoardSettings>({
      url: '/admin/projects/board',
      method: 'PATCH',
      data: { enabled },
    })
  },
}
