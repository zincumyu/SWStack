import type {
  FollowResult,
  FollowStatus,
  FollowingFeedItem,
  FollowingFeedQuery,
  PageResult,
} from './types'
import { request } from './http'

export const followApi = {
  status() {
    return request<FollowStatus>({ url: '/me/follows' })
  },

  toggleUser(handle: string) {
    return request<FollowResult>({
      url: `/users/${encodeURIComponent(handle)}/follow`,
      method: 'POST',
    })
  },

  toggleTag(slug: string) {
    return request<FollowResult>({
      url: `/tags/${encodeURIComponent(slug)}/follow`,
      method: 'POST',
    })
  },

  feed(query: FollowingFeedQuery = {}) {
    return request<PageResult<FollowingFeedItem>>({
      url: '/feed/following',
      params: { ...query },
    })
  },
}
