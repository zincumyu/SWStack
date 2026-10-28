import { request } from './http'
import type {
  AdminDeleteResult,
  AdminOverview,
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
}
