import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { getErrorMessage } from '@/utils/errors'

describe('getErrorMessage', () => {
  it('uses the error message when present', () => {
    expect(getErrorMessage(new ApiError('会话已过期', 401))).toBe('会话已过期')
    expect(getErrorMessage(new Error('network down'))).toBe('network down')
  })

  it('falls back for unknown or empty errors', () => {
    expect(getErrorMessage(undefined)).toBe('请求失败, 请稍后重试')
    expect(getErrorMessage('boom')).toBe('请求失败, 请稍后重试')
    expect(getErrorMessage(new Error(''))).toBe('请求失败, 请稍后重试')
  })
})
