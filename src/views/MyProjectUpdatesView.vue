<template>
  <div class="page-container project-updates-page">
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
          PROJECT WORKSPACE
        </div>
        <h1>开发日志</h1>
        <p>记录开发进度, 设计取舍和下一步计划. 日志独立于项目资料, 增删改不会触发项目重新审核.</p>
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
      <EmptyState title="项目编号无效" description="请从我的项目重新进入开发日志工作台.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <div
      v-else-if="loading && !workspace"
      class="loading-stack"
      aria-busy="true"
      aria-label="开发日志加载中"
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
      <EmptyState title="加载开发日志失败" :description="error">
        <button class="btn btn-secondary btn-sm" type="button" @click="loadWorkspace(true)">
          重试
        </button>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="!workspace" class="panel page-state">
      <EmptyState title="没有找到这个项目" description="项目可能已被删除, 或你没有管理权限.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <template v-else>
      <section class="panel project-context" aria-labelledby="workspace-project-title">
        <div class="context-cover">
          <img :src="project!.coverImage" :alt="`${project!.name} 项目封面`" />
        </div>
        <div class="context-copy">
          <div class="context-badges">
            <ProjectReviewBadge :status="project!.reviewStatus" />
            <ProjectStatusBadge :status="project!.status" />
            <span v-if="project!.visibility === 'hidden'" class="visibility-badge">
              管理员已隐藏
            </span>
          </div>
          <h2 id="workspace-project-title">{{ project!.name }}</h2>
          <p>{{ project!.tagline }}</p>
          <div class="context-meta">
            <span class="mono">#{{ project!.id }} / {{ project!.slug }}</span>
            <span>{{ project!.updateCount }} 篇日志</span>
            <span>最近更新 {{ formatRelativeTime(project!.lastUpdatedAt) }}</span>
          </div>
        </div>
        <div class="publish-state" :class="publishNotice.tone">
          <CheckCircle2 v-if="publishNotice.tone === 'live'" :size="16" aria-hidden="true" />
          <Clock3 v-else-if="publishNotice.tone === 'waiting'" :size="16" aria-hidden="true" />
          <EyeOff v-else :size="16" aria-hidden="true" />
          <div>
            <strong>{{ publishNotice.title }}</strong>
            <p>{{ publishNotice.text }}</p>
          </div>
        </div>
      </section>

      <p v-if="error" class="inline-error" role="alert">
        <AlertCircle :size="12" aria-hidden="true" />
        {{ error }}
      </p>

      <div class="workspace-layout">
        <section class="panel log-panel" aria-labelledby="log-list-title">
          <div class="panel-header">
            <h2 id="log-list-title" class="panel-title">
              <History :size="14" aria-hidden="true" />
              日志时间线
            </h2>
            <span class="panel-note">{{ updates.length }} 篇</span>
          </div>

          <div class="log-toolbar">
            <p>
              {{
                canViewPublic
                  ? '公开详情页按发布时间倒序展示这些日志.'
                  : '日志已经保存在工作台, 项目公开后会进入详情页时间线.'
              }}
            </p>
            <button
              class="btn btn-secondary btn-sm mobile-compose"
              type="button"
              @click="startCreate"
            >
              <Plus :size="12" />
              写日志
            </button>
          </div>

          <ProjectUpdateList
            :updates="updates"
            allow-edit
            allow-delete
            :busy-id="deletingId"
            :confirm-id="pendingDeleteId"
            :editing-id="editingId"
            empty-text="还没有开发日志. 在右侧写第一篇, 记录项目最近的进展."
            @edit="startEdit"
            @request-delete="requestDelete"
            @cancel-delete="pendingDeleteId = null"
            @delete="confirmDelete"
          />
        </section>

        <aside ref="composerRef" class="composer">
          <form
            class="panel composer-panel"
            novalidate
            :aria-busy="saving || deletingId !== null"
            @submit.prevent="submit"
          >
            <div class="composer-head">
              <div>
                <div class="composer-eyebrow">
                  {{ editingId === null ? 'NEW LOG' : 'EDIT LOG' }}
                </div>
                <h2>{{ editingId === null ? '写一篇开发日志' : '编辑开发日志' }}</h2>
              </div>
              <button
                v-if="editingId !== null"
                class="icon-button"
                type="button"
                aria-label="取消编辑"
                :disabled="saving"
                @click="cancelEdit"
              >
                <X :size="14" />
              </button>
            </div>

            <p class="composer-guide">
              写清楚这次完成了什么, 遇到什么问题, 以及下次计划. 纯文本会保留换行.
            </p>

            <div class="form-field">
              <label class="field-label" for="update-title">
                日志标题
                <span class="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                id="update-title"
                ref="titleInput"
                v-model="form.title"
                class="text-field"
                type="text"
                maxlength="80"
                placeholder="例如: 完成课程表冲突检测"
                :aria-invalid="Boolean(titleError)"
                aria-describedby="update-title-help"
              />
              <div id="update-title-help" class="field-footer">
                <span v-if="titleError" class="field-error">{{ titleError }}</span>
                <span v-else class="field-hint">4-80 个字符</span>
                <span class="field-counter">{{ form.title.length }}/80</span>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label" for="update-body">
                日志内容
                <span class="required-mark" aria-hidden="true">*</span>
              </label>
              <textarea
                id="update-body"
                v-model="form.body"
                class="text-area"
                rows="9"
                maxlength="3000"
                placeholder="记录本次迭代的进展, 技术决策, 踩坑和下一步计划."
                :aria-invalid="Boolean(bodyError)"
                aria-describedby="update-body-help"
              />
              <div id="update-body-help" class="field-footer">
                <span v-if="bodyError" class="field-error">{{ bodyError }}</span>
                <span v-else class="field-hint">20-3000 个字符, 支持换行</span>
                <span class="field-counter">{{ form.body.length }}/3000</span>
              </div>
            </div>

            <p v-if="formError" class="form-error" role="alert">
              <AlertCircle :size="12" aria-hidden="true" />
              {{ formError }}
            </p>

            <div class="composer-actions">
              <button
                class="btn btn-primary btn-sm"
                type="submit"
                :disabled="saving || deletingId !== null"
                :title="deletingId !== null ? '日志删除完成后才能发布' : undefined"
              >
                <Send :size="12" />
                {{
                  saving
                    ? editingId === null
                      ? '正在发布...'
                      : '正在保存...'
                    : editingId === null
                      ? '发布日志'
                      : '保存修改'
                }}
              </button>
              <button
                v-if="editingId !== null"
                class="btn btn-ghost btn-sm"
                type="button"
                :disabled="saving"
                @click="cancelEdit"
              >
                取消
              </button>
            </div>

            <p class="composer-footnote">
              <ShieldCheck :size="11" aria-hidden="true" />
              新增, 编辑和删除日志都不会重置项目审核状态.
            </p>
          </form>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  History,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import ProjectReviewBadge from '@/components/projects/ProjectReviewBadge.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import ProjectUpdateList from '@/components/projects/ProjectUpdateList.vue'
import { projectApi } from '@/api/projects'
import type { ProjectUpdate, ProjectUpdateInput, ProjectUpdatesWorkspace } from '@/api/types'
import { useAdminStore } from '@/stores/admin'
import { useMyProjectsStore } from '@/stores/my-projects'
import { useProjectStore } from '@/stores/projects'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime } from '@/utils/format'

const route = useRoute()
const projectStore = useProjectStore()
const adminStore = useAdminStore()
const myProjectsStore = useMyProjectsStore()
const toastStore = useToastStore()

const projectId = computed(() => Number(route.params.id))
const invalidId = computed(() => !Number.isInteger(projectId.value) || projectId.value <= 0)
const workspace = ref<ProjectUpdatesWorkspace | null>(null)
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const deletingId = ref<number | null>(null)
const pendingDeleteId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const formError = ref('')
const titleError = ref('')
const bodyError = ref('')
const composerRef = ref<HTMLElement | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)
const form = reactive<ProjectUpdateInput>({ title: '', body: '' })

let loadSequence = 0

const project = computed(() => workspace.value?.project ?? null)
const updates = computed(() => workspace.value?.updates ?? [])
const canViewPublic = computed(
  () =>
    project.value?.reviewStatus === 'approved' &&
    project.value.visibility === 'published' &&
    projectStore.boardEnabled,
)

const publishNotice = computed<{
  tone: 'live' | 'waiting' | 'hidden'
  title: string
  text: string
}>(() => {
  const value = project.value
  if (!value) {
    return { tone: 'waiting', title: '', text: '' }
  }
  if (value.reviewStatus === 'pending') {
    return {
      tone: 'waiting',
      title: '日志会先保存在工作台',
      text: '项目通过审核后, 这些日志会随项目一起公开. 编辑项目资料仍会重新进入审核.',
    }
  }
  if (value.reviewStatus === 'rejected') {
    return {
      tone: 'waiting',
      title: '项目需要修改后重新提交',
      text: '日志会先保存在工作台. 项目再次通过审核后, 这些日志会随项目一起公开.',
    }
  }
  if (value.visibility === 'hidden') {
    return {
      tone: 'hidden',
      title: '项目当前被管理员隐藏',
      text: '日志会先保存. 项目重新公开后, 日志会随项目一起展示, 不需要重新审核.',
    }
  }
  if (projectStore.boardLoaded && !projectStore.boardEnabled) {
    return {
      tone: 'hidden',
      title: '项目板块当前关闭',
      text: '日志会先保存. 板块重新开放后, 日志会随项目立即出现在公开时间线.',
    }
  }
  return {
    tone: 'live',
    title: '日志会立即进入公开时间线',
    text: '项目已上线. 新增和编辑的日志会直接展示在详情页, 不会触发整个项目重新审核.',
  }
})

watch(
  projectId,
  () => {
    workspace.value = null
    error.value = ''
    pendingDeleteId.value = null
    resetForm()
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
      document.title = `${value.name} 开发日志 - SWStack`
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
  if (!workspace.value) {
    formError.value = ''
  }

  try {
    const result = await projectApi.updates(projectId.value)
    if (sequence !== loadSequence) {
      return
    }
    workspace.value = result
  } catch (cause) {
    if (sequence !== loadSequence) {
      return
    }
    if (!workspace.value) {
      workspace.value = null
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
    const result = await projectApi.updates(projectId.value)
    if (sequence === loadSequence) {
      workspace.value = result
    }
  } catch {
    // Keep the locally updated workspace when the silent refresh fails.
  }
}

function sortUpdates(items: ProjectUpdate[]): ProjectUpdate[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function applyCreated(update: ProjectUpdate): void {
  if (!workspace.value) {
    return
  }
  workspace.value.updates = sortUpdates([update, ...workspace.value.updates])
  workspace.value.project.updateCount = workspace.value.updates.length
  workspace.value.project.lastUpdatedAt = update.createdAt
  workspace.value.project.updatedAt = update.createdAt
}

function applyEdited(update: ProjectUpdate): void {
  if (!workspace.value) {
    return
  }
  workspace.value.updates = workspace.value.updates.map((item) =>
    item.id === update.id ? update : item,
  )
  const stamp = update.updatedAt ?? update.createdAt
  workspace.value.project.lastUpdatedAt = stamp
  workspace.value.project.updatedAt = stamp
}

function invalidateCaches(): void {
  projectStore.invalidateAll()
  adminStore.invalidateProjects()
  void myProjectsStore.loadMine(true)
}

function validateForm(): boolean {
  const title = form.title.trim()
  const body = form.body.trim()
  titleError.value = ''
  bodyError.value = ''
  formError.value = ''

  if (title.length < 4 || title.length > 80) {
    titleError.value = '标题需要 4-80 个字符'
  }
  if (body.length < 20 || body.length > 3000) {
    bodyError.value = '内容需要 20-3000 个字符'
  }
  return !titleError.value && !bodyError.value
}

async function submit(): Promise<void> {
  if (saving.value || deletingId.value !== null || !validateForm()) {
    return
  }
  saving.value = true
  formError.value = ''
  const input: ProjectUpdateInput = {
    title: form.title.trim(),
    body: form.body.trim(),
  }

  try {
    if (editingId.value === null) {
      const created = await projectApi.createUpdate(projectId.value, input)
      applyCreated(created)
      toastStore.success('开发日志已发布')
    } else {
      const updated = await projectApi.updateUpdate(editingId.value, input)
      applyEdited(updated)
      toastStore.success('开发日志已更新')
    }
    resetForm()
    invalidateCaches()
    await syncWorkspace()
  } catch (cause) {
    formError.value = getErrorMessage(cause)
  } finally {
    saving.value = false
  }
}

function startCreate(): void {
  resetForm()
  focusComposer()
}

function startEdit(id: number): void {
  const update = updates.value.find((item) => item.id === id)
  if (!update) {
    return
  }
  editingId.value = update.id
  form.title = update.title
  form.body = update.body
  formError.value = ''
  titleError.value = ''
  bodyError.value = ''
  pendingDeleteId.value = null
  focusComposer()
}

function cancelEdit(): void {
  resetForm()
}

function resetForm(): void {
  editingId.value = null
  form.title = ''
  form.body = ''
  formError.value = ''
  titleError.value = ''
  bodyError.value = ''
}

function requestDelete(id: number): void {
  pendingDeleteId.value = id
}

async function confirmDelete(id: number): Promise<void> {
  if (deletingId.value !== null) {
    return
  }
  deletingId.value = id
  const wasEditing = editingId.value === id
  try {
    await projectApi.deleteUpdate(id)
    if (workspace.value) {
      workspace.value.updates = workspace.value.updates.filter((item) => item.id !== id)
      workspace.value.project.updateCount = workspace.value.updates.length
    }
    if (wasEditing) {
      resetForm()
    }
    pendingDeleteId.value = null
    toastStore.success('开发日志已删除')
    invalidateCaches()
    await syncWorkspace()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    deletingId.value = null
  }
}

async function focusComposer(): Promise<void> {
  await nextTick()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  composerRef.value?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })
  titleInput.value?.focus({ preventScroll: true })
}
</script>

<style scoped>
.project-updates-page {
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

.visibility-badge {
  padding: 1px 5px;
  border: 1px solid #e7c8c8;
  border-radius: 2px;
  background: #fdf4f4;
  color: var(--danger);
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

.publish-state {
  display: flex;
  width: 286px;
  flex: 0 0 286px;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 9px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.publish-state > svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--text-faint);
}

.publish-state strong {
  display: block;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.publish-state p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.publish-state.live {
  border-color: var(--brand-border);
  background: var(--brand-soft);
}

.publish-state.live > svg {
  color: var(--brand-hover);
}

.publish-state.waiting {
  border-color: #e7dfcf;
  background: #fffdf7;
}

.publish-state.waiting > svg {
  color: #8b7444;
}

.publish-state.hidden {
  border-color: #e7c8c8;
  background: #fdf7f7;
}

.publish-state.hidden > svg {
  color: var(--danger);
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

.workspace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 358px;
  gap: 14px;
  align-items: start;
}

.log-panel {
  overflow: hidden;
}

.panel-note {
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 13px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
}

.log-toolbar p {
  margin: 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.mobile-compose {
  display: none;
  flex: 0 0 auto;
}

.composer {
  position: sticky;
  top: calc(var(--header-height) + 18px);
  scroll-margin-top: calc(var(--header-height) + 16px);
}

.composer-panel {
  padding: 14px;
}

.composer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.composer-eyebrow {
  margin-bottom: 2px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.1em;
}

.composer-head h2 {
  margin: 0;
  color: var(--text);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.15px;
}

.icon-button {
  display: inline-flex;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
}

.icon-button:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
  color: var(--text);
}

.icon-button:disabled {
  opacity: 0.55;
}

.composer-guide {
  margin: 6px 0 12px;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.6;
}

.form-field + .form-field {
  margin-top: 11px;
}

.field-label {
  display: block;
  margin-bottom: 4px;
  color: var(--text);
  font-size: 11px;
  font-weight: 600;
}

.required-mark {
  color: var(--brand);
}

.text-field,
.text-area {
  display: block;
  width: 100%;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 11px;
  line-height: 1.6;
}

.text-field {
  min-height: 32px;
  padding: 6px 8px;
}

.text-area {
  min-height: 172px;
  padding: 8px;
  resize: vertical;
}

.text-field:focus,
.text-area:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.text-field::placeholder,
.text-area::placeholder {
  color: var(--text-faint);
}

.text-field[aria-invalid='true'],
.text-area[aria-invalid='true'] {
  border-color: var(--danger);
}

.field-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.5;
}

.field-error {
  color: var(--danger);
}

.field-hint {
  min-width: 0;
}

.field-counter {
  flex: 0 0 auto;
  font-family: var(--font-mono);
}

.form-error {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 10px 0 0;
  padding: 6px 8px;
  border: 1px solid #e5c1c1;
  border-radius: 2px;
  background: #fff7f7;
  color: var(--danger);
  font-size: 10px;
  line-height: 1.5;
}

.composer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.composer-footnote {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 9px 0 0;
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.5;
}

.composer-footnote svg {
  flex: 0 0 auto;
  margin-top: 1px;
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
  animation: updates-spin 0.9s linear infinite;
}

@keyframes updates-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .project-context {
    flex-wrap: wrap;
  }

  .publish-state {
    width: 100%;
    flex-basis: 100%;
    margin-left: 159px;
  }

  .workspace-layout {
    grid-template-columns: minmax(0, 1fr) 330px;
  }
}

@media (max-width: 900px) {
  .workspace-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .composer {
    position: static;
    order: -1;
  }

  .mobile-compose {
    display: inline-flex;
  }

  .publish-state {
    margin-left: 0;
  }

  .log-toolbar {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .workspace-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .heading-copy h1 {
    font-size: 23px;
  }

  .head-actions {
    width: 100%;
  }

  .project-context {
    align-items: flex-start;
    padding: 10px;
  }

  .context-cover {
    width: 108px;
    height: 70px;
    flex-basis: 108px;
  }

  .context-copy {
    flex-basis: calc(100% - 121px);
  }

  .publish-state {
    width: 100%;
    flex-basis: 100%;
  }

  .composer-panel {
    padding: 12px;
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

  .log-toolbar {
    flex-direction: column;
  }

  .mobile-compose {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
