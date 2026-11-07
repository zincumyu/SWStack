import { request } from './http'
import type { SearchQuery, SearchResults } from './types'

export const searchApi = {
  search(query: SearchQuery) {
    return request<SearchResults>({
      url: '/search',
      params: { ...query },
    })
  },
}
