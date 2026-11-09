<template>
  <div class="admin-project-updates">
    <div class="admin-back">
      <RouterLink :to="{ name: 'admin-projects' }">
        <ArrowLeft :size="12" />
        返回项目管理
      </RouterLink>
    </div>

    <AdminPageHeader
      eyebrow="PROJECT UPDATES"
      title="开发日志管理"
      description="删除违规或与项目无关的开发日志. 日志操作不会改变项目审核状态, 项目审核页仍然只读."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="loading"
          @click="loadWorkspace(true)"
        >
          <RefreshCw :size="13" :class="{ spinning: loading }" />
          {{ loading ? '刷新中' : '刷新' }}
        </button>
        <RouterLink
          v-if="isPublic"
          class="btn btn-ghost btn-sm"
          :to="{ name: 'project-detail', params: { slug: project?.slug ?? '' } }"
        >
          <Eye :size="13" />
          查看公开页
        </RouterLink>
        <RouterLink
          v-else
          class="btn btn-ghost btn-sm"
          :to="{ name: 'admin-project-review', params: { id: projectId } }"
        >
          审核页
        </RouterLink>
      </template>
    </AdminPageHeader>

    <div v-if="invalidId" class="panel page-state">
      <EmptyState title="项目编号无效" description="请从项目管理列表重新进入日志管理页.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'admin-projects' }">
          返回项目管理
        </RouterLink>
      </EmptyState>
    </div>

    <div
      v-else-if="loading && !workspace"
      class="panel loading-panel"
      aria-busy="true"
      aria-label="项目日志加载中"
    >
      <span class="skeleton loading-line short" />
      <span class="skeleton loading-title" />
      <span class="skeleton loading-line" />
      <span class="skeleton loading-line medium" />
    </div>

    <div v-else-if="error && !workspace" class="panel page-state">
      <EmptyState title="加载项目日志失败" :description="error">
        <button class="btn btn-secondary btn-sm" type="button" @click="loadWorkspace(true)">
          重试
        </button>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'admin-projects' }">
          返回项目管理
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="!workspace || !project" class="panel page-state">
      <EmptyState title="没有找到这个项目" description="项目可能已被其他管理员删除.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'admin-projects' }">
          返回项目管理
        </RouterLink>
      </EmptyState>
    </div>

    <template v-else>
      <section class="panel project-bar" aria-labelledby="admin-updates-project-title">
        <div class="project-cover">
          <img :src="project.coverImage" :alt="`${project.name} 项目封面`" />
        </div>
        <div class="project-copy">
          <div class="project-badges">
            <ProjectReviewBadge :status="project.reviewStatus" />
            <ProjectStatusBadge :status="project.status" />
            <span class="admin-badge" :class="project.visibility">
              {{ project.visibility === 'hidden' ? '项目隐藏' : '项目公开' }}
            </span>
            <span v-if="project.isFeatured" class="admin-badge featured">精选</span>
          </div>
          <h2 id="admin-updates-project-title">{{ project.name }}</h2>
          <p>{{ project.tagline }}</p>
          <div class="project-meta">
            <span class="meta-owner">
              <UserAvatar :user="project.owner" :size="16" />
              {{ project.owner.name }}
            </span>
            <span class="mono">#{{ project.id }} / {{ project.slug }}</span>
            <span>{{ project.updateCount }} 篇日志</span>
            <span>最近更新 {{ formatRelativeTime(project.lastUpdatedAt) }}</span>
          </div>
        </div>
        <div class="moderation-summary">
          <span class="moderation-icon" aria-hidden="true">
            <ShieldCheck :size="16" />
          </span>
          <div>
            <strong>仅删除违规内容</strong>
            <p>删除只影响这一篇日志, 不会驳回项目或触发重新审核.</p>
          </div>
        </div>
      </section>

      <p v-if="error" class="inline-error" role="alert">
        <AlertCircle :size="12" aria-hidden="true" />
        {{ error }}
      </p>

      <section class="panel logs-panel" aria-labelledby="admin-log-list-title">
        <div class="panel-header">
          <h2 id="admin-log-list-title" class="panel-title">
            <History :size="14" aria-hidden="true" />
            全部开发日志
          </h2>
          <span class="panel-note">{{ updates.length }} 篇</span>
        </div>
        <div class="moderation-note">
          <EyeOff :size="12" aria-hidden="true" />
          <span> 审核页只读. 如需处理违规日志, 请在此删除. 删除后成员无法恢复该内容. </span>
        </div>
        <ProjectUpdateList
          :updates="updates"
          allow-delete
          :busy-id="deletingId"
          :confirm-id="pendingDeleteId"
          empty-text="该项目还没有开发日志. 成员可以在项目工作台新增."
          @request-delete="requestDelete"
          @cancel-delete="pendingDeleteId = null"
          @delete="confirmDelete"
        />
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
  Eye,
  EyeOff,
  History,
  RefreshCw,
  ShieldCheck,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import ProjectReviewBadge from '@/components/projects/ProjectReviewBadge.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import ProjectUpdateList from '@/components/projects/ProjectUpdateList.vue'
import { adminApi } from '@/api/admin'
import type { AdminProjectUpdatesWorkspace } from '@/api/types'
import { useAdminStore } from '@/stores/admin'
import { useProjectStore } from '@/stores/projects'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime } from '@/utils/format'

const route = useRoute()
const adminStore = useAdminStore()
const projectStore = useProjectStore()
const toastStore = useToastStore()

const projectId = computed(() => Number(route.params.id))
const invalidId = computed(() => !Number.isInteger(projectId.value) || projectId.value <= 0)
const workspace = ref<AdminProjectUpdatesWorkspace | null>(null)
const loading = ref(false)
const error = ref('')
const deletingId = ref<number | null>(null)
const pendingDeleteId = ref<number | null>(null)

let loadSequence = 0

const project = computed(() => workspace.value?.project ?? null)
const updates = computed(() => workspace.value?.updates ?? [])
const isPublic = computed(
  () => project.value?.reviewStatus === 'approved' && project.value.visibility === 'published',
)

watch(
  projectId,
  () => {
    loadSequence += 1
    workspace.value = null
    error.value = ''
    pendingDeleteId.value = null
    if (!invalidId.value) {
      void loadWorkspace()
    }
  },
  { immediate: true },
)

watch(
  project,
  (value) => {
    if (value) {
      document.title = `${value.name} 开发日志管理 - SWStack`
    }
  },
  { immediate: true },
)

async function loadWorkspace(force = false): Promise<void> {
  if (invalidId.value || (loading.value && !force)) {
    return
  }
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''

  try {
    const result = await adminApi.projectUpdates(projectId.value)
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

async function syncWorkspace(): Promise<void> {
  const sequence = ++loadSequence
  try {
    const result = await adminApi.projectUpdates(projectId.value)
    if (sequence === loadSequence) {
      workspace.value = result
    }
  } catch {
    // Keep the locally updated workspace when the silent refresh fails.
  }
}

function requestDelete(id: number): void {
  pendingDeleteId.value = id
}

async function confirmDelete(id: number): Promise<void> {
  if (deletingId.value !== null) {
    return
  }
  deletingId.value = id
  try {
    await adminApi.deleteProjectUpdate(id)
    if (workspace.value) {
      workspace.value.updates = workspace.value.updates.filter((item) => item.id !== id)
      workspace.value.project.updateCount = workspace.value.updates.length
    }
    pendingDeleteId.value = null
    toastStore.success('开发日志已删除')
    adminStore.invalidateProjects()
    projectStore.invalidateAll()
    await syncWorkspace()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.admin-project-updates {
  min-width: 0;
}

.admin-back {
  margin: -3px 0 8px;
}

.admin-back a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 10.5px;
}

.admin-back a:hover {
  color: var(--link-hover);
}

.project-bar {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 12px;
  padding: 11px;
}

.project-cover {
  width: 156px;
  height: 98px;
  flex: 0 0 156px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.project-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-copy {
  min-width: 0;
  flex: 1;
}

.project-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.project-copy h2 {
  margin: 6px 0 3px;
  color: var(--text);
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.25px;
}

.project-copy > p {
  display: -webkit-box;
  margin: 0 0 5px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 11px;
  color: var(--text-faint);
  font-size: 9px;
}

.meta-owner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.mono {
  font-family: var(--font-mono);
}

.moderation-summary {
  display: flex;
  width: 270px;
  flex: 0 0 270px;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 9px;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
}

.moderation-icon {
  display: inline-flex;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brand-border);
  border-radius: 50%;
  background: var(--surface);
  color: var(--brand-hover);
}

.moderation-summary strong {
  display: block;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.moderation-summary p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
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

.logs-panel {
  overflow: hidden;
}

.panel-note {
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.moderation-note {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  padding: 8px 13px;
  border-top: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.55;
}

.moderation-note svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.page-state {
  overflow: hidden;
}

.loading-panel {
  display: flex;
  padding: 18px;
  flex-direction: column;
  gap: 10px;
}

.loading-line {
  width: 72%;
  height: 9px;
}

.loading-line.short {
  width: 28%;
}

.loading-line.medium {
  width: 45%;
}

.loading-title {
  width: 34%;
  height: 20px;
}

.spinning {
  animation: admin-updates-spin 0.9s linear infinite;
}

@keyframes admin-updates-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .project-bar {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .moderation-summary {
    width: 100%;
    flex-basis: 100%;
    margin-left: 169px;
  }
}

@media (max-width: 720px) {
  .project-cover {
    width: 116px;
    height: 74px;
    flex-basis: 116px;
  }

  .project-copy {
    flex-basis: calc(100% - 129px);
  }

  .moderation-summary {
    margin-left: 0;
  }
}

@media (max-width: 520px) {
  .project-cover {
    width: 100%;
    height: auto;
    flex-basis: 100%;
    aspect-ratio: 16 / 9;
  }

  .project-copy {
    flex-basis: 100%;
  }

  .project-bar,
  .logs-panel {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
