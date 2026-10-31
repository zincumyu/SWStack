<template>
  <div class="admin-project-review">
    <div class="review-back">
      <RouterLink :to="{ name: 'admin-projects' }">
        <ArrowLeft :size="12" />
        返回项目管理
      </RouterLink>
    </div>

    <AdminPageHeader
      eyebrow="PROJECT REVIEW"
      title="审核项目"
      description="核验项目资料, 成员信息与 README. 通过后项目会进入项目展示, 驳回时需要写明修改要求."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="adminStore.reviewLoading"
          @click="reload"
        >
          <RefreshCw :size="13" :class="{ spinning: adminStore.reviewLoading }" />
          {{ adminStore.reviewLoading ? '刷新中' : '刷新' }}
        </button>
        <RouterLink
          class="btn btn-ghost btn-sm"
          :to="{ name: 'admin-projects', query: { review: 'pending' } }"
        >
          待审核队列
        </RouterLink>
      </template>
    </AdminPageHeader>

    <div v-if="invalidId" class="panel page-state">
      <EmptyState title="项目编号无效" description="请从项目管理列表重新进入审核页面.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'admin-projects' }">
          返回项目管理
        </RouterLink>
      </EmptyState>
    </div>

    <div
      v-else-if="adminStore.reviewLoading && !reviewTarget"
      class="review-loading"
      aria-busy="true"
      aria-label="项目资料加载中"
    >
      <div class="panel loading-main">
        <span class="skeleton loading-cover" />
        <div class="loading-copy">
          <span class="skeleton loading-line short" />
          <span class="skeleton loading-title" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line short" />
        </div>
      </div>
      <div class="panel loading-body">
        <span class="skeleton loading-line short" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line medium" />
      </div>
    </div>

    <div v-else-if="adminStore.reviewError" class="panel page-state">
      <EmptyState title="加载项目失败" :description="adminStore.reviewError">
        <button class="btn btn-secondary btn-sm" type="button" @click="reload">重试</button>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'admin-projects' }">
          返回项目管理
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="!reviewTarget" class="panel page-state">
      <EmptyState title="没有找到这个项目" description="项目可能已被其他管理员删除.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'admin-projects' }">
          返回项目管理
        </RouterLink>
      </EmptyState>
    </div>

    <template v-else>
      <div
        v-if="reviewTarget.reviewStatus === 'rejected'"
        class="review-note-banner"
        role="status"
      >
        <AlertTriangle :size="14" aria-hidden="true" />
        <div>
          <strong>该项目曾因资料问题被退回</strong>
          <p>{{ reviewTarget.reviewNote || '上一次审核没有留下备注.' }}</p>
        </div>
      </div>

      <div class="review-layout">
        <main class="review-main">
          <section class="panel project-hero" aria-labelledby="review-project-title">
            <div class="hero-cover">
              <img
                :src="reviewTarget.coverImage"
                :alt="`${reviewTarget.name} 项目截图`"
              />
            </div>
            <div class="hero-copy">
              <div class="hero-badges">
                <ProjectReviewBadge :status="reviewTarget.reviewStatus" />
                <ProjectStatusBadge :status="reviewTarget.status" />
                <span class="admin-badge" :class="reviewTarget.visibility">
                  {{ reviewTarget.visibility === 'hidden' ? '项目隐藏' : '项目公开' }}
                </span>
                <span v-if="reviewTarget.isFeatured" class="admin-badge featured">精选</span>
              </div>
              <h2 id="review-project-title">{{ reviewTarget.name }}</h2>
              <p class="hero-tagline">{{ reviewTarget.tagline }}</p>

              <div class="hero-meta">
                <UserAvatar :user="reviewTarget.owner" :size="24" />
                <span class="hero-owner">{{ reviewTarget.owner.name }}</span>
                <span class="hero-handle">@{{ reviewTarget.owner.handle }}</span>
                <span class="meta-sep" aria-hidden="true" />
                <span>{{ reviewTarget.teamName || '个人项目' }}</span>
                <span class="meta-sep" aria-hidden="true" />
                <span>{{ reviewTarget.memberCount }} 名成员</span>
                <span class="meta-sep" aria-hidden="true" />
                <RouterLink
                  v-if="isTargetPublic"
                  class="hero-slug"
                  :to="{ name: 'project-detail', params: { slug: reviewTarget.slug } }"
                >
                  /projects/{{ reviewTarget.slug }}
                </RouterLink>
                <span v-else class="hero-slug">/projects/{{ reviewTarget.slug }}</span>
              </div>

              <div class="hero-tech">
                <span
                  v-for="tech in reviewTarget.techStack"
                  :key="tech"
                  class="tech-chip"
                >
                  {{ tech }}
                </span>
              </div>

              <div class="hero-needs">
                <span
                  v-for="need in reviewTarget.needs"
                  :key="need"
                  class="need-chip"
                  :class="need"
                >
                  {{ PROJECT_NEED_META[need].label }}
                </span>
                <span v-if="reviewTarget.needs.length === 0" class="need-none">暂无招募需求</span>
                <span class="need-hint">{{ needsHint }}</span>
              </div>

              <div
                v-if="reviewTarget.githubUrl || reviewTarget.demoUrl"
                class="hero-links"
              >
                <a
                  v-if="reviewTarget.githubUrl"
                  :href="reviewTarget.githubUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github :size="12" />
                  GitHub
                  <ExternalLink :size="10" />
                </a>
                <a
                  v-if="reviewTarget.demoUrl"
                  :href="reviewTarget.demoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink :size="12" />
                  Demo
                </a>
              </div>
            </div>
          </section>

          <section
            class="panel review-gallery"
            aria-labelledby="review-gallery-title"
          >
            <div class="panel-header">
              <h2 id="review-gallery-title" class="panel-title">
                <Images :size="14" aria-hidden="true" />
                详情截图
              </h2>
              <span class="panel-caption">
                {{
                  reviewTarget.screenshots.length
                    ? `${reviewTarget.screenshots.length} 张, 点击放大`
                    : '未上传'
                }}
              </span>
            </div>
            <div v-if="reviewTarget.screenshots.length" class="review-gallery-body">
              <ProjectGallery
                :images="reviewTarget.screenshots"
                :label="`${reviewTarget.name} 截图`"
              />
            </div>
            <div v-else class="support-empty">
              该项目未上传详情截图, 将使用封面和 README 进行审核.
            </div>
          </section>

          <section class="panel readme-panel" aria-labelledby="review-readme-title">
            <div class="panel-header">
              <h2 id="review-readme-title" class="panel-title">
                <FileText :size="14" aria-hidden="true" />
                README
              </h2>
              <span class="panel-caption">{{ reviewTarget.readme.length }} 字符</span>
            </div>
            <div class="readme-body">
              <MarkdownRenderer :source="reviewTarget.readme" />
            </div>
          </section>

          <div class="support-grid">
            <section class="panel support-panel" aria-labelledby="review-members-title">
              <div class="panel-header">
                <h2 id="review-members-title" class="panel-title">
                  <UsersRound :size="14" aria-hidden="true" />
                  团队成员
                </h2>
                <span class="panel-caption">{{ reviewTarget.members.length }} 人</span>
              </div>
              <div v-if="reviewTarget.members.length === 0" class="support-empty">
                暂无成员资料.
              </div>
              <div v-else class="member-list">
                <div
                  v-for="member in reviewTarget.members"
                  :key="member.user.id"
                  class="member-row"
                >
                  <UserAvatar :user="member.user" :size="26" />
                  <div class="member-copy">
                    <strong>{{ member.user.name }}</strong>
                    <span>@{{ member.user.handle }}</span>
                  </div>
                  <span class="member-role">{{ member.role }}</span>
                  <span v-if="member.isOwner" class="owner-chip">负责人</span>
                </div>
              </div>
            </section>

            <section class="panel support-panel" aria-labelledby="review-updates-title">
              <div class="panel-header">
                <h2 id="review-updates-title" class="panel-title">
                  <Clock3 :size="14" aria-hidden="true" />
                  开发日志
                </h2>
                <span class="panel-caption">{{ reviewTarget.updateCount }} 篇</span>
              </div>
              <div v-if="reviewTarget.updates.length === 0" class="support-empty">
                暂无开发日志.
              </div>
              <div v-else class="update-list">
                <article
                  v-for="update in reviewTarget.updates"
                  :key="update.id"
                  class="update-item"
                >
                  <div class="update-head">
                    <strong>{{ update.title }}</strong>
                    <span>{{ formatShortDate(update.createdAt) }}</span>
                  </div>
                  <p>{{ update.body }}</p>
                  <span class="update-author">{{ update.author.name }}</span>
                </article>
              </div>
            </section>
          </div>
        </main>

        <aside class="review-side">
          <section class="panel action-panel" aria-labelledby="review-action-title">
            <div class="panel-header">
              <h2 id="review-action-title" class="panel-title">
                <ClipboardCheck :size="14" aria-hidden="true" />
                审核操作
              </h2>
              <ProjectReviewBadge :status="reviewTarget.reviewStatus" />
            </div>

            <div class="action-body">
              <div v-if="reviewTarget.reviewStatus === 'approved'" class="approved-state">
                <span class="approved-icon">
                  <Check :size="17" />
                </span>
                <div>
                  <strong>项目已通过审核</strong>
                  <p>
                    {{
                      reviewTarget.visibility === 'published'
                        ? '项目已进入公开项目展示. 如需下线, 请在项目管理中调整可见性.'
                        : '审核已通过, 但项目当前被管理员隐藏. 可在项目管理中重新公开.'
                    }}
                  </p>
                </div>
              </div>

              <template v-else>
                <p class="action-guide">
                  {{
                    reviewTarget.reviewStatus === 'pending'
                      ? '核验截图, README 和项目链接是否真实有效. 通过后项目会立即上线.'
                      : '该项目曾被退回. 成员重新提交后, 你可以再次通过或补充驳回意见.'
                  }}
                </p>

                <div class="note-field">
                  <div class="note-label-row">
                    <label class="note-label" for="review-note">审核备注</label>
                    <span class="note-mode">
                      通过时可选 / 驳回时必填
                    </span>
                  </div>
                  <textarea
                    id="review-note"
                    v-model="note"
                    class="note-textarea"
                    rows="5"
                    maxlength="300"
                    placeholder="例如: README 中请补充本地启动步骤, 截图需要展示真实界面."
                    :aria-invalid="Boolean(noteError)"
                  />
                  <div class="note-footer">
                    <span class="note-hint">成员会在项目工作台看到这条备注.</span>
                    <span class="note-count">{{ note.length }}/300</span>
                  </div>
                  <p v-if="noteError" class="note-error">{{ noteError }}</p>
                </div>

                <div
                  v-if="actionError"
                  class="action-error"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle :size="13" />
                  {{ actionError }}
                </div>

                <div class="action-buttons">
                  <button
                    class="btn btn-primary action-btn"
                    type="button"
                    :disabled="busy"
                    @click="approve"
                  >
                    <Check :size="13" />
                    {{ busy && actionKind === 'approve' ? '正在上线...' : '通过并上线' }}
                  </button>
                  <button
                    class="btn btn-secondary action-btn reject-button"
                    type="button"
                    :disabled="busy"
                    @click="reject"
                  >
                    <RotateCcw :size="13" />
                    {{ busy && actionKind === 'reject' ? '正在退回...' : '驳回修改' }}
                  </button>
                </div>

                <p class="action-footnote">
                  <ShieldCheck :size="11" aria-hidden="true" />
                  通过操作会按当前板块开关状态公开展示项目.
                </p>
              </template>
            </div>
          </section>

          <section class="panel record-panel" aria-labelledby="review-record-title">
            <div class="panel-header">
              <h2 id="review-record-title" class="panel-title">审核记录</h2>
            </div>
            <dl class="record-list">
              <div>
                <dt>提交审核</dt>
                <dd>
                  {{
                    reviewTarget.submittedAt
                      ? formatRelativeTime(reviewTarget.submittedAt)
                      : '尚未提交'
                  }}
                </dd>
              </div>
              <div>
                <dt>通过审核</dt>
                <dd>
                  {{
                    reviewTarget.reviewedAt
                      ? formatRelativeTime(reviewTarget.reviewedAt)
                      : '尚未审核'
                  }}
                </dd>
              </div>
              <div>
                <dt>创建时间</dt>
                <dd>{{ formatShortDate(reviewTarget.createdAt) }}</dd>
              </div>
              <div>
                <dt>最近更新</dt>
                <dd>{{ formatRelativeTime(reviewTarget.updatedAt) }}</dd>
              </div>
              <div>
                <dt>项目编号</dt>
                <dd class="record-mono">#{{ reviewTarget.id }}</dd>
              </div>
              <div v-if="reviewTarget.reviewNote" class="record-note-row">
                <dt>审核备注</dt>
                <dd class="record-note">{{ reviewTarget.reviewNote }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  Github,
  Images,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UsersRound,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import ProjectGallery from '@/components/projects/ProjectGallery.vue'
import ProjectReviewBadge from '@/components/projects/ProjectReviewBadge.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import { useAdminStore } from '@/stores/admin'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime, formatShortDate } from '@/utils/format'
import { PROJECT_NEED_META } from '@/utils/project-meta'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const toastStore = useToastStore()

const projectId = computed(() => Number(route.params.id))
const invalidId = computed(() => !Number.isFinite(projectId.value) || projectId.value <= 0)
const reviewTarget = computed(() => adminStore.reviewTarget)
const isTargetPublic = computed(
  () =>
    reviewTarget.value?.reviewStatus === 'approved' &&
    reviewTarget.value?.visibility === 'published',
)
const busy = computed(() => adminStore.projectBusyId === projectId.value)
const actionKind = ref<'approve' | 'reject' | null>(null)
const note = ref('')
const noteError = ref('')
const actionError = ref('')

const needsHint = computed(() => {
  if (!reviewTarget.value || reviewTarget.value.needs.length === 0) {
    return ''
  }
  return reviewTarget.value.needs
    .map((need) => PROJECT_NEED_META[need].description)
    .join(' ')
})

async function load(force = false): Promise<void> {
  if (invalidId.value) {
    return
  }
  await adminStore.loadReviewProject(projectId.value, force)
  if (reviewTarget.value?.id === projectId.value) {
    note.value = reviewTarget.value.reviewNote ?? ''
    noteError.value = ''
    actionError.value = ''
  }
}

watch(
  projectId,
  () => {
    actionKind.value = null
    noteError.value = ''
    actionError.value = ''
    void load()
  },
  { immediate: true },
)

function reload(): void {
  void load(true)
}

function validateRejectNote(): boolean {
  const value = note.value.trim()
  if (value.length < 5) {
    noteError.value = '驳回项目时请填写至少 5 个字符的修改意见'
    return false
  }
  noteError.value = ''
  return true
}

async function approve(): Promise<void> {
  if (busy.value || !reviewTarget.value) {
    return
  }
  noteError.value = ''
  actionError.value = ''
  actionKind.value = 'approve'
  try {
    await adminStore.updateProject(reviewTarget.value.id, {
      reviewStatus: 'approved',
      reviewNote: note.value.trim() || undefined,
    })
    toastStore.success('项目已通过审核并上线')
    await router.push({ name: 'admin-projects' })
  } catch (cause) {
    actionError.value = getErrorMessage(cause)
  } finally {
    actionKind.value = null
  }
}

async function reject(): Promise<void> {
  if (busy.value || !reviewTarget.value) {
    return
  }
  actionError.value = ''
  if (!validateRejectNote()) {
    return
  }
  actionKind.value = 'reject'
  try {
    await adminStore.updateProject(reviewTarget.value.id, {
      reviewStatus: 'rejected',
      reviewNote: note.value.trim(),
    })
    toastStore.success('项目已退回修改')
    await router.push({ name: 'admin-projects' })
  } catch (cause) {
    actionError.value = getErrorMessage(cause)
  } finally {
    actionKind.value = null
  }
}
</script>

<style scoped>
.admin-project-review {
  min-width: 0;
}

.review-back {
  margin: -3px 0 8px;
}

.review-back a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 10.5px;
}

.review-back a:hover {
  color: var(--link-hover);
}

.review-note-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding: 9px 12px;
  border: 1px solid #e7c8c8;
  border-radius: 3px;
  background: #fdf7f7;
  color: var(--danger);
}

.review-note-banner > svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.review-note-banner strong {
  display: block;
  font-size: 11px;
  font-weight: 600;
}

.review-note-banner p {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 10.5px;
  line-height: 1.55;
}

.review-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 304px;
  gap: 12px;
  align-items: start;
}

.review-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.project-hero {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px;
}

.hero-cover {
  width: 222px;
  flex: 0 0 222px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  aspect-ratio: 16 / 10;
}

.hero-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-copy {
  min-width: 0;
  flex: 1;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.hero-copy h2 {
  margin: 7px 0 3px;
  color: var(--text);
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.35px;
  line-height: 1.25;
}

.hero-tagline {
  margin: 0 0 7px;
  color: var(--text-secondary);
  font-size: 11.5px;
  line-height: 1.6;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  color: var(--text-muted);
  font-size: 10px;
}

.hero-owner {
  color: var(--text-secondary);
  font-weight: 600;
}

.hero-handle {
  color: var(--text-faint);
  font-size: 9.5px;
}

.meta-sep {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--border-strong);
}

.hero-slug {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.hero-slug:hover {
  color: var(--link-hover);
}

.hero-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.tech-chip {
  padding: 1px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.5;
}

.hero-needs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 7px;
}

.need-chip {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-size: 9px;
  line-height: 1.4;
  white-space: nowrap;
}

.need-chip.feedback {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.need-chip.teammates {
  border-color: #cbdbe5;
  background: #f1f7fa;
  color: #3e6c85;
}

.need-none {
  color: var(--text-faint);
  font-size: 9.5px;
}

.need-hint {
  flex-basis: 100%;
  margin-top: 1px;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.5;
}

.hero-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.hero-links a {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 10px;
}

.hero-links a:hover {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
  color: var(--text);
}

.panel-caption {
  color: var(--text-faint);
  font-size: 9.5px;
}

.readme-panel {
  overflow: hidden;
}

.review-gallery {
  overflow: hidden;
}

.review-gallery-body {
  padding: 12px 14px 14px;
}

.readme-body {
  padding: 14px 17px 18px;
  border-top: 1px solid var(--border);
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.support-panel {
  overflow: hidden;
}

.support-empty {
  padding: 13px 14px;
  border-top: 1px solid var(--border);
  color: var(--text-faint);
  font-size: 10.5px;
}

.member-list {
  border-top: 1px solid var(--border);
}

.member-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.member-row:last-child {
  border-bottom: 0;
}

.member-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.member-copy strong {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-copy span {
  color: var(--text-faint);
  font-size: 9px;
}

.member-role {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 9px;
}

.owner-chip {
  flex: 0 0 auto;
  padding: 1px 4px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 8.5px;
}

.update-list {
  max-height: 320px;
  overflow-y: auto;
  border-top: 1px solid var(--border);
}

.update-item {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
}

.update-item:last-child {
  border-bottom: 0;
}

.update-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.update-head strong {
  min-width: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.update-head span {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-size: 8.5px;
}

.update-item p {
  display: -webkit-box;
  margin: 3px 0 2px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.update-author {
  color: var(--text-faint);
  font-size: 8.5px;
}

.review-side {
  position: sticky;
  top: calc(var(--header-height) + 16px);
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.action-panel {
  overflow: hidden;
}

.action-body {
  padding: 11px 12px 12px;
  border-top: 1px solid var(--border);
}

.approved-state {
  display: flex;
  gap: 8px;
  padding: 2px 0 4px;
}

.approved-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brand-border);
  border-radius: 50%;
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.approved-state strong {
  display: block;
  color: var(--text);
  font-size: 11.5px;
  font-weight: 600;
}

.approved-state p {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.6;
}

.action-guide {
  margin: 0 0 9px;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.6;
}

.note-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.note-label {
  color: var(--text);
  font-size: 11px;
  font-weight: 600;
}

.note-mode {
  color: var(--text-faint);
  font-size: 8.5px;
}

.note-textarea {
  display: block;
  width: 100%;
  min-height: 104px;
  padding: 8px 9px;
  resize: vertical;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 11px;
  line-height: 1.6;
}

.note-textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.note-textarea::placeholder {
  color: var(--text-faint);
}

.note-textarea[aria-invalid='true'] {
  border-color: var(--danger);
}

.note-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.5;
}

.note-hint {
  min-width: 0;
}

.note-count {
  flex: 0 0 auto;
  font-family: var(--font-mono);
}

.note-error {
  margin: 5px 0 0;
  color: var(--danger);
  font-size: 9.5px;
}

.action-error {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 8px;
  padding: 6px 8px;
  border: 1px solid #e5c1c1;
  border-radius: 2px;
  background: #fff7f7;
  color: var(--danger);
  font-size: 10px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.action-btn {
  width: 100%;
  justify-content: center;
}

.reject-button {
  color: var(--danger);
  border-color: #e5c1c1;
}

.reject-button:hover:not(:disabled) {
  border-color: #d9a9a9;
  background: #fdf6f6;
  color: var(--danger);
}

.action-footnote {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 9px 0 0;
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.5;
}

.action-footnote svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.record-panel {
  overflow: hidden;
}

.record-list {
  margin: 0;
  padding: 3px 12px 7px;
  border-top: 1px solid var(--border);
}

.record-list > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px dashed var(--border);
}

.record-list > div:last-child {
  border-bottom: 0;
}

.record-list dt {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-size: 9.5px;
}

.record-list dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 9.5px;
  text-align: right;
}

.record-mono {
  font-family: var(--font-mono);
}

.record-note-row {
  align-items: flex-start;
}

.record-note {
  max-width: 172px;
  line-height: 1.55;
  word-break: break-word;
}

.review-loading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 304px;
  gap: 12px;
  align-items: start;
}

.loading-main {
  display: flex;
  gap: 14px;
  padding: 12px;
}

.loading-cover {
  width: 222px;
  flex: 0 0 222px;
  aspect-ratio: 16 / 10;
}

.loading-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 9px;
  padding-top: 2px;
}

.loading-line {
  width: 78%;
  height: 9px;
}

.loading-line.short {
  width: 34%;
}

.loading-line.medium {
  width: 58%;
}

.loading-title {
  width: 46%;
  height: 22px;
}

.loading-body {
  display: flex;
  padding: 15px;
  flex-direction: column;
  gap: 10px;
}

.page-state {
  overflow: hidden;
}

.spinning {
  animation: review-spin 0.9s linear infinite;
}

@keyframes review-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .review-layout {
    grid-template-columns: minmax(0, 1fr) 272px;
  }

  .review-side {
    top: calc(var(--header-height) + 12px);
  }

  .review-loading {
    grid-template-columns: minmax(0, 1fr) 272px;
  }
}

@media (max-width: 960px) {
  .review-layout,
  .review-loading {
    grid-template-columns: minmax(0, 1fr);
  }

  .review-side {
    position: static;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    align-items: start;
  }
}

@media (max-width: 720px) {
  .project-hero {
    flex-direction: column;
  }

  .hero-cover {
    width: 100%;
    flex-basis: auto;
  }

  .support-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .review-side {
    grid-template-columns: minmax(0, 1fr);
  }

  .loading-main {
    flex-direction: column;
  }

  .loading-cover {
    width: 100%;
    flex-basis: auto;
  }
}

@media (max-width: 520px) {
  .hero-copy h2 {
    font-size: 18px;
  }

  .action-body {
    padding: 10px;
  }

  .review-note-banner {
    padding: 8px 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
