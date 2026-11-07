import { request } from './http'
import type {
  AdminColumn,
  AdminColumnDetail,
  AdminColumnQuery,
  ColumnDetail,
  ColumnInput,
  ColumnQuery,
  ColumnSummary,
  ColumnWorkspaceDetail,
  ColumnWorkspaceItem,
  MyColumnQuery,
  PageResult,
} from './types'

export const columnApi = {
  list(query: ColumnQuery) {
    return request<PageResult<ColumnSummary>>({
      url: '/columns',
      params: { ...query },
    })
  },

  detail(slug: string) {
    return request<ColumnDetail>({
      url: `/columns/${encodeURIComponent(slug)}`,
    })
  },
}

export const myColumnApi = {
  list(query: MyColumnQuery) {
    return request<PageResult<ColumnWorkspaceItem>>({
      url: '/my/columns',
      params: { ...query },
    })
  },

  detail(id: number) {
    return request<ColumnWorkspaceDetail>({ url: `/my/columns/${id}` })
  },

  create(input: ColumnInput) {
    return request<ColumnWorkspaceDetail>({
      url: '/my/columns',
      method: 'POST',
      data: input,
    })
  },

  update(id: number, input: ColumnInput) {
    return request<ColumnWorkspaceDetail>({
      url: `/my/columns/${id}`,
      method: 'PUT',
      data: input,
    })
  },

  patch(id: number, patch: { status: ColumnWorkspaceItem['status'] }) {
    return request<ColumnWorkspaceItem>({
      url: `/my/columns/${id}`,
      method: 'PATCH',
      data: patch,
    })
  },

  remove(id: number) {
    return request<{ id: number; deleted: boolean }>({
      url: `/my/columns/${id}`,
      method: 'DELETE',
    })
  },
}

export const adminColumnApi = {
  list(query: AdminColumnQuery) {
    return request<PageResult<AdminColumn>>({
      url: '/admin/columns',
      params: { ...query },
    })
  },

  detail(id: number) {
    return request<AdminColumnDetail>({ url: `/admin/columns/${id}` })
  },

  create(input: ColumnInput) {
    return request<AdminColumnDetail>({
      url: '/admin/columns',
      method: 'POST',
      data: input,
    })
  },

  update(id: number, input: ColumnInput) {
    return request<AdminColumnDetail>({
      url: `/admin/columns/${id}`,
      method: 'PUT',
      data: input,
    })
  },

  patch(id: number, patch: { status?: AdminColumn['status']; featured?: boolean }) {
    return request<AdminColumn>({
      url: `/admin/columns/${id}`,
      method: 'PATCH',
      data: patch,
    })
  },

  remove(id: number) {
    return request<{ id: number; deleted: boolean }>({
      url: `/admin/columns/${id}`,
      method: 'DELETE',
    })
  },
}
