import { request } from './http'
import type {
  SearchQuery,
  SearchResults,
  SearchSuggestionResult,
  TrendingSearchTerm,
} from './types'

export const searchApi = {
  search(query: SearchQuery) {
    return request<SearchResults>({
      url: '/search',
      params: { ...query },
    })
  },

  suggest(q: string, limit = 8) {
    return request<SearchSuggestionResult>({
      url: '/search/suggest',
      params: { q, limit },
    })
  },

  trending() {
    return request<TrendingSearchTerm[]>({ url: '/search/trending' })
  },
}
