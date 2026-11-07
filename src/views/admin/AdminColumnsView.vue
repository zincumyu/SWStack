<template>
  <div>
    <AdminPageHeader
      eyebrow="EDITORIAL"
      title="专栏管理"
      description="管理全部专栏内容与发布状态. 草稿不会公开, 发布后会出现在专栏首页和搜索结果中."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="loading"
          @click="load()"
        >
          <RefreshCw :size="13" :class="{ spinning: loading }" />
          {{ loading ? '刷新中' : '刷新' }}
        </button>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'admin-column-new' }">
          <Plus :size="13" />
          新建专栏
        </RouterLink>
      </template>
    </AdminPageHeader>

    <section class="panel admin-table-panel">
      <form class="admin-filter-bar" role="search" @submit.prevent="applyFilters">
        <label class="admin-search">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="searchDraft"
            type="search"
            placeholder="搜索标题, 标签或正文"
            aria-label="搜索专栏"
          />
        </label>
        <select
          v-model="statusFilter"
          class="admin-select"
          aria-label="按发布状态筛选"
          @change="applyFilters"
        >
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>
        <select
          v-model="levelFilter"
          class="admin-select"
          aria-label="按难度筛选"
          @change="applyFilters"
        >
          <option value="all">全部难度</option>
          <option v-for="level in COLUMN_LEVELS" :key="level.value" :value="level.value">
            {{ level.label }}
          </option>
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
        <span class="admin-counter">{{ total }} 条记录</span>
      </form>

      <p v-if="!loading && !error && columns.length" class="admin-table-hint">
        左右滑动表格可查看完整内容.
      </p>

      <div v-if="loading" class="column-loading" aria-busy="true">
        <div v-for="index in 6" :key="index" class="column-skeleton-row">
          <span class="skeleton skeleton-title" />
          <span class="skeleton skeleton-tags" />
          <span class="skeleton skeleton-status" />
          <span class="skeleton skeleton-meta" />
        </div>
      </div>

      <div v-else-if="error" class="column-error">
        <EmptyState title="加载专栏失败" :description="error">
          <button class="btn btn-secondary btn-sm" type="button" @click="load()">
            重试
          </button>
        </EmptyState>
      </div>

      <div v-else-if="columns.length === 0" class="admin-empty">
        没有符合条件的专栏.
      </div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table column-admin-table">
          <thead>
            <tr>
              <th>专栏</th>
              <th>标签</th>
              <th>状态</th>
              <th>内容</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="column in columns" :key="column.id">
              <td class="title-cell">
                <div class="title-line">
                  <RouterLink
                    v-if="column.status === 'published'"
                    class="column-title-link"
                    :to="{ name: 'column-detail', params: { slug: column.slug } }"
                  >
                    {{ column.title }}
                  </RouterLink>
                  <span v-else class="column-title-text">{{ column.title }}</span>
                  <span v-if="column.featured" class="featured-label">精选</span>
                  <span v-if="column.moderationLocked" class="locked-label">
                    管理员已下线
                  </span>
                </div>
                <span class="column-slug">
                  #{{ column.id }} / {{ column.slug }} · @{{ column.author.handle }}
                </span>
                <span class="level-chip" :class="column.level">
                  {{ COLUMN_LEVEL_META[column.level].label }}
                </span>
              </td>
              <td>
                <div class="tag-cell">
                  <span v-for="tag in column.tags" :key="tag.slug" class="tag-pill">
                    #{{ tag.name }}
                  </span>
                </div>
              </td>
              <td>
                <span class="admin-badge" :class="column.status">
                  {{ COLUMN_STATUS_META[column.status].label }}
                </span>
              </td>
              <td>
                <div class="content-cell">
                  <strong>{{ column.readingMinutes }} 分钟</strong>
                  <span>{{ column.resourceCount }} 个资源</span>
                </div>
              </td>
              <td>
                <div class="content-cell">
                  <strong>{{ formatRelativeTime(column.updatedAt) }}</strong>
                  <span v-if="column.publishedAt">
                    发布于 {{ formatShortDate(column.publishedAt) }}
                  </span>
                  <span v-else>尚未发布</span>
                </div>
              </td>
              <td>
                <div class="admin-row-actions">
                  <template v-if="pendingDeleteId === column.id">
                    <span class="admin-confirm">确认删除?</span>
                    <button
                      class="admin-action danger"
                      type="button"
                      :disabled="busyId === column.id"
                      @click="confirmDelete(column)"
                    >
                      删除
                    </button>
                    <button
                      class="admin-action"
                      type="button"
                      :disabled="busyId === column.id"
                      @click="pendingDeleteId = null"
                    >
                      取消
                    </button>
                  </template>
                  <template v-else>
                    <RouterLink
                      class="admin-action"
                      :to="{ name: 'admin-column-edit', params: { id: column.id } }"
                    >
                      <Pencil :size="11" />
                      编辑
                    </RouterLink>
                    <button
                      class="admin-action"
                      type="button"
                      :disabled="busyId === column.id"
                      @click="toggleStatus(column)"
                    >
                      {{ column.status === 'published' ? '下线' : '发布' }}
                    </button>
                    <button
                      class="admin-action"
                      type="button"
                      :disabled="busyId === column.id"
                      @click="toggleFeatured(column)"
                    >
                      <Star
                        :size="11"
                        :fill="column.featured ? 'currentColor' : 'none'"
                      />
                      {{ column.featured ? '取消' : '精选' }}
                    </button>
                    <button
                      class="admin-action danger"
                      type="button"
                      :disabled="busyId === column.id"
                      @click="pendingDeleteId = column.id"
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
        :total="total"
        :page-size="pageSize"
        :disabled="loading"
        @change="goToPage"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { adminColumnApi } from '@/api/columns'
import type {
  AdminColumn,
  AdminColumnQuery,
  ColumnLevelFilter,
  ColumnStatus,
} from '@/api/types'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import {
  COLUMN_LEVEL_META,
  COLUMN_LEVELS,
  COLUMN_STATUS_META,
} from '@/utils/column-meta'
import { formatRelativeTime, formatShortDate } from '@/utils/format'

const toastStore = useToastStore()

const columns = ref<AdminColumn[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = 10
const searchDraft = ref('')
const appliedSearch = ref('')
const statusFilter = ref<'all' | ColumnStatus>('all')
const levelFilter = ref<ColumnLevelFilter>('all')
const busyId = ref<number | null>(null)
const pendingDeleteId = ref<number | null>(null)

let loadSequence = 0

const hasFilters = computed(
  () =>
    Boolean(searchDraft.value.trim()) ||
    statusFilter.value !== 'all' ||
    levelFilter.value !== 'all',
)

async function load(nextPage = page.value): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''
  pendingDeleteId.value = null

  try {
    const query: AdminColumnQuery = {
      page: nextPage,
      pageSize,
      q: appliedSearch.value || undefined,
      status: statusFilter.value,
      level: levelFilter.value,
    }
    const result = await adminColumnApi.list(query)
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

function applyFilters(): void {
  appliedSearch.value = searchDraft.value.trim()
  page.value = 1
  void load(1)
}

function clearFilters(): void {
  searchDraft.value = ''
  appliedSearch.value = ''
  statusFilter.value = 'all'
  levelFilter.value = 'all'
  page.value = 1
  void load(1)
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

async function toggleStatus(column: AdminColumn): Promise<void> {
  if (busyId.value !== null) {
    return
  }
  const nextStatus = column.status === 'published' ? 'draft' : 'published'
  busyId.value = column.id
  try {
    await adminColumnApi.patch(column.id, { status: nextStatus })
    toastStore.success(nextStatus === 'published' ? '专栏已发布' : '专栏已转为草稿')
    await reloadAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    busyId.value = null
  }
}

async function toggleFeatured(column: AdminColumn): Promise<void> {
  if (busyId.value !== null) {
    return
  }
  busyId.value = column.id
  try {
    await adminColumnApi.patch(column.id, { featured: !column.featured })
    toastStore.success(column.featured ? '已取消精选' : '专栏已设为精选')
    await reloadAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    busyId.value = null
  }
}

async function confirmDelete(column: AdminColumn): Promise<void> {
  if (busyId.value !== null) {
    return
  }
  busyId.value = column.id
  try {
    await adminColumnApi.remove(column.id)
    pendingDeleteId.value = null
    toastStore.success('专栏已删除')
    await reloadAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  } finally {
    busyId.value = null
  }
}

load()
</script>

<style scoped>
.admin-table-panel {
  overflow: hidden;
}

.column-admin-table {
  min-width: 920px;
}

.title-cell {
  min-width: 260px;
  max-width: 380px;
}

.title-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px;
}

.column-title-link,
.column-title-text {
  color: var(--text);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.45;
}

.column-title-link:hover {
  color: var(--link-hover);
}

.featured-label {
  padding: 0 4px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 8px;
  line-height: 1.5;
}

.locked-label {
  padding: 0 4px;
  border: 1px solid #e7c8c8;
  border-radius: 2px;
  background: #fdf4f4;
  color: var(--danger);
  font-size: 8px;
  line-height: 1.5;
}

.column-slug {
  display: block;
  margin: 2px 0 3px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
}

.level-chip {
  display: inline-flex;
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

.tag-cell {
  display: flex;
  max-width: 150px;
  flex-wrap: wrap;
  gap: 3px;
}

.tag-pill {
  padding: 1px 4px;
  border-radius: 2px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 8.5px;
  line-height: 1.45;
}

.admin-badge.draft {
  border: 1px solid #d8dce0;
  background: #f7f8f9;
  color: var(--text-muted);
}

.content-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  white-space: nowrap;
}

.content-cell strong {
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 500;
}

.content-cell span {
  color: var(--text-faint);
  font-size: 9px;
}

.column-loading {
  padding: 2px 0;
}

.column-skeleton-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
}

.column-skeleton-row:last-child {
  border-bottom: 0;
}

.skeleton-title {
  width: 30%;
  height: 12px;
}

.skeleton-tags {
  width: 18%;
  height: 10px;
}

.skeleton-status {
  width: 50px;
  height: 16px;
}

.skeleton-meta {
  width: 13%;
  height: 10px;
  margin-left: auto;
}

.column-error {
  border-bottom: 0;
}

.spinning {
  animation: column-admin-spin 0.9s linear infinite;
}

@keyframes column-admin-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
