import { request } from './http'
import type { Tag } from './types'

export const tagApi = {
  list() {
    return request<Tag[]>({ url: '/tags' })
  },
}
