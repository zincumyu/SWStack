import { request } from './http'
import type { CommunityOverview } from './types'

export const communityApi = {
  overview() {
    return request<CommunityOverview>({ url: '/community/overview' })
  },
}
