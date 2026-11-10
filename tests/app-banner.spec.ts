import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/errors'
import App from '@/App.vue'

vi.mock('@/api/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() },
}))
vi.mock('@/api/community', () => ({
  communityApi: { overview: vi.fn().mockRejectedValue(new Error('offline')) },
}))
vi.mock('@/api/projects', () => ({
  projectApi: { board: vi.fn().mockRejectedValue(new Error('offline')) },
}))

const { authApi } = await import('@/api/auth')
const meMock = vi.mocked(authApi.me)

const stubs = {
  AppHeader: true,
  AppFooter: true,
  ToastHost: true,
  RouterView: true,
}

function mountApp() {
  return mount(App, { global: { stubs } })
}

describe('App startup session handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows a retry banner when the session request fails and hides it once retried', async () => {
    meMock.mockRejectedValueOnce(new ApiError('网关超时', 504))
    const wrapper = mountApp()
    await vi.waitFor(() => expect(wrapper.find('.app-banner').exists()).toBe(true))
    expect(wrapper.text()).toContain('网关超时')

    meMock.mockResolvedValueOnce({ id: 6, name: 'Ada', role: 'member' } as never)
    await wrapper.find('.app-banner button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('.app-banner').exists()).toBe(false))
    expect(meMock).toHaveBeenCalledTimes(2)
  })

  it('stays quiet for a confirmed guest (401)', async () => {
    meMock.mockRejectedValueOnce(new ApiError('未登录', 401))
    const wrapper = mountApp()
    await vi.waitFor(() => expect(meMock).toHaveBeenCalled())
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.app-banner').exists()).toBe(false)
  })
})
