import { request } from './http'
import type { UserProfile, UserSummary } from './types'

export const userApi = {
  list() {
    return request<UserProfile[]>({ url: '/users' })
  },

  get(handle: string) {
    return request<UserProfile>({ url: `/users/${handle}` })
  },

  me() {
    return request<UserSummary>({ url: '/session/me' })
  },
}
