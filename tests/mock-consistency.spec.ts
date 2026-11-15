import { afterEach, describe, expect, it } from 'vitest'
import { adminApi } from '@/api/admin'
import { notificationApi } from '@/api/notifications'
import { projectApi } from '@/api/projects'
import { questionApi } from '@/api/questions'
import { userApi } from '@/api/users'
import type { ProjectDraftInput } from '@/api/types'
import { ApiError } from '@/api/errors'
import { clearSession, persistSession, setQuestionStatus, setTagStatus } from '@/mocks/admin-state'
import { questions } from '@/mocks/data'
import { getProjectReviewStatus, projectSeeds } from '@/mocks/projects'

const ADMIN_ID = 1
const CHENMO_ID = 3
const HEJIA_ID = 4
const STUDENT_ID = 6
const QUESTION_ID = 101

function signIn(userId: number): void {
  clearSession()
  persistSession(userId, false)
}

function questionById(id: number): (typeof questions)[number] {
  const question = questions.find((item) => item.id === id)
  if (!question) {
    throw new Error(`missing question fixture ${id}`)
  }
  return question
}

async function expectStatus(action: Promise<unknown>, status: number): Promise<void> {
  let failure: unknown = null
  try {
    await action
  } catch (cause) {
    failure = cause
  }
  expect(failure).toBeInstanceOf(ApiError)
  expect((failure as ApiError).status).toBe(status)
}

describe('mock state consistency', () => {
  afterEach(() => {
    clearSession()
    setQuestionStatus(QUESTION_ID, 'published')
    setTagStatus('vue3', 'active')
  })

  it('keeps question and answer votes and bookmarks isolated by account', async () => {
    const answer = questionById(QUESTION_ID).answersList[0]
    if (!answer) {
      throw new Error('question fixture 101 needs an answer')
    }

    signIn(STUDENT_ID)
    const studentInitial = await questionApi.get(QUESTION_ID)
    const initialScore = studentInitial.score
    const initialAnswerScore = studentInitial.answersList.find(
      (item) => item.id === answer.id,
    )!.score
    await questionApi.vote(QUESTION_ID, 1)
    await questionApi.voteAnswer(answer.id, 1)
    await questionApi.bookmark(QUESTION_ID, true)

    signIn(CHENMO_ID)
    const otherInitial = await questionApi.get(QUESTION_ID)
    expect(otherInitial.viewerVote).toBe(0)
    expect(otherInitial.bookmarked).toBe(false)
    expect(otherInitial.answersList.find((item) => item.id === answer.id)?.viewerVote).toBe(0)

    await questionApi.vote(QUESTION_ID, -1)
    await questionApi.voteAnswer(answer.id, -1)
    await questionApi.bookmark(QUESTION_ID, true)
    const other = await questionApi.get(QUESTION_ID)
    expect(other.viewerVote).toBe(-1)
    expect(other.bookmarked).toBe(true)
    expect(other.score).toBe(initialScore)
    expect(other.answersList.find((item) => item.id === answer.id)?.score).toBe(initialAnswerScore)

    signIn(STUDENT_ID)
    const student = await questionApi.get(QUESTION_ID)
    expect(student.viewerVote).toBe(1)
    expect(student.bookmarked).toBe(true)
    expect(student.answersList.find((item) => item.id === answer.id)?.viewerVote).toBe(1)
  })

  it('removes hidden questions from public author profiles', async () => {
    setQuestionStatus(QUESTION_ID, 'hidden')

    const profile = await userApi.get(questionById(QUESTION_ID).author.handle)

    expect(profile.recentQuestions.some((item) => item.id === QUESTION_ID)).toBe(false)
    await expectStatus(questionApi.get(QUESTION_ID), 404)
  })

  it('hides questions filtered by a hidden tag', async () => {
    const tagged = questionById(QUESTION_ID)
    const tag = tagged.tags[0]
    if (!tag) {
      throw new Error('question fixture 101 needs a tag')
    }
    setTagStatus(tag.slug, 'hidden')

    const result = await questionApi.list({ tag: tag.slug })

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })

  it('does not reuse an answer id after its question is deleted', async () => {
    signIn(STUDENT_ID)
    const created = await questionApi.create({
      title: 'Temporary question for answer id audit',
      body: 'This question exists only to verify answer identifier allocation after deletion.',
      tags: ['vue3'],
    })
    const answer = await questionApi.createAnswer(created.id, {
      body: 'This temporary answer exists only to verify answer identifier allocation after deletion.',
    })

    signIn(ADMIN_ID)
    await adminApi.deleteQuestion(created.id)

    signIn(STUDENT_ID)
    const next = await questionApi.createAnswer(QUESTION_ID, {
      body: 'This answer verifies that a deleted answer id is not reused by a later answer.',
    })
    expect(next.id).toBeGreaterThan(answer.id)
  })

  it('does not leave a pending application for an existing project member', async () => {
    const project = projectSeeds.find((item) => item.id === 1)
    if (!project) {
      throw new Error('missing project fixture 1')
    }
    expect(project.members.some((item) => item.handle === 'hejia')).toBe(true)

    signIn(HEJIA_ID)
    const detail = await projectApi.detail('campus-flow')
    expect(detail.viewerApplication?.status).toBe('accepted')

    signIn(STUDENT_ID)
    const workspace = await projectApi.applications(1)
    expect(
      workspace.applications.some(
        (item) => item.applicant.handle === 'hejia' && item.status === 'pending',
      ),
    ).toBe(false)
  })

  it('rejects accepting an application if the applicant is already a member', async () => {
    signIn(HEJIA_ID)
    const created = await projectApi.apply(4, {
      skills: ['TypeScript'],
      focus: '进度看板',
      message: '我可以负责进度看板的数据结构, 每周投入 6 小时.',
    })
    projectSeeds
      .find((item) => item.id === 4)
      ?.members.push({
        handle: 'hejia',
        role: '进度看板',
      })

    signIn(HEJIA_ID)
    const before = await notificationApi.unreadCount()

    signIn(11)
    await expectStatus(projectApi.reviewApplication(created.id, { status: 'accepted' }), 409)

    signIn(HEJIA_ID)
    const after = await notificationApi.unreadCount()
    expect(after.unread).toBe(before.unread)
  })

  it('does not reuse a deleted project id or its related records', async () => {
    const highest = projectSeeds.reduce((current, item) => (item.id > current.id ? item : current))
    const seed = projectSeeds.find((item) => item.id === highest.id)
    if (!seed) {
      throw new Error('missing highest project fixture')
    }

    signIn(ADMIN_ID)
    await adminApi.deleteProject(seed.id)

    const input: ProjectDraftInput = {
      name: 'Reused Project',
      slug: 'reused-project',
      tagline: 'A temporary project created during the audit.',
      coverImage: '/projects/project-default.svg',
      screenshots: [],
      techStack: ['Vue 3'],
      status: 'idea',
      needs: ['teammates'],
      teamName: 'Audit Team',
      githubUrl: 'https://example.com/reused-project',
      demoUrl: 'https://example.com/reused-project-demo',
      readme:
        'This temporary project verifies that ids and related records stay isolated after a project deletion.',
    }

    signIn(STUDENT_ID)
    const created = await projectApi.create(input)
    expect(created.id).toBeGreaterThan(seed.id)
    expect(getProjectReviewStatus(created.id)).toBe('pending')

    const applications = await projectApi.applications(created.id)
    expect(applications.applications).toEqual([])
  })
})
