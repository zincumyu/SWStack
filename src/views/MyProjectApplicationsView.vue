<template>
  <div class="page-container project-applications-page">
    <div class="page-back">
      <RouterLink :to="{ name: 'my-projects' }">
        <ArrowLeft :size="13" />
        返回我的项目
      </RouterLink>
    </div>

    <header class="workspace-head">
      <div class="heading-copy">
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          TEAM APPLICATIONS
        </div>
        <h1>组队申请</h1>
        <p>查看队友申请, 接受后申请人会加入项目成员, 处理结果会通过站内通知告知对方.</p>
      </div>
      <div class="head-actions">
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="loading"
          @click="loadWorkspace(true)"
        >
          <RefreshCw :size="12" :class="{ spinning: loading }" />
          {{ loading ? '刷新中' : '刷新' }}
        </button>
        <RouterLink
          v-if="canViewPublic"
          class="btn btn-ghost btn-sm"
          :to="{ name: 'project-detail', params: { slug: project!.slug } }"
        >
          <Eye :size="12" />
          查看公开页
        </RouterLink>
      </div>
    </header>

    <div v-if="invalidId" class="panel page-state">
      <EmptyState title="项目编号无效" description="请从我的项目重新进入组队申请工作台.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <div
      v-else-if="loading && !workspace"
      class="loading-stack"
      aria-busy="true"
      aria-label="组队申请加载中"
    >
      <div class="panel context-skeleton">
        <span class="skeleton loading-cover" />
        <div class="loading-copy">
          <span class="skeleton loading-line short" />
          <span class="skeleton loading-title" />
          <span class="skeleton loading-line" />
        </div>
      </div>
      <div class="panel loading-panel">
        <span class="skeleton loading-line short" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line medium" />
      </div>
    </div>

    <div v-else-if="error && !workspace" class="panel page-state">
      <EmptyState title="加载组队申请失败" :description="error">
        <button class="btn btn-secondary btn-sm" type="button" @click="loadWorkspace(true)">
          重试
        </button>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="!workspace" class="panel page-state">
      <EmptyState title="没有找到这个项目" description="项目可能已被删除, 或你不是项目负责人.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <template v-else>
      <section class="panel project-context" aria-labelledby="applications-project-title">
        <div class="context-cover">
          <img
            :src="project!.coverImage"
            :alt="`${project!.name} 项目封面`"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="context-copy">
          <div class="context-badges">
            <ProjectReviewBadge :status="project!.reviewStatus" />
            <ProjectStatusBadge :status="project!.status" />
            <span v-if="project!.needs.includes('teammates')" class="recruiting-badge">找队友</span>
          </div>
          <h2 id="applications-project-title">{{ project!.name }}</h2>
          <p>{{ project!.tagline }}</p>
          <div class="context-meta">
            <span class="mono">#{{ project!.id }} / {{ project!.slug }}</span>
            <span>{{ project!.memberCount }} 位成员</span>
            <span>{{ pendingCount }} 条待处理</span>
          </div>
        </div>
        <div class="context-summary" :class="{ quiet: pendingCount === 0 }">
          <ClipboardCheck :size="16" aria-hidden="true" />
          <div>
            <strong>{{
              pendingCount ? `${pendingCount} 条申请待处理` : '没有待处理的申请'
            }}</strong>
            <p>待处理申请排在前面, 已处理的申请会保留在下方作为历史记录.</p>
          </div>
        </div>
      </section>

      <p v-if="error" class="inline-error" role="alert">
        <AlertCircle :size="12" aria-hidden="true" />
        {{ error }}
      </p>

      <section class="panel applications-panel" aria-labelledby="application-list-title">
        <div class="panel-header">
          <h2 id="application-list-title" class="panel-title">
            <Inbox :size="14" aria-hidden="true" />
            申请列表
          </h2>
          <span class="panel-note">{{ applications.length }} 条</span>
        </div>

        <div v-if="applications.length === 0" class="applications-empty">
          <EmptyState
            title="还没有组队申请"
            description="项目公开并且标记为找队友后, 成员可以在详情页提交申请."
          >
            <RouterLink
              v-if="canViewPublic"
              class="btn btn-ghost btn-sm"
              :to="{ name: 'project-detail', params: { slug: project!.slug } }"
            >
              查看公开页
            </RouterLink>
          </EmptyState>
        </div>

        <ol v-else class="application-list">
          <li
            v-for="application in applications"
            :key="application.id"
            class="application-entry"
            :class="application.status"
          >
            <div class="entry-head">
              <div class="applicant">
                <UserAvatar :user="application.applicant" :size="30" />
                <div class="applicant-copy">
                  <span class="applicant-name">{{ application.applicant.name }}</span>
                  <span class="applicant-meta">
                    {{ application.applicant.title }} · {{ application.applicant.reputation }} 声望
                  </span>
                </div>
              </div>
              <div class="entry-status">
                <span class="status-chip" :class="application.status">
                  {{ STATUS_META[application.status].label }}
                </span>
                <time :datetime="application.createdAt">
                  {{ formatRelativeTime(application.createdAt) }} 提交
                </time>
              </div>
            </div>

            <dl class="entry-facts">
              <div>
                <dt>想参与的模块</dt>
                <dd>{{ application.focus }}</dd>
              </div>
              <div>
                <dt>相关技能</dt>
                <dd class="skill-line">
                  <span v-for="skill in application.skills" :key="skill" class="skill-chip">
                    {{ skill }}
                  </span>
                </dd>
              </div>
            </dl>

            <p class="entry-message">{{ application.message }}</p>

            <div v-if="application.status !== 'pending'" class="entry-history">
              <span class="history-label">
                {{ application.status === 'accepted' ? '已加入成员' : '已拒绝' }}
              </span>
              <span class="history-time">
                {{ formatRelativeTime(application.updatedAt) }} 处理
              </span>
              <p v-if="application.reviewNote" class="history-note">
                <strong>处理留言</strong>
                {{ application.reviewNote }}
              </p>
            </div>

            <div v-else class="entry-actions">
              <p v-if="activeId === application.id" class="confirm-copy" role="status">
                {{
                  reviewStatus === 'accepted'
                    ? '接受后申请人会立即加入成员列表.'
                    : '拒绝后申请人会收到带原因的通知.'
                }}
              </p>
              <template v-if="activeId === application.id">
                <textarea
                  v-if="reviewStatus === 'rejected'"
                  v-model="reviewNote"
                  class="review-note-field"
                  rows="3"
                  maxlength="200"
                  placeholder="填写拒绝原因, 5-200 个字符, 申请人会在通知中看到."
                  :aria-invalid="Boolean(reviewError)"
                  aria-label="拒绝原因"
                />
                <span v-if="reviewError" class="review-note-error">{{ reviewError }}</span>
                <div class="confirm-actions">
                  <button
                    class="btn btn-primary btn-sm"
                    type="button"
                    :disabled="reviewing"
                    @click="submitReview(application)"
                  >
                    {{
                      reviewing
                        ? '处理中...'
                        : reviewStatus === 'accepted'
                          ? '确认接受'
                          : '确认拒绝'
                    }}
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    type="button"
                    :disabled="reviewing"
                    @click="cancelReview"
                  >
                    取消
                  </button>
                </div>
              </template>
              <template v-else>
                <button
                  class="btn btn-primary btn-sm"
                  type="button"
                  @click="startReview(application, 'accepted')"
                >
                  <UserCheck :size="12" />
                  接受
                </button>
                <button
                  class="btn btn-secondary btn-sm"
                  type="button"
                  @click="startReview(application, 'rejected')"
                >
                  <UserX :size="12" />
                  拒绝
                </button>
              </template>
            </div>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  ClipboardCheck,
  Eye,
  Inbox,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import ProjectReviewBadge from '@/components/projects/ProjectReviewBadge.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import { projectApi } from '@/api/projects'
import type {
  ProjectApplication,
  ProjectApplicationReviewInput,
  ProjectApplicationStatus,
  ProjectApplicationsWorkspace,
} from '@/api/types'
import { useAdminStore } from '@/stores/admin'
import { useMyProjectsStore } from '@/stores/my-projects'
import { useNotificationStore } from '@/stores/notifications'
import { useProjectStore } from '@/stores/projects'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime } from '@/utils/format'

const route = useRoute()
const projectStore = useProjectStore()
const adminStore = useAdminStore()
const myProjectsStore = useMyProjectsStore()
const notificationStore = useNotificationStore()
const toastStore = useToastStore()

const STATUS_META: Record<ProjectApplicationStatus, { label: string }> = {
  pending: { label: '待处理' },
  accepted: { label: '已接受' },
  rejected: { label: '已拒绝' },
}

const projectId = computed(() => Number(route.params.id))
const invalidId = computed(() => !Number.isInteger(projectId.value) || projectId.value <= 0)
const workspace = ref<ProjectApplicationsWorkspace | null>(null)
const loading = ref(false)
const error = ref('')
const reviewing = ref(false)
const activeId = ref<number | null>(null)
const reviewError = ref('')
const reviewStatus = ref<ProjectApplicationReviewInput['status']>('accepted')
const reviewNote = ref('')

let loadSequence = 0

const project = computed(() => workspace.value?.project ?? null)
const applications = computed(() => workspace.value?.applications ?? [])
const pendingCount = computed(
  () => applications.value.filter((item) => item.status === 'pending').length,
)
const canViewPublic = computed(
  () =>
    project.value?.reviewStatus === 'approved' &&
    project.value.visibility === 'published' &&
    projectStore.boardEnabled,
)

watch(
  projectId,
  () => {
    workspace.value = null
    error.value = ''
    activeId.value = null
    if (invalidId.value) {
      return
    }
    void loadWorkspace()
  },
  { immediate: true },
)

watch(
  project,
  (value) => {
    if (value) {
      document.title = `${value.name} 组队申请 - SWStack`
    }
  },
  { immediate: true },
)

void projectStore.loadBoard()

async function loadWorkspace(force = false): Promise<void> {
  if (invalidId.value || (loading.value && !force)) {
    return
  }
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''

  try {
    const result = await projectApi.applications(projectId.value)
    if (sequence !== loadSequence) {
      return
    }
    workspace.value = result
  } catch (cause) {
    if (sequence !== loadSequence) {
      return
    }
    error.value = getErrorMessage(cause)
  } finally {
    if (sequence === loadSequence) {
      loading.value = false
    }
  }
}

function startReview(application: ProjectApplication, status: 'accepted' | 'rejected'): void {
  if (reviewing.value || application.status !== 'pending') {
    return
  }
  activeId.value = application.id
  reviewStatus.value = status
  reviewNote.value = ''
  reviewError.value = ''
}

function cancelReview(): void {
  if (reviewing.value) {
    return
  }
  activeId.value = null
  reviewError.value = ''
}

async function submitReview(application: ProjectApplication): Promise<void> {
  if (reviewing.value) {
    return
  }
  const note = reviewNote.value.trim()
  if (reviewStatus.value === 'rejected' && (note.length < 5 || note.length > 200)) {
    reviewError.value = '拒绝申请需要填写 5-200 个字符的原因'
    return
  }
  if (note.length > 200) {
    reviewError.value = '处理留言不能超过 200 个字符'
    return
  }

  reviewing.value = true
  reviewError.value = ''
  try {
    const updated = await projectApi.reviewApplication(application.id, {
      status: reviewStatus.value,
      reviewNote: note || undefined,
    })
    if (reviewStatus.value === 'accepted' && workspace.value) {
      workspace.value.project.memberCount += 1
    }
    if (workspace.value) {
      workspace.value.applications = workspace.value.applications.map((item) =>
        item.id === updated.id ? updated : item,
      )
    }
    activeId.value = null
    toastStore.success(reviewStatus.value === 'accepted' ? '已接受申请' : '已拒绝申请')
    invalidateCaches()
    void notificationStore.refreshUnread()
    await syncWorkspace()
  } catch (cause) {
    reviewError.value = getErrorMessage(cause)
  } finally {
    reviewing.value = false
  }
}

async function syncWorkspace(): Promise<void> {
  const sequence = ++loadSequence
  try {
    const result = await projectApi.applications(projectId.value)
    if (sequence === loadSequence) {
      workspace.value = result
    }
  } catch {
    // Keep the locally updated list when the silent refresh fails.
  }
}

function invalidateCaches(): void {
  projectStore.invalidateAll()
  adminStore.invalidateProjects()
  void myProjectsStore.loadMine(true)
}
</script>

<style scoped>
.project-applications-page {
  padding-top: 0;
}

.page-back {
  margin: 0 0 9px;
}

.page-back a,
.head-actions a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 11px;
}

.page-back a:hover {
  color: var(--link-hover);
}

.workspace-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.1em;
}

.eyebrow-mark {
  width: 5px;
  height: 5px;
  background: var(--brand);
}

.heading-copy h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.heading-copy p {
  max-width: 650px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.head-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.project-context {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 14px;
  padding: 11px;
}

.context-cover {
  width: 146px;
  height: 92px;
  flex: 0 0 146px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.context-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.context-copy {
  min-width: 0;
  flex: 1;
}

.context-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.recruiting-badge {
  padding: 1px 5px;
  border: 1px solid #cbdbe5;
  border-radius: 2px;
  background: #f1f7fa;
  color: #3e6c85;
  font-size: 8.5px;
  line-height: 1.4;
}

.context-copy h2 {
  margin: 6px 0 3px;
  color: var(--text);
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.25px;
}

.context-copy > p {
  display: -webkit-box;
  margin: 0 0 5px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.context-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 11px;
  color: var(--text-faint);
  font-size: 9px;
}

.mono {
  font-family: var(--font-mono);
}

.context-summary {
  display: flex;
  width: 268px;
  flex: 0 0 268px;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 9px;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
}

.context-summary > svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--brand-hover);
}

.context-summary strong {
  display: block;
  color: var(--brand-hover);
  font-size: 10.5px;
  font-weight: 600;
}

.context-summary p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.context-summary.quiet {
  border-color: var(--border);
  background: var(--surface-subtle);
}

.context-summary.quiet > svg,
.context-summary.quiet strong {
  color: var(--text-muted);
}

.inline-error {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: -4px 0 10px;
  padding: 6px 8px;
  border: 1px solid #e5c1c1;
  border-radius: 2px;
  background: #fff7f7;
  color: var(--danger);
  font-size: 10px;
  line-height: 1.5;
}

.applications-panel {
  overflow: hidden;
}

.panel-note {
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.applications-empty {
  border-top: 1px solid var(--border);
}

.application-list {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  list-style: none;
}

.application-entry {
  display: flex;
  padding: 13px 14px 14px;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--border);
}

.application-entry.rejected {
  background: #fdfafa;
}

.entry-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.applicant {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.applicant-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.applicant-name {
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
}

.applicant-meta {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-status {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.status-chip {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 8.5px;
  line-height: 1.5;
}

.status-chip.pending {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.status-chip.accepted {
  border-color: #cfe4d7;
  background: var(--accepted-bg);
  color: var(--accepted);
}

.status-chip.rejected {
  border-color: #e8cfcf;
  background: #fbf1f1;
  color: var(--danger);
}

.entry-status time {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
  white-space: nowrap;
}

.entry-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 22px;
  margin: 0;
}

.entry-facts dt {
  margin-bottom: 2px;
  color: var(--text-faint);
  font-size: 9px;
}

.entry-facts dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 10.5px;
}

.skill-line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-chip {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.5;
}

.entry-message {
  margin: 0;
  padding: 7px 9px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 10.5px;
  line-height: 1.65;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.entry-history {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 3px 9px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.history-label {
  color: var(--text-secondary);
  font-weight: 600;
}

.history-note {
  flex-basis: 100%;
  margin: 1px 0 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.history-note strong {
  margin-right: 4px;
  color: var(--text-secondary);
  font-weight: 600;
}

.entry-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.entry-actions .btn {
  white-space: nowrap;
}

.confirm-copy {
  flex-basis: 100%;
  margin: 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.55;
}

.review-note-field {
  width: 100%;
  min-height: 62px;
  padding: 7px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 10.5px;
  line-height: 1.6;
  resize: vertical;
}

.review-note-field:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.review-note-field[aria-invalid='true'] {
  border-color: var(--danger);
}

.review-note-error {
  flex-basis: 100%;
  color: var(--danger);
  font-size: 9.5px;
}

.confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.page-state {
  overflow: hidden;
}

.loading-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.context-skeleton {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 11px;
}

.loading-cover {
  width: 146px;
  height: 92px;
  flex: 0 0 146px;
}

.loading-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.loading-line {
  display: block;
  width: 70%;
  height: 9px;
}

.loading-line.short {
  width: 28%;
}

.loading-line.medium {
  width: 48%;
}

.loading-title {
  display: block;
  width: 34%;
  height: 18px;
}

.loading-panel {
  display: flex;
  padding: 16px;
  flex-direction: column;
  gap: 10px;
}

.spinning {
  animation: applications-spin 0.9s linear infinite;
}

@keyframes applications-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .project-context {
    flex-wrap: wrap;
  }

  .context-summary {
    width: 100%;
    flex-basis: 100%;
    margin-left: 159px;
  }
}

@media (max-width: 900px) {
  .workspace-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .head-actions {
    width: 100%;
  }

  .project-context {
    align-items: flex-start;
  }

  .context-summary {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .heading-copy h1 {
    font-size: 23px;
  }

  .context-cover {
    width: 108px;
    height: 70px;
    flex-basis: 108px;
  }

  .context-copy {
    flex-basis: calc(100% - 121px);
  }

  .entry-head {
    flex-direction: column;
    gap: 5px;
  }

  .entry-status {
    width: 100%;
    justify-content: space-between;
  }

  .entry-facts {
    flex-direction: column;
    gap: 7px;
  }

  .entry-actions {
    align-items: stretch;
  }

  .entry-actions .btn {
    flex: 1 1 auto;
  }
}

@media (max-width: 480px) {
  .context-cover {
    width: 100%;
    height: auto;
    flex-basis: 100%;
    aspect-ratio: 16 / 9;
  }

  .context-copy {
    flex-basis: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
