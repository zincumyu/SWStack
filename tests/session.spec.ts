import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/errors'
import { useSessionStore } from '@/stores/session'

vi.mock('@/api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

const { authApi } = await import('@/api/auth')
const meMock = vi.mocked(authApi.me)

describe('session store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks the session initialized after a successful load', async () => {
    meMock.mockResolvedValueOnce({ id: 6, name: 'Ada' } as never)
    const store = useSessionStore()

    await store.load()

    expect(store.isAuthenticated).toBe(true)
    expect(store.initialized).toBe(true)
    expect(store.error).toBeNull()
  })

  it('treats 401 as a confirmed guest session', async () => {
    meMock.mockRejectedValueOnce(new ApiError('未登录', 401))
    const store = useSessionStore()

    await store.load()

    expect(store.initialized).toBe(true)
    expect(store.isAuthenticated).toBe(false)
    expect(store.error).toBeNull()
  })

  it('keeps the session retryable after a network or server failure', async () => {
    meMock.mockRejectedValueOnce(new ApiError('服务暂不可用', 503))
    const store = useSessionStore()

    await store.load()

    expect(store.initialized).toBe(false)
    expect(store.error).toBe('服务暂不可用')

    meMock.mockResolvedValueOnce({ id: 6, name: 'Ada' } as never)
    await store.load()

    expect(meMock).toHaveBeenCalledTimes(2)
    expect(store.isAuthenticated).toBe(true)
    expect(store.initialized).toBe(true)
    expect(store.error).toBeNull()
  })

  it('deduplicates concurrent load calls', async () => {
    let resolveMe: (value: unknown) => void = () => undefined
    meMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveMe = resolve
      }) as never,
    )
    const store = useSessionStore()

    const first = store.load()
    const second = store.load()
    expect(meMock).toHaveBeenCalledTimes(1)

    resolveMe({ id: 1, name: 'Admin' })
    await Promise.all([first, second])

    expect(store.initialized).toBe(true)
  })

  it('marks initialized after login and resets on logout', async () => {
    meMock.mockRejectedValueOnce(new ApiError('未登录', 401))
    vi.mocked(authApi.logout).mockResolvedValueOnce({ success: true })
    vi.mocked(authApi.login).mockResolvedValueOnce({
      user: { id: 1, name: 'Admin' },
      token: 'demo',
    } as never)
    const store = useSessionStore()

    await store.login({ email: 'admin@swstack.dev', password: 'admin123', remember: true })
    expect(store.isAuthenticated).toBe(true)
    expect(store.initialized).toBe(true)

    await store.logout()
    expect(store.isAuthenticated).toBe(false)
  })
})
