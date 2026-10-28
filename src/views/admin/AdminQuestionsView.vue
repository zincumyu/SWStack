<template>
  <div>
    <AdminPageHeader
      eyebrow="CONTENT"
      title="问题管理"
      description="检索, 精选或隐藏社区问题. 删除操作不可撤销."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="adminStore.questionsLoading"
          @click="refresh"
        >
          <RefreshCw :size="13" />
          刷新
        </button>
      </template>
    </AdminPageHeader>

    <section class="panel admin-table-panel">
      <form class="admin-filter-bar" role="search" @submit.prevent="applyFilters">
        <label class="admin-search">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="searchDraft"
            type="search"
            placeholder="搜索标题, 作者, 标签或 ID"
            aria-label="搜索问题"
          />
        </label>
        <select
          v-model="statusFilter"
          class="admin-select"
          aria-label="按状态筛选"
          @change="applyFilters"
        >
          <option value="all">全部状态</option>
          <option value="published">公开</option>
          <option value="hidden">已隐藏</option>
          <option value="unanswered">未回答</option>
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
        <span class="admin-counter">{{ adminStore.questionTotal }} 条记录</span>
      </form>

      <p
        v-if="!adminStore.questionsLoading && !adminStore.questionsError && adminStore.questions.length"
        class="admin-table-hint"
      >
        左右滑动表格可查看完整内容.
      </p>

      <div v-if="adminStore.questionsLoading" class="question-loading" aria-busy="true">
        <div v-for="index in 6" :key="index" class="question-skeleton-row">
          <span class="skeleton skeleton-title" />
          <span class="skeleton skeleton-tags" />
          <span class="skeleton skeleton-meta" />
        </div>
      </div>

      <div v-else-if="adminStore.questionsError" class="question-error">
        <EmptyState
          title="加载问题失败"
          :description="adminStore.questionsError"
        >
          <button class="btn btn-secondary btn-sm" type="button" @click="refresh">重试</button>
        </EmptyState>
      </div>

      <div v-else-if="adminStore.questions.length === 0" class="admin-empty">
        没有符合条件的问题.
      </div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>问题</th>
              <th>作者</th>
              <th>数据</th>
              <th>状态</th>
              <th>最后活动</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="question in adminStore.questions" :key="question.id">
              <td class="question-cell">
                <div class="question-title-line">
                  <span class="admin-id">#{{ question.id }}</span>
                  <RouterLink
                    v-if="question.status === 'published'"
                    class="admin-row-title"
                    :to="{ name: 'question-detail', params: { id: question.id } }"
                  >
                    {{ question.title }}
                  </RouterLink>
                  <span v-else class="admin-row-title hidden-title">{{ question.title }}</span>
                  <span v-if="question.isFeatured" class="admin-badge featured">
                    <Star :size="9" fill="currentColor" />
                    精选
                  </span>
                </div>
                <div class="question-tags">
                  <span v-for="tag in question.tags" :key="tag.slug">#{{ tag.name }}</span>
                </div>
              </td>
              <td>
                <div class="author-cell">
                  <UserAvatar :user="question.author" :size="24" />
                  <div class="author-copy">
                    <span>{{ question.author.name }}</span>
                    <span>@{{ question.author.handle }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="question-metrics">
                  <span>{{ question.score }} 票</span>
                  <span>{{ question.answerCount }} 回答</span>
                  <span>{{ formatCompact(question.viewCount) }} 浏览</span>
                </div>
              </td>
              <td>
                <span class="admin-badge" :class="question.status">
                  {{ question.status === 'hidden' ? '已隐藏' : '公开' }}
                </span>
              </td>
              <td class="time-cell">{{ formatRelativeTime(question.lastActivityAt) }}</td>
              <td>
                <div class="admin-row-actions">
                  <template v-if="pendingDeleteId === question.id">
                    <span class="admin-confirm">确认删除?</span>
                    <button
                      class="admin-action danger"
                      type="button"
                      :disabled="adminStore.questionBusyId === question.id"
                      @click="confirmDelete(question)"
                    >
                      删除
                    </button>
                    <button class="admin-action" type="button" @click="pendingDeleteId = null">
                      取消
                    </button>
                  </template>
                  <template v-else>
                    <button
                      class="admin-action"
                      type="button"
                      :disabled="adminStore.questionBusyId === question.id"
                      @click="toggleFeatured(question)"
                    >
                      <Star
                        :size="11"
                        :fill="question.isFeatured ? 'currentColor' : 'none'"
                      />
                      {{ question.isFeatured ? '取消精选' : '精选' }}
                    </button>
                    <button
                      class="admin-action"
                      type="button"
                      :disabled="adminStore.questionBusyId === question.id"
                      @click="toggleStatus(question)"
                    >
                      <Eye v-if="question.status === 'hidden'" :size="11" />
                      <EyeOff v-else :size="11" />
                      {{ question.status === 'hidden' ? '恢复' : '隐藏' }}
                    </button>
                    <button
                      class="admin-action danger"
                      type="button"
                      :disabled="adminStore.questionBusyId === question.id"
                      @click="pendingDeleteId = question.id"
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
        :total="adminStore.questionTotal"
        :page-size="pageSize"
        :disabled="adminStore.questionsLoading"
        @change="goToPage"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import type { AdminQuestion, AdminQuestionFilter } from '@/api/types'
import { useAdminStore } from '@/stores/admin'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatCompact, formatRelativeTime } from '@/utils/format'

const route = useRoute()
const adminStore = useAdminStore()
const toastStore = useToastStore()

const pageSize = 10
const page = ref(1)
const searchDraft = ref(typeof route.query.q === 'string' ? route.query.q : '')
const statusFilter = ref<AdminQuestionFilter>(readStatus(route.query.status))
const pendingDeleteId = ref<number | null>(null)

const hasFilters = computed(
  () => Boolean(searchDraft.value.trim()) || statusFilter.value !== 'all',
)

function readStatus(value: unknown): AdminQuestionFilter {
  return value === 'hidden' || value === 'published' || value === 'unanswered'
    ? value
    : 'all'
}

function load(): void {
  pendingDeleteId.value = null
  void adminStore.loadQuestions({
    page: page.value,
    pageSize,
    q: searchDraft.value.trim() || undefined,
    status: statusFilter.value,
  })
}

function applyFilters(): void {
  page.value = 1
  load()
}

function clearFilters(): void {
  searchDraft.value = ''
  statusFilter.value = 'all'
  page.value = 1
  load()
}

function refresh(): void {
  load()
}

function goToPage(next: number): void {
  const totalPages = Math.max(1, Math.ceil(adminStore.questionTotal / pageSize))
  if (next < 1 || next > totalPages || next === page.value) {
    return
  }
  page.value = next
  load()
}

function ensurePageAfterMutation(): void {
  if (adminStore.questions.length === 0 && adminStore.questionTotal > 0 && page.value > 1) {
    page.value -= 1
    load()
  }
}

async function toggleFeatured(question: AdminQuestion): Promise<void> {
  try {
    const updated = await adminStore.updateQuestion(question.id, {
      featured: !question.isFeatured,
    })
    toastStore.success(updated.isFeatured ? '问题已设为精选' : '已取消精选')
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function toggleStatus(question: AdminQuestion): Promise<void> {
  const next = question.status === 'published' ? 'hidden' : 'published'
  try {
    await adminStore.updateQuestion(question.id, { status: next })
    toastStore.success(next === 'hidden' ? '问题已隐藏' : '问题已恢复公开')
    ensurePageAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function confirmDelete(question: AdminQuestion): Promise<void> {
  try {
    await adminStore.deleteQuestion(question.id)
    pendingDeleteId.value = null
    toastStore.success('问题已删除')
    ensurePageAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

void load()
</script>

<style scoped>
.admin-table-panel {
  overflow: hidden;
}

.question-cell {
  min-width: 270px;
  max-width: 420px;
}

.question-title-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.hidden-title {
  color: var(--text-muted);
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  padding-left: 0;
  color: var(--text-faint);
  font-size: 9.5px;
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}

.author-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.author-copy span:first-child {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-copy span:last-child {
  color: var(--text-faint);
  font-size: 9.5px;
}

.question-metrics {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--text-muted);
  font-size: 10px;
  white-space: nowrap;
}

.time-cell {
  color: var(--text-faint);
  font-size: 10px;
  white-space: nowrap;
}

.question-loading {
  padding: 4px 0;
}

.question-skeleton-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
}

.question-skeleton-row:last-child {
  border-bottom: 0;
}

.skeleton-title {
  width: min(62%, 360px);
  height: 13px;
}

.skeleton-tags {
  width: 130px;
  height: 8px;
}

.skeleton-meta {
  width: 190px;
  height: 8px;
}

.question-error {
  border-bottom: 0;
}

@media (max-width: 820px) {
  .question-cell {
    min-width: 230px;
  }

  .admin-filter-bar {
    row-gap: 6px;
  }

  .admin-search {
    max-width: none;
    flex-basis: 100%;
  }

  .admin-counter {
    margin-left: auto;
  }
}
</style>
