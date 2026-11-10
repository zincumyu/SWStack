<template>
  <div class="page-container my-columns-page">
    <div class="page-back">
      <RouterLink :to="{ name: 'columns' }">
        <ArrowLeft :size="13" />
        返回专栏
      </RouterLink>
    </div>

    <header class="page-head">
      <div class="page-head-copy">
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          COLUMN WORKSPACE
        </div>
        <h1>我的专栏</h1>
        <p>维护自己的学习路径与资源清单. 草稿仅你和管理员可见, 发布后进入公开专栏列表.</p>
        <span v-if="total > 0" class="head-count">共 {{ total }} 篇专栏</span>
      </div>
      <div class="head-actions">
        <button class="btn btn-secondary btn-sm" type="button" :disabled="loading" @click="load()">
          <RefreshCw :size="13" :class="{ spinning: loading }" />
          {{ loading ? '刷新中' : '刷新' }}
        </button>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'my-column-new' }">
          <Plus :size="13" />
          新建专栏
        </RouterLink>
      </div>
    </header>

    <p class="permission-note">
      <ShieldCheck :size="13" aria-hidden="true" />
      管理员已授予你专栏写作权限. 精选与下线由管理员统一管理.
    </p>

    <div v-if="loading && columns.length === 0" class="column-loading" aria-busy="true">
      <div v-for="index in 3" :key="index" class="panel loading-row">
        <span class="skeleton loading-title" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line short" />
      </div>
    </div>

    <div v-else-if="error" class="panel page-state">
      <EmptyState title="加载我的专栏失败" :description="error">
        <button class="btn btn-secondary btn-sm" type="button" @click="load()">重试</button>
      </EmptyState>
    </div>

    <div v-else-if="columns.length === 0" class="panel page-state">
      <EmptyState
        title="还没有创建专栏"
        description="把一路走通的学习方法整理成路径, 附上真正用过的资源, 帮助后来的人少绕弯路."
      >
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'my-column-new' }">
          创建第一篇专栏
        </RouterLink>
      </EmptyState>
    </div>

    <template v-else>
      <div class="column-list" :class="{ refreshing: loading }">
        <article v-for="column in columns" :key="column.id" class="my-column panel">
          <div class="column-main">
            <div class="title-row">
              <RouterLink
                v-if="column.status === 'published'"
                class="column-title-link"
                :to="{ name: 'column-detail', params: { slug: column.slug } }"
              >
                {{ column.title }}
              </RouterLink>
              <h2 v-else>{{ column.title }}</h2>
              <span class="status-badge" :class="column.status">
                {{ COLUMN_STATUS_META[column.status].label }}
              </span>
              <span v-if="column.featured" class="featured-tag">编辑精选</span>
              <span v-if="column.moderationLocked" class="locked-tag">管理员已下线</span>
            </div>

            <p class="column-summary">{{ column.summary }}</p>

            <div class="meta-row">
              <span class="mono">#{{ column.id }} / {{ column.slug }}</span>
              <span class="level-chip" :class="column.level">
                {{ COLUMN_LEVEL_META[column.level].label }}
              </span>
              <span>{{ column.resourceCount }} 个资源</span>
              <span>{{ column.readingMinutes }} 分钟阅读</span>
              <span>更新于 {{ formatRelativeTime(column.updatedAt) }}</span>
            </div>

            <div class="tag-row">
              <span v-for="tag in column.tags" :key="tag.slug" class="tag-pill">
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <div class="column-actions">
            <RouterLink
              class="btn btn-secondary btn-sm"
              :to="{ name: 'my-column-edit', params: { id: column.id } }"
            >
              <Pencil :size="12" />
              编辑
            </RouterLink>
            <RouterLink
              v-if="column.status === 'published'"
              class="btn btn-ghost btn-sm"
              :to="{ name: 'column-detail', params: { slug: column.slug } }"
            >
              <Eye :size="12" />
              查看
            </RouterLink>
            <button
              v-if="column.status === 'published'"
              class="btn btn-secondary btn-sm"
              type="button"
              :disabled="busyId !== null"
              @click="toggleStatus(column)"
            >
              下线
            </button>
            <button
              v-else-if="!column.moderationLocked"
              class="btn btn-primary btn-sm"
              type="button"
              :disabled="busyId !== null"
              @click="toggleStatus(column)"
            >
              <Send :size="12" />
              发布
            </button>
            <button
              v-if="pendingDeleteId === column.id"
              class="btn btn-secondary btn-sm danger-action"
              type="button"
              :disabled="busyId !== null"
              @click="confirmDelete(column)"
            >
              确认删除
            </button>
            <button
              v-else
              class="btn btn-ghost btn-sm delete-button"
              type="button"
              :disabled="busyId !== null"
              @click="pendingDeleteId = column.id"
            >
              <Trash2 :size="12" />
              删除
            </button>
            <button
              v-if="pendingDeleteId === column.id"
              class="btn btn-ghost btn-sm"
              type="button"
              :disabled="busyId !== null"
              @click="pendingDeleteId = null"
            >
              取消
            </button>
          </div>
        </article>
      </div>

      <p v-if="columns.some((column) => column.moderationLocked)" class="locked-hint">
        被管理员下线的专栏会保持草稿状态. 修改内容后请联系管理员重新发布.
      </p>

      <AdminPagination
        :page="page"
        :total="total"
        :page-size="pageSize"
        :disabled="loading"
        @change="goToPage"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Eye, Pencil, Plus, RefreshCw, Send, ShieldCheck, Trash2 } from 'lucide-vue-next'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { myColumnApi } from '@/api/columns'
import type { ColumnWorkspaceItem } from '@/api/types'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { COLUMN_LEVEL_META, COLUMN_STATUS_META } from '@/utils/column-meta'
import { formatRelativeTime } from '@/utils/format'

const toastStore = useToastStore()

const columns = ref<ColumnWorkspaceItem[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = 8
const busyId = ref<number | null>(null)
const pendingDeleteId = ref<number | null>(null)

let loadSequence = 0

async function load(nextPage = page.value): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''
  pendingDeleteId.value = null

  try {
    const result = await myColumnApi.list({ page: nextPage, pageSize })
    if (sequence !== loadSequence) {
      return
    }
    columns.value = result.items
    total.value = result.total
    page.value = result.page
  } catch (cause) {
    if (sequence !== loadSequence) {
      return
    }
    columns.value = []
    total.value = 0
    error.value = getErrorMessage(cause)
  } finally {
    if (sequence === loadSequence) {
      loading.value = false
    }
  }
}

function goToPage(next: number): void {
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize))
  if (next < 1 || next > totalPages || next === page.value) {
    return
  }
  void load(next)
}

async function reloadAfterMutation(): Promise<void> {
  await load(page.value)
  if (columns.value.length === 0 && total.value > 0 && page.value > 1) {
    page.value -= 1
    await load(page.value)
  }
}

async function toggleStatus(column: ColumnWorkspaceItem): Promise<void> {
  if (busyId.value !== null) {
    return
  }
  const nextStatus = column.status === 'published' ? 'draft' : 'published'
  busyId.value = column.id
  try {
    await myColumnApi.patch(column.id, { status: nextStatus })
    toastStore.success(
      nextStatus === 'published' ? '专栏已发布' : '专栏已转为草稿, 已从公开列表下线',
    )
    await reloadAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    busyId.value = null
  }
}

async function confirmDelete(column: ColumnWorkspaceItem): Promise<void> {
  if (busyId.value !== null) {
    return
  }
  busyId.value = column.id
  try {
    await myColumnApi.remove(column.id)
    pendingDeleteId.value = null
    toastStore.success('专栏已删除')
    await reloadAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    busyId.value = null
  }
}

void load()
</script>

<style scoped>
.my-columns-page {
  padding-top: 0;
}

.page-back {
  margin: 0 0 9px;
}

.page-back a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 11px;
}

.page-back a:hover {
  color: var(--link-hover);
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 12px;
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

.page-head h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.page-head p {
  max-width: 620px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.head-count {
  display: inline-block;
  margin-top: 5px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.head-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.permission-note {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: -2px 0 12px;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.permission-note svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--brand-hover);
}

.column-loading {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.loading-row {
  display: flex;
  padding: 13px;
  flex-direction: column;
  gap: 8px;
}

.loading-title {
  width: 36%;
  height: 15px;
}

.loading-line {
  width: 72%;
  height: 9px;
}

.loading-line.short {
  width: 44%;
}

.page-state {
  overflow: hidden;
}

.column-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  transition: opacity 120ms ease;
}

.column-list.refreshing {
  opacity: 0.65;
}

.my-column {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 13px;
}

.column-main {
  min-width: 0;
  flex: 1;
}

.title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.title-row h2,
.column-title-link {
  margin: 0;
  color: var(--text);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.15px;
  line-height: 1.4;
}

.column-title-link:hover {
  color: var(--link-hover);
}

.status-badge {
  padding: 1px 5px;
  border: 1px solid #d8dce0;
  border-radius: 2px;
  background: #f7f8f9;
  color: var(--text-muted);
  font-size: 8.5px;
  line-height: 1.45;
}

.status-badge.published {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.featured-tag,
.locked-tag {
  padding: 1px 5px;
  border: 1px solid #e8d6b4;
  border-radius: 2px;
  background: #fffaf0;
  color: #87611e;
  font-size: 8.5px;
  line-height: 1.45;
}

.locked-tag {
  border-color: #e7c8c8;
  background: #fdf4f4;
  color: var(--danger);
}

.column-summary {
  display: -webkit-box;
  margin: 5px 0 7px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 11px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.meta-row .mono {
  font-family: var(--font-mono);
}

.level-chip {
  padding: 0 4px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 8.5px;
  line-height: 1.5;
}

.level-chip.beginner {
  border-color: #cfdccf;
  background: #f6faf5;
  color: #4d6b4f;
}

.level-chip.intermediate {
  border-color: #d7e2ea;
  background: #f5f9fb;
  color: #45697c;
}

.level-chip.advanced {
  border-color: #ded7e5;
  background: #faf8fc;
  color: #675a76;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 7px;
}

.tag-pill {
  padding: 1px 4px;
  border-radius: 2px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 8.5px;
  line-height: 1.45;
}

.column-actions {
  display: flex;
  flex: 0 0 108px;
  flex-direction: column;
  align-items: stretch;
  gap: 5px;
}

.column-actions .btn {
  justify-content: center;
  white-space: nowrap;
}

.delete-button {
  color: var(--danger);
}

.delete-button:hover {
  background: #fbf1f1;
  color: var(--danger);
}

.danger-action {
  border-color: #e7c8c8;
  color: var(--danger);
}

.danger-action:hover {
  border-color: #d9b0b0;
  background: #fbf1f1;
  color: var(--danger);
}

.locked-hint {
  margin: 8px 0 0;
  color: #87611e;
  font-size: 9.5px;
  line-height: 1.55;
}

.spinning {
  animation: column-workspace-spin 0.9s linear infinite;
}

@keyframes column-workspace-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 820px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 11px;
  }

  .head-actions {
    width: 100%;
  }

  .page-head h1 {
    font-size: 23px;
  }
}

@media (max-width: 620px) {
  .my-column {
    flex-wrap: wrap;
  }

  .column-main {
    flex-basis: 100%;
  }

  .column-actions {
    width: 100%;
    flex: 0 0 auto;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .column-actions .btn {
    flex: 1 1 calc(50% - 3px);
  }
}

@media (max-width: 420px) {
  .column-actions .btn {
    flex-basis: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
