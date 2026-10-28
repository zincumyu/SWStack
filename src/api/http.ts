import axios from 'axios'
import { ApiError } from './errors'
import { mockRequest } from '@/mocks/server'

export interface ApiRequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Record<string, unknown>
  data?: unknown
}

interface ApiEnvelope<T> {
  data: T
  message?: string
}

export const useMockApi = import.meta.env.VITE_USE_MOCK !== 'false'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === 'object' && value !== null && 'data' in value
}

export async function request<T>(config: ApiRequestConfig): Promise<T> {
  if (useMockApi) {
    return mockRequest<T>(config)
  }

  try {
    const response = await http.request<ApiEnvelope<T> | T>({
      url: config.url,
      method: config.method ?? 'GET',
      params: config.params,
      data: config.data,
    })
    const payload = response.data
    return isEnvelope<T>(payload) ? payload.data : payload
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as { message?: string; detail?: string } | undefined
      throw new ApiError(
        payload?.message || payload?.detail || error.message || '请求失败',
        error.response?.status ?? 500,
      )
    }
    throw error
  }
}
