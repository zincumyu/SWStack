<template>
  <div>
    <AdminPageHeader
      eyebrow="SHOWCASE"
      title="项目管理"
      description="维护项目展示与招募状态. 也可以暂时隐藏整个项目板块."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="adminStore.projectsLoading"
          @click="refresh"
        >
          <RefreshCw :size="13" :class="{ spinning: adminStore.projectsLoading }" />
          {{ adminStore.projectsLoading ? '刷新中' : '刷新' }}
        </button>
        <RouterLink
          v-if="adminStore.projectBoardLoaded && adminStore.projectBoardEnabled"
          class="btn btn-primary btn-sm"
          :to="{ name: 'projects' }"
        >
          查看板块
        </RouterLink>
      </template>
    </AdminPageHeader>

    <section
      class="panel board-panel"
      :class="{
        'is-closed':
          adminStore.projectBoardLoaded && !adminStore.projectBoardEnabled,
      }"
      aria-labelledby="board-panel-title"
    >
      <span class="board-symbol" aria-hidden="true">
        <FolderGit2 :size="19" />
      </span>
      <div class="board-copy">
        <div class="board-eyebrow">PROJECT BOARD</div>
        <h2 id="board-panel-title">项目板块</h2>
        <p>关闭后, 公共导航与页脚入口会隐藏, 访客打开项目地址会看到暂未开放提示.</p>
      </div>
      <div class="board-control">
        <span
          class="admin-badge"
          :class="
            !adminStore.projectBoardLoaded
              ? 'member'
              : adminStore.projectBoardEnabled
                ? 'published'
                : 'hidden'
          "
        >
          {{
            !adminStore.projectBoardLoaded
              ? '读取中'
              : adminStore.projectBoardEnabled
                ? '公开中'
                : '已隐藏'
          }}
        </span>
        <button
          class="board-switch"
          :class="{ on: adminStore.projectBoardLoaded && adminStore.projectBoardEnabled }"
          type="button"
          role="switch"
          :aria-checked="adminStore.projectBoardEnabled"
          :disabled="
            !adminStore.projectBoardLoaded ||
            adminStore.projectsLoading ||
            adminStore.projectBoardSaving
          "
          @click="toggleBoard"
        >
          <span class="switch-track" aria-hidden="true">
            <span class="switch-knob" />
          </span>
          <span class="switch-label">
            {{
              adminStore.projectBoardSaving
                ? '保存中...'
                : !adminStore.projectBoardLoaded
                  ? '读取中...'
                  : adminStore.projectBoardEnabled
                    ? '关闭板块'
                    : '开启板块'
            }}
          </span>
        </button>
      </div>
    </section>

    <p
      v-if="adminStore.projectBoardLoaded && !adminStore.projectBoardEnabled"
      class="board-note"
    >
      <EyeOff :size="12" aria-hidden="true" />
      项目板块当前对访客隐藏, 管理员仍可在此维护项目.
    </p>

    <section class="panel admin-table-panel">
      <form class="admin-filter-bar" role="search" @submit.prevent="applyFilters">
        <label class="admin-search">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="searchDraft"
            type="search"
            placeholder="搜索项目, 团队或技术栈"
            aria-label="搜索项目"
          />
        </label>
        <select
          v-model="reviewFilter"
          class="admin-select"
          aria-label="按审核状态筛选"
          @change="applyFilters"
        >
          <option value="all">全部审核状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已上线</option>
          <option value="rejected">需修改</option>
        </select>
        <select
          v-model="visibilityFilter"
          class="admin-select"
          aria-label="按公开状态筛选"
          @change="applyFilters"
        >
          <option value="all">全部可见性</option>
          <option value="published">公开</option>
          <option value="hidden">已隐藏</option>
        </select>
        <select
          v-model="needFilter"
          class="admin-select"
          aria-label="按项目需求筛选"
          @change="applyFilters"
        >
          <option value="all">全部需求</option>
          <option value="feedback">求反馈</option>
          <option value="teammates">找队友</option>
        </select>
        <button class="btn btn-secondary btn-sm" type="submit">筛选</button>
        <button
          v-if="hasFilters"
          class="btn btn-ghost btn-sm"
          type="button"
          @click="clearFilters"
        >
          重置
        </button>
        <span class="admin-counter">{{ adminStore.projectTotal }} 条记录</span>
      </form>

      <p
        v-if="
          !adminStore.projectsLoading &&
          !adminStore.projectsError &&
          adminStore.projects.length
        "
        class="admin-table-hint"
      >
        左右滑动表格可查看完整内容.
      </p>

      <div v-if="adminStore.projectsLoading" class="project-loading" aria-busy="true">
        <div v-for="index in 6" :key="index" class="project-skeleton-row">
          <span class="skeleton skeleton-thumb" />
          <span class="skeleton skeleton-title" />
          <span class="skeleton skeleton-meta" />
          <span class="skeleton skeleton-badge" />
        </div>
      </div>

      <div v-else-if="adminStore.projectsError" class="project-error">
        <EmptyState title="加载项目失败" :description="adminStore.projectsError">
          <button class="btn btn-secondary btn-sm" type="button" @click="refresh">
            重试
          </button>
        </EmptyState>
      </div>

      <div v-else-if="adminStore.projects.length === 0" class="admin-empty">
        没有符合条件的项目.
      </div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table project-admin-table">
          <thead>
            <tr>
              <th>项目</th>
              <th>负责人 / 团队</th>
              <th>进度</th>
              <th>需求</th>
              <th>开发日志</th>
              <th>审核 / 可见性</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in adminStore.projects" :key="project.id">
              <td class="project-cell">
                <img
                  class="project-thumb"
                  :src="project.coverImage"
                  :alt="`${project.name} 截图`"
                  loading="lazy"
                />
                <div class="project-cell-copy">
                  <RouterLink
                    v-if="isPublicProject(project)"
                    class="admin-row-title"
                    :to="{ name: 'project-detail', params: { slug: project.slug } }"
                  >
                    {{ project.name }}
                  </RouterLink>
                  <RouterLink
                    v-else
                    class="admin-row-title review-title"
                    :to="{ name: 'admin-project-review', params: { id: project.id } }"
                  >
                    {{ project.name }}
                  </RouterLink>
                  <span class="admin-row-sub">#{{ project.id }} / {{ project.slug }}</span>
                  <span class="project-tech" :title="project.techStack.join(', ')">
                    {{ project.techStack.join(' / ') }}
                  </span>
                </div>
              </td>
              <td>
                <div class="team-cell">
                  <UserAvatar :user="project.owner" :size="26" />
                  <div class="team-copy">
                    <span>{{ project.owner.name }}</span>
                    <span>{{ project.teamName || '个人项目' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <ProjectStatusBadge :status="project.status" />
              </td>
              <td>
                <div class="need-cell">
                  <span
                    v-for="need in project.needs"
                    :key="need"
                    class="need-chip"
                    :class="need"
                  >
                    {{ PROJECT_NEED_META[need].label }}
                  </span>
                  <span v-if="project.needs.length === 0" class="need-none">暂无</span>
                </div>
              </td>
              <td>
                <div class="log-cell">
                  <strong>{{ project.updateCount }} 篇</strong>
                  <span>{{ formatRelativeTime(project.lastUpdatedAt) }}</span>
                </div>
              </td>
              <td>
                <div class="review-cell">
                  <ProjectReviewBadge :status="project.reviewStatus" />
                  <span class="admin-badge" :class="project.visibility">
                    {{ project.visibility === 'hidden' ? '已隐藏' : '公开' }}
                  </span>
                </div>
                <span class="review-sub">{{ reviewSub(project) }}</span>
              </td>
              <td>
                <div class="admin-row-actions">
                  <template v-if="pendingDeleteId === project.id">
                    <span class="admin-confirm">确认删除?</span>
                    <button
                      class="admin-action danger"
                      type="button"
                      :disabled="adminStore.projectBusyId === project.id"
                      @click="confirmDelete(project)"
                    >
                      删除
                    </button>
                    <button class="admin-action" type="button" @click="pendingDeleteId = null">
                      取消
                    </button>
                  </template>
                  <template v-else>
                    <RouterLink
                      v-if="project.reviewStatus !== 'approved'"
                      class="admin-action review-action"
                      :to="{ name: 'admin-project-review', params: { id: project.id } }"
                    >
                      <ClipboardCheck :size="11" />
                      审核
                    </RouterLink>
                    <template v-else>
                      <button
                        class="admin-action"
                        type="button"
                        :title="project.isFeatured ? '取消精选' : '设为精选'"
                        :disabled="adminStore.projectBusyId === project.id"
                        @click="toggleFeatured(project)"
                      >
                        <Star
                          :size="11"
                          :fill="project.isFeatured ? 'currentColor' : 'none'"
                        />
                        {{ project.isFeatured ? '取消' : '精选' }}
                      </button>
                      <button
                        class="admin-action"
                        type="button"
                        :disabled="adminStore.projectBusyId === project.id"
                        @click="toggleVisibility(project)"
                      >
                        <Eye v-if="project.visibility === 'hidden'" :size="11" />
                        <EyeOff v-else :size="11" />
                        {{ project.visibility === 'hidden' ? '公开' : '隐藏' }}
                      </button>
                    </template>
                    <button
                      class="admin-action danger"
                      type="button"
                      :disabled="adminStore.projectBusyId === project.id"
                      @click="pendingDeleteId = project.id"
                    >
                      <Trash2 :size="11" />
                      删除
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPagination
        :page="page"
        :total="adminStore.projectTotal"
        :page-size="pageSize"
        :disabled="adminStore.projectsLoading"
        @change="goToPage"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ClipboardCheck,
  Eye,
  EyeOff,
  FolderGit2,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import ProjectReviewBadge from '@/components/projects/ProjectReviewBadge.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import type {
  AdminProject,
  AdminProjectVisibility,
  ProjectNeed,
  ProjectReviewStatus,
} from '@/api/types'
import { useAdminStore } from '@/stores/admin'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime } from '@/utils/format'
import { PROJECT_NEED_META } from '@/utils/project-meta'

const adminStore = useAdminStore()
const toastStore = useToastStore()
const route = useRoute()

const pageSize = 10
const page = ref(1)
const searchDraft = ref('')
const reviewFilter = ref<'all' | ProjectReviewStatus>(readReview(route.query.review))
const visibilityFilter = ref<'all' | AdminProjectVisibility>(
  readVisibility(route.query.visibility),
)
const needFilter = ref<'all' | ProjectNeed>('all')
const pendingDeleteId = ref<number | null>(null)

function readReview(value: unknown): 'all' | ProjectReviewStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected'
    ? value
    : 'all'
}

function readVisibility(value: unknown): 'all' | AdminProjectVisibility {
  return value === 'published' || value === 'hidden' ? value : 'all'
}

const hasFilters = computed(
  () =>
    Boolean(searchDraft.value.trim()) ||
    reviewFilter.value !== 'all' ||
    visibilityFilter.value !== 'all' ||
    needFilter.value !== 'all',
)

function isPublicProject(project: AdminProject): boolean {
  return project.reviewStatus === 'approved' && project.visibility === 'published'
}

function reviewSub(project: AdminProject): string {
  if (project.reviewStatus === 'pending') {
    return project.submittedAt
      ? `提交于 ${formatRelativeTime(project.submittedAt)}`
      : '等待管理员处理'
  }
  if (project.reviewStatus === 'rejected') {
    return project.reviewedAt
      ? `退回于 ${formatRelativeTime(project.reviewedAt)}`
      : '等待成员修改'
  }
  return project.reviewedAt
    ? `通过于 ${formatRelativeTime(project.reviewedAt)}`
    : '已通过审核'
}

function load(): void {
  pendingDeleteId.value = null
  void adminStore.loadProjects({
    page: page.value,
    pageSize,
    q: searchDraft.value.trim() || undefined,
    review: reviewFilter.value,
    visibility: visibilityFilter.value,
    need: needFilter.value,
  })
}

function applyFilters(): void {
  page.value = 1
  load()
}

function clearFilters(): void {
  searchDraft.value = ''
  reviewFilter.value = 'all'
  visibilityFilter.value = 'all'
  needFilter.value = 'all'
  page.value = 1
  load()
}

function refresh(): void {
  load()
}

function goToPage(next: number): void {
  const totalPages = Math.max(1, Math.ceil(adminStore.projectTotal / pageSize))
  if (next < 1 || next > totalPages || next === page.value) {
    return
  }
  page.value = next
  load()
}

function ensurePageAfterMutation(): void {
  if (adminStore.projects.length === 0 && adminStore.projectTotal > 0 && page.value > 1) {
    page.value -= 1
    load()
  }
}

async function toggleBoard(): Promise<void> {
  const next = !adminStore.projectBoardEnabled
  try {
    const enabled = await adminStore.updateProjectBoard(next)
    toastStore.success(enabled ? '项目板块已公开' : '项目板块已隐藏')
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function toggleFeatured(project: AdminProject): Promise<void> {
  try {
    const updated = await adminStore.updateProject(project.id, {
      featured: !project.isFeatured,
    })
    toastStore.success(updated.isFeatured ? '项目已设为精选' : '已取消精选')
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function toggleVisibility(project: AdminProject): Promise<void> {
  const next = project.visibility === 'published' ? 'hidden' : 'published'
  try {
    await adminStore.updateProject(project.id, { visibility: next })
    toastStore.success(next === 'hidden' ? '项目已隐藏' : '项目已公开')
    ensurePageAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function confirmDelete(project: AdminProject): Promise<void> {
  try {
    await adminStore.deleteProject(project.id)
    pendingDeleteId.value = null
    toastStore.success('项目已删除')
    ensurePageAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

load()
</script>

<style scoped>
.board-panel {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 12px;
  padding: 13px 15px;
}

.board-symbol {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.board-panel.is-closed .board-symbol {
  border-color: #e7c8c8;
  background: #fdf4f4;
  color: var(--danger);
}

.board-copy {
  min-width: 0;
}

.board-eyebrow {
  margin-bottom: 1px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.1em;
}

.board-copy h2 {
  margin: 0 0 2px;
  color: var(--text);
  font-size: 13.5px;
  font-weight: 600;
}

.board-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.board-control {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 9px;
  margin-left: auto;
}

.board-switch {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 29px;
  padding: 4px 8px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 10.5px;
}

.board-switch:hover:not(:disabled) {
  background: var(--surface-subtle);
  color: var(--text);
}

.switch-track {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 16px;
  flex: 0 0 30px;
  border-radius: 8px;
  background: #c9ced3;
  transition: background-color 120ms ease;
}

.switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(18, 24, 30, 0.18);
  transition: transform 120ms ease;
}

.board-switch.on .switch-track {
  background: var(--brand);
}

.board-switch.on .switch-knob {
  transform: translateX(14px);
}

.board-switch:disabled {
  opacity: 0.55;
}

.board-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: -2px 0 12px;
  color: var(--danger);
  font-size: 10px;
}

.admin-table-panel {
  overflow: hidden;
}

.project-admin-table {
  min-width: 960px;
}

.project-admin-table .admin-row-actions {
  gap: 7px;
}

.project-cell {
  display: flex;
  min-width: 220px;
  align-items: flex-start;
  gap: 9px;
}

.project-thumb {
  width: 58px;
  height: 38px;
  flex: 0 0 58px;
  border: 1px solid var(--border);
  border-radius: 2px;
  object-fit: cover;
  background: var(--surface-subtle);
}

.project-cell-copy {
  min-width: 0;
}

.review-title {
  color: var(--text-secondary);
}

.review-title:hover {
  color: var(--link-hover);
}

.project-tech {
  display: block;
  max-width: 195px;
  overflow: hidden;
  margin-top: 2px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-cell {
  display: flex;
  min-width: 112px;
  align-items: center;
  gap: 7px;
}

.team-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.team-copy span:first-child {
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.team-copy span:last-child {
  color: var(--text-faint);
  font-size: 9px;
}

.need-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  max-width: 108px;
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

.log-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  white-space: nowrap;
}

.log-cell strong {
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 500;
}

.log-cell span {
  color: var(--text-faint);
  font-size: 9px;
}

.review-cell {
  display: flex;
  min-width: 86px;
  flex-wrap: wrap;
  gap: 4px;
}

.review-sub {
  display: block;
  margin-top: 3px;
  color: var(--text-faint);
  font-size: 8.5px;
  white-space: nowrap;
}

.review-action {
  font-weight: 600;
}

.project-loading {
  padding: 2px 0;
}

.project-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
}

.project-skeleton-row:last-child {
  border-bottom: 0;
}

.skeleton-thumb {
  width: 58px;
  height: 38px;
  flex: 0 0 58px;
}

.skeleton-title {
  width: 150px;
  height: 11px;
}

.skeleton-meta {
  width: 110px;
  height: 8px;
}

.skeleton-badge {
  width: 50px;
  height: 16px;
  margin-left: auto;
}

.project-error {
  border-bottom: 0;
}

@media (max-width: 760px) {
  .board-panel {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .board-control {
    width: 100%;
    margin-left: 51px;
    justify-content: space-between;
  }
}

@media (max-width: 560px) {
  .board-panel {
    padding: 11px 12px;
  }

  .board-symbol {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }

  .board-control {
    margin-left: 0;
  }

  .board-copy p {
    font-size: 10px;
  }
}
</style>
