import { request } from './http'
import type { AuthResult, LoginInput } from './types'

export const authApi = {
  login(input: LoginInput) {
    return request<AuthResult>({
      url: '/auth/login',
      method: 'POST',
      data: input,
    })
  },

  logout() {
    return request<{ success: boolean }>({
      url: '/auth/logout',
      method: 'POST',
    })
  },

  me() {
    return request<AuthResult['user']>({ url: '/session/me' })
  },
}
