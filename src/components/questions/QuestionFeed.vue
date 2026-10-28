<template>
  <section ref="root" class="question-feed" aria-label="问题列表">
    <div class="feed-panel">
      <div class="feed-toolbar">
        <div class="sort-tabs" role="tablist" aria-label="问题排序">
          <button
            v-for="option in sortOptions"
            :key="option.value"
            class="sort-tab"
            :class="{ active: sort === option.value }"
            type="button"
            role="tab"
            :aria-selected="sort === option.value"
            @click="setSort(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <form class="feed-filter" @submit.prevent="applyFilter">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="filterDraft"
            type="search"
            placeholder="筛选问题"
            aria-label="在当前列表中筛选问题"
          />
          <button
            v-if="filterDraft || filterKeyword"
            class="clear-filter"
            type="button"
            aria-label="清除筛选"
            @click="clearFilter"
          >
            <X :size="13" />
          </button>
        </form>
      </div>

      <div class="feed-summary">
        <span class="question-count">
          <strong>{{ formatNumber(feedStore.total) }}</strong>
          个问题
        </span>
        <span v-if="activeFilter" class="filter-token">
          筛选: {{ activeFilter }}
        </span>
        <span class="sort-hint">{{ activeSortHint }}</span>
      </div>

      <div v-if="feedStore.loading" class="loading-rows" aria-label="问题加载中" aria-busy="true">
        <div v-for="index in 6" :key="index" class="loading-row">
          <div class="loading-stats">
            <span v-for="stat in 3" :key="stat" class="skeleton loading-stat" />
          </div>
          <div class="loading-content">
            <span class="skeleton loading-title" />
            <span class="skeleton loading-excerpt" />
            <div class="loading-bottom">
              <span class="skeleton loading-tag" />
              <span class="skeleton loading-tag short" />
              <span class="skeleton loading-author" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="feedStore.error" class="feed-error">
        <EmptyState title="加载问题失败" :description="feedStore.error">
          <button class="btn btn-secondary btn-sm" type="button" @click="reload">重试</button>
        </EmptyState>
      </div>

      <div v-else-if="feedStore.items.length === 0" class="feed-empty">
        <EmptyState :title="emptyTitle" :description="emptyDescription">
          <RouterLink v-if="!props.tag" class="btn btn-primary btn-sm" to="/ask">提出第一个问题</RouterLink>
        </EmptyState>
      </div>

      <div v-else class="question-list">
        <QuestionListItem
          v-for="question in feedStore.items"
          :key="question.id"
          :question="question"
        />
      </div>

      <div v-if="totalPages > 1 && !feedStore.loading" class="feed-pagination">
        <button
          class="page-button page-arrow"
          type="button"
          :disabled="page <= 1"
          aria-label="上一页"
          @click="goToPage(page - 1)"
        >
          <ChevronLeft :size="15" />
        </button>
        <button
          v-for="pageNumber in visiblePages"
          :key="pageNumber"
          class="page-button"
          :class="{ active: pageNumber === page }"
          type="button"
          :aria-current="pageNumber === page ? 'page' : undefined"
          @click="goToPage(pageNumber)"
        >
          {{ pageNumber }}
        </button>
        <button
          class="page-button page-arrow"
          type="button"
          :disabled="page >= totalPages"
          aria-label="下一页"
          @click="goToPage(page + 1)"
        >
          <ChevronRight :size="15" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-vue-next'
import type { QuestionSort } from '@/api/types'
import EmptyState from '@/components/common/EmptyState.vue'
import QuestionListItem from '@/components/questions/QuestionListItem.vue'
import { useQuestionsStore } from '@/stores/questions'
import { formatNumber } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    tag?: string
    keyword?: string
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  {
    tag: '',
    keyword: '',
    emptyTitle: '没有找到匹配的问题',
    emptyDescription: '换个关键词, 或调整筛选条件后再试.',
  },
)

const route = useRoute()
const router = useRouter()
const feedStore = useQuestionsStore()
const root = ref<HTMLElement | null>(null)
const page = ref(1)
const pageSize = 8
const filterDraft = ref(props.keyword)
const filterKeyword = ref(props.keyword)
const sort = ref<QuestionSort>(readSort(route.query.sort))

const sortOptions: Array<{ value: QuestionSort; label: string }> = [
  { value: 'newest', label: '最新' },
  { value: 'active', label: '活跃' },
  { value: 'unanswered', label: '未回答' },
  { value: 'votes', label: '最高票' },
]

const activeSortHint = computed(() => {
  const hints: Record<QuestionSort, string> = {
    newest: '按提问时间排序',
    active: '按最近活动排序',
    unanswered: '只看还没有回答的问题',
    votes: '按投票数排序',
  }
  return hints[sort.value]
})

const activeFilter = computed(() => filterKeyword.value || props.keyword)
const totalPages = computed(() => Math.max(1, Math.ceil(feedStore.total / pageSize)))
const visiblePages = computed(() => {
  const count = totalPages.value
  if (count <= 5) {
    return Array.from({ length: count }, (_, index) => index + 1)
  }
  const start = Math.min(Math.max(page.value - 2, 1), count - 4)
  return Array.from({ length: 5 }, (_, index) => start + index)
})

function readSort(value: unknown): QuestionSort {
  const allowed: QuestionSort[] = ['newest', 'active', 'unanswered', 'votes']
  return allowed.includes(value as QuestionSort) ? (value as QuestionSort) : 'newest'
}

async function load(): Promise<void> {
  await feedStore.load({
    page: page.value,
    pageSize,
    sort: sort.value,
    tag: props.tag || undefined,
    q: filterKeyword.value || props.keyword || undefined,
  })
}

function setSort(next: QuestionSort): void {
  if (next === sort.value) {
    return
  }
  const query = { ...route.query }
  if (next === 'newest') {
    delete query.sort
  } else {
    query.sort = next
  }
  void router.replace({ query })
}

function applyFilter(): void {
  filterKeyword.value = filterDraft.value.trim()
  page.value = 1
  void load()
}

function clearFilter(): void {
  filterDraft.value = ''
  filterKeyword.value = ''
  page.value = 1
  void load()
}

function goToPage(next: number): void {
  if (next < 1 || next > totalPages.value || next === page.value) {
    return
  }
  page.value = next
  void load()
  root.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function reload(): void {
  void load()
}

watch(
  () => route.query.sort,
  (value) => {
    const next = readSort(value)
    if (next !== sort.value) {
      sort.value = next
      page.value = 1
      void load()
    }
  },
)

watch(
  () => [props.tag, props.keyword],
  () => {
    page.value = 1
    filterDraft.value = props.keyword
    filterKeyword.value = props.keyword
    void load()
  },
)

void load()
</script>

<style scoped>
.question-feed {
  scroll-margin-top: 76px;
}

.feed-panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.feed-toolbar {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
}

.sort-tabs {
  display: flex;
  align-self: stretch;
  overflow-x: auto;
  scrollbar-width: none;
}

.sort-tabs::-webkit-scrollbar {
  display: none;
}

.sort-tab {
  position: relative;
  padding: 0 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.sort-tab:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.sort-tab.active {
  border-bottom-color: var(--brand);
  color: var(--text);
  font-weight: 600;
}

.feed-filter {
  display: flex;
  width: 194px;
  height: 29px;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 0 7px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-muted);
}

.feed-filter:focus-within {
  border-color: var(--border-strong);
}

.feed-filter input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 11.5px;
}

.feed-filter input::placeholder {
  color: var(--text-faint);
}

.feed-filter input::-webkit-search-cancel-button {
  display: none;
}

.clear-filter {
  display: inline-flex;
  padding: 1px;
  border: 0;
  background: transparent;
  color: var(--text-faint);
}

.clear-filter:hover {
  color: var(--text);
}

.feed-summary {
  display: flex;
  min-height: 34px;
  align-items: center;
  gap: 9px;
  padding: 6px 17px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 11px;
}

.question-count strong {
  color: var(--text);
  font-size: 11.5px;
  font-weight: 600;
}

.filter-token {
  max-width: 260px;
  overflow: hidden;
  padding: 1px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sort-hint {
  margin-left: auto;
  color: var(--text-faint);
}

.question-list > :deep(.question-row + .question-row) {
  border-top: 1px solid var(--border);
}

.loading-row {
  display: flex;
  gap: 16px;
  padding: 17px;
}

.loading-row + .loading-row {
  border-top: 1px solid var(--border);
}

.loading-stats {
  display: flex;
  width: 142px;
  flex: 0 0 142px;
  justify-content: space-around;
}

.loading-stat {
  width: 28px;
  height: 28px;
}

.loading-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 9px;
}

.loading-title {
  width: 70%;
  height: 17px;
}

.loading-excerpt {
  width: 92%;
  height: 11px;
}

.loading-bottom {
  display: flex;
  gap: 5px;
  margin-top: 2px;
}

.loading-tag {
  width: 64px;
  height: 20px;
}

.loading-tag.short {
  width: 46px;
}

.loading-author {
  width: 118px;
  height: 18px;
  margin-left: auto;
}

.feed-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.page-button {
  display: inline-flex;
  min-width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0 7px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 11.5px;
}

.page-button:hover:not(:disabled) {
  background: var(--surface-muted);
  color: var(--text);
}

.page-button.active {
  border-color: var(--brand);
  background: var(--brand);
  color: #ffffff;
}

.page-button:disabled {
  opacity: 0.45;
}

.page-arrow {
  padding: 0 5px;
}

@media (max-width: 720px) {
  .feed-toolbar {
    flex-wrap: wrap;
    gap: 0;
    padding: 0;
  }

  .sort-tabs {
    width: 100%;
    min-height: 41px;
    padding: 0 5px;
    border-bottom: 1px solid var(--border);
  }

  .sort-tab {
    padding: 0 9px;
  }

  .feed-filter {
    width: auto;
    height: 32px;
    margin: 8px 12px;
    flex: 1;
  }

  .feed-summary {
    padding: 6px 13px;
  }

  .sort-hint {
    display: none;
  }

  .loading-row {
    padding: 14px;
  }

  .loading-stats {
    display: none;
  }

  .loading-title {
    width: 88%;
  }

  .loading-author {
    width: 80px;
  }

  .feed-pagination {
    justify-content: center;
    padding: 11px 12px;
  }
}
</style>
