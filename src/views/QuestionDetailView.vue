<template>
  <div class="page-container">
    <nav class="detail-breadcrumb" aria-label="面包屑">
      <RouterLink to="/">所有问题</RouterLink>
      <ChevronRight :size="12" aria-hidden="true" />
      <span>问题 {{ route.params.id }}</span>
    </nav>

    <div v-if="store.loading" class="detail-loading">
      <div class="panel skeleton-card">
        <span class="skeleton loading-heading" />
        <span class="skeleton loading-meta" />
        <div class="loading-body">
          <span class="skeleton loading-rail" />
          <div class="loading-paragraphs">
            <span class="skeleton loading-line" />
            <span class="skeleton loading-line" />
            <span class="skeleton loading-line short" />
            <span class="skeleton loading-code" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="store.error || !question" class="detail-error panel">
      <EmptyState
        :title="store.notFound ? '没有找到这个问题' : '加载问题失败'"
        :description="store.error || '问题可能已被移动或删除.'"
      >
        <div class="error-actions">
          <RouterLink class="btn btn-secondary btn-sm" to="/">返回问题列表</RouterLink>
          <button class="btn btn-primary btn-sm" type="button" @click="retryLoad">重新加载</button>
        </div>
      </EmptyState>
    </div>

    <div v-else class="content-grid detail-grid">
      <main class="primary-column">
        <article class="panel question-post">
          <header class="question-head">
            <h1>{{ question.title }}</h1>
            <div class="question-meta">
              <span>
                提问于
                <time :datetime="question.createdAt" :title="formatDateTime(question.createdAt)">
                  {{ formatRelativeTime(question.createdAt) }}
                </time>
              </span>
              <span class="meta-dot" aria-hidden="true" />
              <span>最近活动 {{ formatRelativeTime(question.lastActivityAt) }}</span>
              <span class="meta-dot" aria-hidden="true" />
              <span>浏览 {{ formatNumber(question.viewCount) }} 次</span>
              <span v-if="question.hasAcceptedAnswer" class="resolved-badge">
                <CheckCircle2 :size="12" />
                已解决
              </span>
            </div>
          </header>

          <div class="post-layout">
            <QuestionVoteControl
              class="post-vote"
              :score="question.score"
              :vote="question.viewerVote"
              :bookmarked="question.bookmarked"
              :disabled="voteBusy || bookmarkBusy"
              @vote="handleVote"
              @bookmark="handleBookmark"
            />

            <div class="post-main">
              <MarkdownRenderer :source="question.body" />

              <div class="post-tags">
                <TagChip v-for="tag in question.tags" :key="tag.slug" :tag="tag" size="lg" />
              </div>

              <CommentList :comments="question.comments" />

              <div class="post-footer">
                <div class="post-actions">
                  <button class="post-action" type="button" @click="shareQuestion">
                    <Share2 :size="14" />
                    分享
                  </button>
                  <button
                    class="post-action"
                    :class="{ active: following }"
                    type="button"
                    :aria-pressed="following"
                    @click="toggleFollow"
                  >
                    <BellPlus :size="14" />
                    {{ following ? '已关注' : '关注' }}
                  </button>
                </div>

                <div class="post-author-card">
                  <div class="author-caption">提问于 {{ formatDateTime(question.createdAt) }}</div>
                  <div class="author-identity">
                    <UserAvatar :user="question.author" :size="32" />
                    <div class="author-copy">
                      <RouterLink
                        :to="{ name: 'user-profile', params: { handle: question.author.handle } }"
                      >
                        {{ question.author.name }}
                      </RouterLink>
                      <span>{{ formatCompact(question.author.reputation) }} 声望</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <section class="panel answers-panel" aria-labelledby="answers-title">
          <div class="answers-head">
            <div class="answers-title-wrap">
              <h2 id="answers-title">{{ answersSorted.length }} 个回答</h2>
              <span v-if="question.hasAcceptedAnswer" class="accepted-note">
                <Check :size="12" />
                提问者已采纳一个回答
              </span>
            </div>
            <div v-if="answersSorted.length > 1" class="answer-sort" role="group" aria-label="回答排序">
              <button
                class="sort-button"
                :class="{ active: answerSort === 'votes' }"
                type="button"
                @click="answerSort = 'votes'"
              >
                最高票
              </button>
              <button
                class="sort-button"
                :class="{ active: answerSort === 'newest' }"
                type="button"
                @click="answerSort = 'newest'"
              >
                最新
              </button>
            </div>
          </div>

          <div v-if="answersSorted.length === 0" class="no-answers">
            <p>这个问题还没有回答.</p>
            <span>
              {{
                sessionStore.isAuthenticated
                  ? '在下方写下你的思路, 成为第一个回答的人.'
                  : '登录后可以写下你的思路.'
              }}
            </span>
          </div>

          <AnswerItem
            v-for="answer in answersSorted"
            :key="answer.id"
            :answer="answer"
            @vote="handleAnswerVote"
          />
        </section>

        <div v-if="sessionStore.isAuthenticated" class="answer-editor-wrap">
          <AnswerEditor
            ref="editorRef"
            :submitting="submittingAnswer"
            @submit="handleSubmitAnswer"
          />
        </div>
        <div v-else class="login-callout panel">
          <div class="login-callout-copy">
            <span class="login-callout-icon"><LogIn :size="16" /></span>
            <div>
              <strong>登录后参与回答</strong>
              <p>用可复现的步骤和关键代码, 帮助提问者定位问题.</p>
            </div>
          </div>
          <RouterLink class="btn btn-primary btn-sm" :to="loginLink">登录</RouterLink>
        </div>
      </main>

      <aside class="sidebar-rail">
        <RelatedQuestionsCard :questions="question.related" />
        <PopularTagsCard />
        <AskTipsCard />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BellPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  LogIn,
  Share2,
} from 'lucide-vue-next'
import AnswerEditor from '@/components/questions/AnswerEditor.vue'
import AnswerItem from '@/components/questions/AnswerItem.vue'
import CommentList from '@/components/questions/CommentList.vue'
import QuestionVoteControl from '@/components/questions/QuestionVoteControl.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import TagChip from '@/components/common/TagChip.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AskTipsCard from '@/components/sidebar/AskTipsCard.vue'
import PopularTagsCard from '@/components/sidebar/PopularTagsCard.vue'
import RelatedQuestionsCard from '@/components/sidebar/RelatedQuestionsCard.vue'
import { useQuestionDetailStore } from '@/stores/question-detail'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toast'
import { copyCurrentUrl } from '@/utils/clipboard'
import {
  formatCompact,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils/format'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const store = useQuestionDetailStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

const voteBusy = ref(false)
const bookmarkBusy = ref(false)
const submittingAnswer = ref(false)
const following = ref(false)
const answerSort = ref<'votes' | 'newest'>('votes')
const editorRef = ref<{ reset: () => void } | null>(null)

const question = computed(() => store.question)
const loginLink = computed(() => ({
  name: 'login',
  query: { redirect: route.fullPath },
}))
const answersSorted = computed(() => {
  const list = [...(question.value?.answersList ?? [])]
  if (answerSort.value === 'newest') {
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  return list.sort((a, b) => {
    if (a.accepted !== b.accepted) {
      return a.accepted ? -1 : 1
    }
    return b.score - a.score
  })
})

function loadQuestion(id: number): void {
  void store.load(id)
}

function retryLoad(): void {
  loadQuestion(Number(route.params.id))
}

function requireLogin(message: string): boolean {
  if (sessionStore.isAuthenticated) {
    return true
  }
  toastStore.info(message)
  void router.push({ name: 'login', query: { redirect: route.fullPath } })
  return false
}

async function handleVote(value: -1 | 1): Promise<void> {
  if (voteBusy.value || !requireLogin('登录后才能投票')) {
    return
  }
  voteBusy.value = true
  try {
    await store.vote(value)
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    voteBusy.value = false
  }
}

async function handleBookmark(): Promise<void> {
  if (bookmarkBusy.value || !requireLogin('登录后才能收藏')) {
    return
  }
  bookmarkBusy.value = true
  try {
    const bookmarked = await store.toggleBookmark()
    toastStore.show(bookmarked ? '已收藏问题' : '已取消收藏', 'info')
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    bookmarkBusy.value = false
  }
}

async function handleAnswerVote(answerId: number, value: -1 | 1): Promise<void> {
  if (!requireLogin('登录后才能给回答投票')) {
    return
  }
  try {
    await store.voteAnswer(answerId, value)
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function handleSubmitAnswer(body: string): Promise<void> {
  if (submittingAnswer.value || !requireLogin('登录后才能回答问题')) {
    return
  }
  submittingAnswer.value = true
  try {
    await store.submitAnswer(body)
    editorRef.value?.reset()
    toastStore.success('回答已发布')
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    submittingAnswer.value = false
  }
}

async function shareQuestion(): Promise<void> {
  try {
    await copyCurrentUrl()
    toastStore.success('链接已复制到剪贴板')
  } catch {
    toastStore.error('复制链接失败')
  }
}

function toggleFollow(): void {
  if (!requireLogin('登录后才能关注问题')) {
    return
  }
  following.value = !following.value
  toastStore.info(following.value ? '已关注这个问题' : '已取消关注')
}

watch(
  () => route.params.id,
  (value) => {
    const id = Number(value)
    if (Number.isFinite(id) && id > 0) {
      answerSort.value = 'votes'
      following.value = false
      loadQuestion(id)
    }
  },
  { immediate: true },
)

watchEffect(() => {
  document.title = question.value
    ? `${question.value.title} - SWStack`
    : '问题详情 - SWStack'
})

onBeforeUnmount(() => {
  store.reset()
})
</script>

<style scoped>
.detail-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  color: var(--text-faint);
  font-size: 11px;
}

.detail-breadcrumb a {
  color: var(--text-muted);
}

.detail-breadcrumb a:hover {
  color: var(--link-hover);
}

.question-post {
  overflow: hidden;
}

.question-head {
  padding: 16px 20px 12px;
}

.question-head h1 {
  margin: 0 0 7px;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.55px;
  line-height: 1.32;
  overflow-wrap: anywhere;
}

.question-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--text-muted);
  font-size: 11px;
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border-strong);
}

.resolved-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 3px;
  padding: 1px 6px;
  border: 1px solid #c8e0d1;
  border-radius: 2px;
  background: var(--accepted-bg);
  color: var(--accepted);
  font-size: 9.5px;
  font-weight: 500;
}

.post-layout {
  display: flex;
  gap: 18px;
  padding: 3px 20px 18px;
}

.post-vote {
  margin-top: 5px;
}

.post-main {
  min-width: 0;
  flex: 1;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 17px;
}

.post-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-top: 16px;
}

.post-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 13px;
  padding-bottom: 3px;
}

.post-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 1px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 11.5px;
}

.post-action:hover {
  color: var(--text);
}

.post-action.active {
  color: var(--brand-hover);
}

.post-author-card {
  width: 246px;
  flex: 0 0 auto;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.author-caption {
  margin-bottom: 7px;
  color: var(--text-faint);
  font-size: 10px;
}

.author-identity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.author-copy a {
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-copy span {
  color: var(--text-muted);
  font-size: 10.5px;
}

.answers-panel {
  margin-top: 14px;
  overflow: hidden;
}

.answers-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
}

.answers-title-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
}

.answers-head h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
}

.accepted-note {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--accepted);
  font-size: 10px;
}

.answer-sort {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
}

.sort-button {
  height: 26px;
  padding: 0 8px;
  border: 0;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 10px;
}

.sort-button + .sort-button {
  border-left: 1px solid var(--border);
}

.sort-button:hover {
  background: var(--surface-subtle);
}

.sort-button.active {
  background: var(--surface-muted);
  color: var(--text);
  font-weight: 600;
}

.no-answers {
  padding: 38px 20px;
  text-align: center;
}

.no-answers p {
  margin: 0 0 3px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.no-answers span {
  color: var(--text-faint);
  font-size: 11px;
}

.answer-editor-wrap {
  margin-top: 14px;
}

.login-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  padding: 14px 16px;
}

.login-callout-copy {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.login-callout-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.login-callout-copy strong {
  display: block;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
}

.login-callout-copy p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.55;
}

@media (max-width: 560px) {
  .login-callout {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
}

.detail-error {
  max-width: 880px;
}

.error-actions {
  display: flex;
  gap: 7px;
}

.detail-loading {
  max-width: 880px;
}

.skeleton-card {
  padding: 20px;
}

.loading-heading {
  display: block;
  width: 68%;
  height: 26px;
}

.loading-meta {
  display: block;
  width: 39%;
  height: 9px;
  margin-top: 11px;
}

.loading-body {
  display: flex;
  gap: 20px;
  margin-top: 26px;
}

.loading-rail {
  width: 48px;
  height: 105px;
  flex: 0 0 48px;
}

.loading-paragraphs {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
}

.loading-line {
  width: 100%;
  height: 11px;
}

.loading-line.short {
  width: 64%;
}

.loading-code {
  width: 100%;
  height: 120px;
  margin-top: 6px;
}

@media (max-width: 900px) {
  .detail-loading,
  .detail-error {
    max-width: none;
  }
}

@media (max-width: 720px) {
  .question-head {
    padding: 14px 13px 10px;
  }

  .question-head h1 {
    font-size: 20px;
    letter-spacing: -0.35px;
  }

  .question-meta {
    gap: 4px 6px;
    font-size: 10px;
  }

  .meta-dot {
    display: none;
  }

  .question-meta > span:not(.resolved-badge) {
    margin-right: 5px;
  }

  .post-layout {
    flex-direction: column;
    gap: 10px;
    padding: 2px 13px 14px;
  }

  .post-vote {
    margin-top: 0;
  }

  .post-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .post-actions {
    padding-bottom: 0;
  }

  .post-author-card {
    width: 100%;
  }

  .answers-head {
    align-items: flex-start;
    padding: 12px 13px;
  }

  .answers-head h2 {
    font-size: 16px;
  }

  .accepted-note {
    width: 100%;
    margin-top: -4px;
  }

  .answer-sort {
    flex: 0 0 auto;
  }

  .loading-heading {
    width: 90%;
    height: 22px;
  }

  .loading-body {
    gap: 12px;
  }

  .loading-rail {
    display: none;
  }
}
</style>
