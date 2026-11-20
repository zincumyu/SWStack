import { afterEach, describe, expect, it } from 'vitest'
import { userApi } from '@/api/users'
import { setQuestionStatus } from '@/mocks/admin-state'

describe('mock public profile privacy', () => {
  afterEach(() => {
    setQuestionStatus(105, 'published')
  })

  it('removes a hidden question from the developer directory and profile', async () => {
    setQuestionStatus(105, 'hidden')

    const profile = await userApi.get('suhe')
    const directory = await userApi.list()
    const suhe = directory.find((item) => item.handle === 'suhe')

    expect(profile.recentQuestions.some((item) => item.id === 105)).toBe(false)
    expect(suhe?.recentQuestions.some((item) => item.id === 105)).toBe(false)
  })
})
