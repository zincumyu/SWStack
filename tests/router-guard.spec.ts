import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/errors'
import router from '@/router'
import { useSessionStore } from '@/stores/session'

vi.mock('@/api/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() },
}))
vi.mock('@/views/QuestionsView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/WelcomeView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/LoginView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/AdminDashboardView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/admin/AdminShell.vue', () => ({ default: { template: '<div />' } }))

const { authApi } = await import('@/api/auth')
const meMock = vi.mocked(authApi.me)

function signInAs(role: 'admin' | 'member'): void {
  const store = useSessionStore()
  store.user = { id: role === 'admin' ? 1 : 6, name: 'Ada', role } as never
  store.initialized = true
}

describe('router guards', () => {
  beforeEach(async () => {
    meMock.mockReset()
    meMock.mockRejectedValue(new ApiError('未登录', 401))
    setActivePinia(createPinia())
    await router.replace('/')
    await router.isReady()
    await router.replace('/welcome')
  })

  it('sends guests to welcome and keeps the redirect target', async () => {
    await router.push('/ask')

    expect(router.currentRoute.value.name).toBe('welcome')
    expect(router.currentRoute.value.query.redirect).toBe('/ask')
  })

  it('lets a signed-in member into authenticated pages', async () => {
    signInAs('member')

    await router.push('/ask')

    expect(router.currentRoute.value.name).toBe('ask')
  })

  it('blocks members from the admin area', async () => {
    signInAs('member')

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('questions')
  })

  it('keeps an admin on the admin area', async () => {
    signInAs('admin')

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })
})
