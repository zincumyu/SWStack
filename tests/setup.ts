import { beforeAll } from 'vitest'

beforeAll(() => {
  // jsdom 未实现 scrollTo, 路由 scrollBehavior 会调用它
  window.scrollTo = () => undefined
})
