<template>
  <div class="page-container columns-page">
    <section class="columns-head" aria-labelledby="columns-title">
      <div class="head-copy">
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          LEARNING COLUMNS
        </div>
        <h1 id="columns-title">专栏</h1>
        <p>社区作者整理的学习路径与资源清单. 从一个主题出发, 按自己的节奏系统补齐知识.</p>
      </div>
      <div class="head-actions">
        <RouterLink
          v-if="sessionStore.isAdmin"
          class="btn btn-ghost btn-sm"
          :to="{ name: 'admin-columns' }"
        >
          <ShieldCheck :size="13" />
          管理专栏
        </RouterLink>
        <RouterLink
          v-else-if="sessionStore.canWriteColumns"
          class="btn btn-secondary btn-sm"
          :to="{ name: 'my-columns' }"
        >
          <BookOpen :size="13" />
          我的专栏
        </RouterLink>
        <div class="head-note">
          <BookOpen :size="16" aria-hidden="true" />
          <div>
            <strong>{{ total }} 篇公开专栏</strong>
            <span>持续整理与更新</span>
          </div>
        </div>
      </div>
    </section>

    <form class="column-filters panel" role="search" @submit.prevent="applyFilters">
      <label class="column-search">
        <Search :size="14" aria-hidden="true" />
        <input
          v-model="searchDraft"
          type="search"
          placeholder="搜索标题, 标签或资源"
          aria-label="搜索专栏"
        />
      </label>
      <select
        v-model="levelFilter"
        class="column-select"
        aria-label="按难度筛选"
        @change="applyFilters"
      >
        <option value="all">全部难度</option>
        <option v-for="level in COLUMN_LEVELS" :key="level.value" :value="level.value">
          {{ level.label }}
        </option>
      </select>
      <select
        v-model="tagFilter"
        class="column-select"
        aria-label="按标签筛选"
        @change="applyFilters"
      >
        <option value="">全部标签</option>
        <option v-for="tag in communityStore.allTags" :key="tag.slug" :value="tag.slug">
          {{ tag.name }}
        </option>
      </select>
      <button class="btn btn-secondary btn-sm" type="submit">搜索</button>
      <button
        v-if="hasFilters"
        class="btn btn-ghost btn-sm"
        type="button"
        @click="resetFilters"
      >
        重置
      </button>
      <span class="column-count">{{ total }} 篇</span>
    </form>

    <div
      v-if="loading && columns.length === 0"
      class="column-grid"
      aria-busy="true"
      aria-label="专栏加载中"
    >
      <article v-for="index in 4" :key="index" class="column-skeleton panel">
        <span class="skeleton skeleton-meta" />
        <span class="skeleton skeleton-title" />
        <span class="skeleton skeleton-line" />
        <span class="skeleton skeleton-line short" />
        <span class="skeleton skeleton-foot" />
      </article>
    </div>

    <div v-else-if="error" class="panel column-state">
      <EmptyState title="加载专栏失败" :description="error">
        <button class="btn btn-secondary btn-sm" type="button" @click="load()">
          重试
        </button>
      </EmptyState>
    </div>

    <div v-else-if="columns.length === 0" class="panel column-state">
      <EmptyState
        title="没有找到专栏"
        description="换一个关键词, 难度或标签再试试."
      >
        <button
          v-if="hasFilters"
          class="btn btn-secondary btn-sm"
          type="button"
          @click="resetFilters"
        >
          清除筛选
        </button>
      </EmptyState>
    </div>

    <template v-else>
      <div class="column-grid" :class="{ refreshing: loading }">
        <RouterLink
          v-for="column in columns"
          :key="column.id"
          class="column-card panel"
          :class="{ featured: column.featured }"
          :to="{ name: 'column-detail', params: { slug: column.slug } }"
        >
          <div class="card-top">
            <span class="level-chip" :class="column.level">
              {{ COLUMN_LEVEL_META[column.level].label }}
            </span>
            <span v-if="column.featured" class="featured-chip">编辑精选</span>
            <span class="reading-time">
              <Clock3 :size="10" aria-hidden="true" />
              {{ column.readingMinutes }} 分钟
            </span>
          </div>

          <h2>{{ column.title }}</h2>
          <p class="card-summary">{{ column.summary }}</p>

          <div class="card-tags">
            <span v-for="tag in column.tags" :key="tag.slug" class="column-tag">
              #{{ tag.name }}
            </span>
          </div>

          <div class="card-foot">
            <span class="card-author">
              <UserAvatar :user="column.author" :size="19" />
              {{ column.author.name }}
            </span>
            <span class="card-resources">
              <Link2 :size="10" aria-hidden="true" />
              {{ column.resourceCount }} 个资源
            </span>
            <time :datetime="column.publishedAt ?? column.updatedAt">
              {{ formatShortDate(column.publishedAt ?? column.updatedAt) }}
            </time>
            <ArrowRight :size="13" class="card-arrow" aria-hidden="true" />
          </div>
        </RouterLink>
      </div>

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
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, BookOpen, Clock3, Link2, Search, ShieldCheck } from 'lucide-vue-next'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { columnApi } from '@/api/columns'
import type { ColumnLevelFilter, ColumnSummary } from '@/api/types'
import { useCommunityStore } from '@/stores/community'
import { useSessionStore } from '@/stores/session'
import { getErrorMessage } from '@/utils/errors'
import { COLUMN_LEVEL_META, COLUMN_LEVELS } from '@/utils/column-meta'
import { formatShortDate } from '@/utils/format'

const communityStore = useCommunityStore()
const sessionStore = useSessionStore()

const columns = ref<ColumnSummary[]>([])
const total = ref(0)
const loading = ref(true)
const error = ref('')
const page = ref(1)
const pageSize = 6
const searchDraft = ref('')
const appliedSearch = ref('')
const levelFilter = ref<ColumnLevelFilter>('all')
const tagFilter = ref('')

let loadSequence = 0

const hasFilters = computed(
  () =>
    Boolean(searchDraft.value.trim()) ||
    levelFilter.value !== 'all' ||
    Boolean(tagFilter.value),
)

onMounted(() => {
  void communityStore.loadTags()
  void load()
})

async function load(nextPage = page.value): Promise<void> {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''

  try {
    const result = await columnApi.list({
      page: nextPage,
      pageSize,
      q: appliedSearch.value || undefined,
      level: levelFilter.value,
      tag: tagFilter.value || undefined,
    })
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

function resetFilters(): void {
  searchDraft.value = ''
  appliedSearch.value = ''
  levelFilter.value = 'all'
  tagFilter.value = ''
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
</script>

<style scoped>
.columns-page {
  padding-top: 2px;
}

.columns-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
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

.head-copy h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.head-copy p {
  max-width: 620px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.head-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.head-note {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-muted);
}

.head-note > svg {
  color: var(--text-faint);
}

.head-note div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.head-note strong {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 500;
  white-space: nowrap;
}

.head-note span {
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.column-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 9px 11px;
  background: var(--surface-subtle);
}

.column-search {
  display: flex;
  width: 100%;
  max-width: 360px;
  min-width: 190px;
  height: 32px;
  flex: 1;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-faint);
}

.column-search:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.column-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 12px;
}

.column-search input::placeholder {
  color: var(--text-faint);
}

.column-search input::-webkit-search-cancel-button {
  display: none;
}

.column-select {
  min-height: 32px;
  padding: 6px 24px 6px 9px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}

.column-select:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.column-count {
  margin-left: auto;
  color: var(--text-faint);
  font-size: 10.5px;
  white-space: nowrap;
}

.column-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  transition: opacity 120ms ease;
}

.column-grid.refreshing {
  opacity: 0.62;
}

.column-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 14px;
  color: var(--text);
  transition: border-color 120ms ease, background-color 120ms ease;
}

.column-card:hover {
  border-color: var(--border-strong);
  background: #fdfdfc;
  color: var(--text);
}

.column-card.featured {
  border-color: var(--brand-border);
}

.card-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.level-chip {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.45;
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

.featured-chip {
  padding: 1px 5px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 9px;
  line-height: 1.45;
}

.reading-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  color: var(--text-faint);
  font-size: 9px;
  white-space: nowrap;
}

.column-card h2 {
  margin: 8px 0 5px;
  color: var(--text);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.18px;
  line-height: 1.4;
}

.card-summary {
  display: -webkit-box;
  margin: 0 0 9px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.62;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
}

.column-tag {
  padding: 1px 5px;
  border-radius: 2px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 9.5px;
  line-height: 1.45;
}

.card-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid var(--border);
  color: var(--text-faint);
  font-size: 9px;
}

.card-author {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
}

.card-resources {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.card-foot time {
  font-family: var(--font-mono);
}

.card-arrow {
  margin-left: auto;
  color: var(--text-faint);
}

.column-card:hover .card-arrow {
  color: var(--brand-hover);
}

.column-state {
  overflow: hidden;
}

.column-skeleton {
  display: flex;
  min-height: 178px;
  flex-direction: column;
  gap: 9px;
  padding: 14px;
}

.skeleton-meta {
  width: 86px;
  height: 16px;
}

.skeleton-title {
  width: 70%;
  height: 17px;
}

.skeleton-line {
  width: 100%;
  height: 9px;
}

.skeleton-line.short {
  width: 62%;
}

.skeleton-foot {
  width: 42%;
  height: 10px;
  margin-top: auto;
}

@media (max-width: 900px) {
  .columns-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .head-actions {
    width: 100%;
    justify-content: space-between;
  }

  .column-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .head-copy h1 {
    font-size: 23px;
  }

  .head-note {
    display: none;
  }

  .head-actions .btn {
    width: auto;
    justify-content: flex-start;
  }

  .column-search {
    max-width: none;
    flex-basis: 100%;
  }

  .column-select {
    flex: 1;
    min-width: 0;
  }

  .column-count {
    display: none;
  }

  .column-card h2 {
    font-size: 14.5px;
  }
}
</style>
