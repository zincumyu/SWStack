<template>
  <div class="page-container search-page">
    <header class="search-head">
      <div class="head-copy">
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          DISCOVERY
        </div>
        <h1 v-if="keyword">搜索 {{ keyword }}</h1>
        <h1 v-else>全站搜索</h1>
        <p v-if="keyword">结果来自问题, 项目, 专栏, 标签和开发者.</p>
        <p v-else>用一个关键词, 查找问题, 项目, 专栏, 标签和开发者.</p>
      </div>

      <form class="search-form" role="search" @submit.prevent="submitSearch">
        <Search :size="15" class="form-search-icon" aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="draft"
          type="search"
          placeholder="输入关键词"
          aria-label="全站搜索关键词"
        />
        <button
          v-if="draft"
          class="input-clear"
          type="button"
          aria-label="清除关键词"
          @click="clearDraft"
        >
          <X :size="13" />
        </button>
        <button class="btn btn-primary search-submit" type="submit">
          搜索
        </button>
      </form>
    </header>

    <nav v-if="keyword" class="scope-tabs" role="tablist" aria-label="搜索范围">
      <button
        v-for="tab in SEARCH_TABS"
        :key="tab.key"
        class="scope-tab"
        :class="{ active: activeType === tab.key }"
        type="button"
        role="tab"
        :aria-selected="activeType === tab.key"
        @click="selectType(tab.key)"
      >
        <component :is="tab.icon" :size="13" aria-hidden="true" />
        {{ tab.label }}
        <span v-if="result && !searchStore.loading" class="scope-count">
          {{ tabCount(tab.key) }}
        </span>
      </button>
    </nav>

    <div v-if="keyword && result && !searchStore.loading && !searchStore.error" class="result-summary">
      <span>
        <Layers3 :size="13" aria-hidden="true" />
        共找到 {{ totalResultCount }} 条结果
      </span>
      <button class="clear-search" type="button" @click="clearSearch">
        清除搜索
      </button>
    </div>

    <div
      v-if="keyword && searchStore.loading"
      class="panel search-loading"
      aria-busy="true"
      aria-label="搜索中"
    >
      <div v-for="index in 4" :key="index" class="loading-row">
        <span class="skeleton loading-mark" />
        <div class="loading-copy">
          <span class="skeleton loading-title" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-meta" />
        </div>
      </div>
    </div>

    <div v-else-if="keyword && searchStore.error" class="panel search-state">
      <EmptyState title="搜索失败" :description="searchStore.error">
        <button class="btn btn-secondary btn-sm" type="button" @click="retrySearch">
          重试
        </button>
      </EmptyState>
    </div>

    <template v-else-if="keyword">
      <div v-if="totalResultCount === 0" class="panel search-state">
        <EmptyState
          title="没有找到相关内容"
          description="换一个更短或更通用的关键词, 也可以切换搜索范围再试."
        >
          <button class="btn btn-secondary btn-sm" type="button" @click="clearSearch">
            重新搜索
          </button>
        </EmptyState>
      </div>

      <div v-else-if="!result" class="panel search-state">
        <EmptyState title="暂无搜索结果" description="稍后再试." />
      </div>

      <div v-else-if="result.total === 0" class="panel search-state">
        <EmptyState
          :title="`${activeTabLabel}中没有找到匹配结果`"
          :description="`其他范围还有 ${totalResultCount} 条结果.`"
        >
          <button class="btn btn-secondary btn-sm" type="button" @click="selectType('all')">
            查看全部结果
          </button>
        </EmptyState>
      </div>

      <div v-else>
        <div class="scope-note" aria-live="polite">
          <span>{{ activeType === 'all' ? '每个范围展示前 4 条' : `${activeTabLabel}范围共 ${result.total} 条` }}</span>
          <button
            v-if="activeType !== 'all'"
            class="note-clear"
            type="button"
            @click="selectType('all')"
          >
            <ArrowLeft :size="12" aria-hidden="true" />
            返回全部
          </button>
        </div>

        <section
          v-for="section in resultSections"
          :key="section.key"
          class="panel result-section"
          :aria-label="`${section.label}搜索结果`"
        >
          <header class="section-head">
            <div class="section-title">
              <component :is="section.icon" :size="14" aria-hidden="true" />
              <span>{{ section.label }}</span>
              <span class="section-count">{{ section.count }}</span>
            </div>
            <button
              v-if="activeType === 'all'"
              class="section-more"
              type="button"
              @click="selectType(section.key)"
            >
              查看全部
              <ArrowRight :size="12" aria-hidden="true" />
            </button>
          </header>

          <component
            :is="section.component"
            :items="section.items"
            :keyword="keyword"
          />
        </section>

        <AdminPagination
          v-if="activeType !== 'all'"
          :page="result.page"
          :total="result.total"
          :page-size="SEARCH_PAGE_SIZE"
          :disabled="searchStore.loading"
          @change="goToPage"
        />
      </div>
    </template>

    <div v-else-if="communityStore.tagsLoading && communityStore.allTags.length === 0" class="landing-grid">
      <section class="panel guide-panel" aria-busy="true">
        <span class="skeleton guide-skeleton-title" />
        <span class="skeleton guide-skeleton-line" />
        <span class="skeleton guide-skeleton-line short" />
      </section>
      <section class="panel guide-panel" aria-busy="true">
        <span class="skeleton guide-skeleton-title" />
        <span class="skeleton guide-skeleton-line" />
        <span class="skeleton guide-skeleton-line short" />
      </section>
    </div>

    <div v-else class="landing-grid">
      <section class="panel guide-panel">
        <header class="guide-head">
          <span class="guide-icon" aria-hidden="true">
            <Compass :size="15" />
          </span>
          <div>
            <h2>搜索范围</h2>
            <p>一次查询会覆盖社区里的五类公开内容.</p>
          </div>
        </header>

        <div class="scope-list">
          <div v-for="scope in SCOPE_GUIDES" :key="scope.key" class="scope-guide">
            <component :is="scope.icon" :size="14" class="scope-guide-icon" aria-hidden="true" />
            <div>
              <strong>{{ scope.label }}</strong>
              <p>{{ scope.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="landing-side">
        <section v-if="popularTags.length > 0" class="panel tags-panel">
          <header class="guide-head compact">
            <span class="guide-icon" aria-hidden="true">
              <Tags :size="15" />
            </span>
            <div>
              <h2>热门关键词</h2>
              <p>从社区正在讨论的技术主题开始.</p>
            </div>
          </header>
          <div class="popular-tags">
            <button
              v-for="tag in popularTags"
              :key="tag.slug"
              class="popular-tag"
              type="button"
              @click="searchKeyword(tag.name)"
            >
              <span>{{ tag.name }}</span>
              <strong>{{ tag.questionCount }}</strong>
            </button>
          </div>
        </section>

        <section class="panel tips-panel">
          <header class="guide-head compact">
            <span class="guide-icon" aria-hidden="true">
              <Lightbulb :size="15" />
            </span>
            <div>
              <h2>搜索提示</h2>
              <p>越具体的关键词, 越容易找到可复用的内容.</p>
            </div>
          </header>
          <ul class="search-tips">
            <li>搜索会匹配标题, 简介, 正文, 标签与作者信息.</li>
            <li>输入框架名, 报错片段或完整项目名通常更准确.</li>
            <li>先看全部结果, 再切换到单独范围可以更快定位.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  FolderGit2,
  Layers3,
  Lightbulb,
  MessageSquareText,
  Search,
  Tag,
  Tags,
  UsersRound,
  X,
} from 'lucide-vue-next'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SearchColumnResults from '@/components/search/SearchColumnResults.vue'
import SearchProjectResults from '@/components/search/SearchProjectResults.vue'
import SearchQuestionResults from '@/components/search/SearchQuestionResults.vue'
import SearchTagResults from '@/components/search/SearchTagResults.vue'
import SearchUserResults from '@/components/search/SearchUserResults.vue'
import type {
  ColumnSummary,
  ProjectSummary,
  QuestionSummary,
  SearchType,
  SearchUserResult,
  Tag as TagResult,
} from '@/api/types'
import { useCommunityStore } from '@/stores/community'
import { useSearchStore } from '@/stores/search'

type ResultScope = Exclude<SearchType, 'all'>

interface SearchTab {
  key: SearchType
  label: string
  icon: Component
}

interface ResultSection {
  key: ResultScope
  label: string
  icon: Component
  count: number
  items: unknown[]
  component: Component
}

const SEARCH_PAGE_SIZE = 8
const SEARCH_TYPES: SearchType[] = [
  'all',
  'questions',
  'projects',
  'columns',
  'tags',
  'users',
]

const SEARCH_TABS: SearchTab[] = [
  { key: 'all', label: '全部', icon: Layers3 },
  { key: 'questions', label: '问题', icon: MessageSquareText },
  { key: 'projects', label: '项目', icon: FolderGit2 },
  { key: 'columns', label: '专栏', icon: BookOpen },
  { key: 'tags', label: '标签', icon: Tags },
  { key: 'users', label: '开发者', icon: UsersRound },
]

const SCOPE_GUIDES: Array<{
  key: ResultScope
  label: string
  description: string
  icon: Component
}> = [
  {
    key: 'questions',
    label: '问题',
    description: '按标题, 正文, 标签或提问者查找技术问答.',
    icon: MessageSquareText,
  },
  {
    key: 'projects',
    label: '项目',
    description: '按项目名, 简介, 技术栈或团队成员查找项目.',
    icon: FolderGit2,
  },
  {
    key: 'columns',
    label: '专栏',
    description: '按标题, 摘要, 资源或标签查找学习路径.',
    icon: BookOpen,
  },
  {
    key: 'tags',
    label: '标签',
    description: '按名称或说明查找技术主题与问题聚合.',
    icon: Tag,
  },
  {
    key: 'users',
    label: '开发者',
    description: '按姓名, 简介, 学校或擅长标签查找成员.',
    icon: UsersRound,
  },
]

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const communityStore = useCommunityStore()
const searchInput = ref<HTMLInputElement | null>(null)
const draft = ref('')

const keyword = computed(() => readQuery(route.query.q).trim())
const activeType = computed<SearchType>(() => {
  const value = readQuery(route.query.type)
  return SEARCH_TYPES.includes(value as SearchType) ? (value as SearchType) : 'all'
})
const currentPage = computed(() => {
  const value = Number.parseInt(readQuery(route.query.page), 10)
  return Number.isFinite(value) && value > 0 ? value : 1
})
const result = computed(() => searchStore.result)
const totalResultCount = computed(() => {
  const counts = result.value?.counts
  if (!counts) {
    return 0
  }
  return counts.questions + counts.projects + counts.columns + counts.tags + counts.users
})
const activeTabLabel = computed(
  () => SEARCH_TABS.find((tab) => tab.key === activeType.value)?.label ?? '全部',
)
const popularTags = computed(() => {
  return [...communityStore.allTags]
    .sort((a, b) => b.questionCount - a.questionCount)
    .slice(0, 9)
})
const resultSections = computed<ResultSection[]>(() => {
  const current = result.value
  if (!current) {
    return []
  }

  const sections: ResultSection[] = [
    {
      key: 'questions',
      label: '问题',
      icon: MessageSquareText,
      count: current.counts.questions,
      items: current.questions as QuestionSummary[],
      component: SearchQuestionResults,
    },
    {
      key: 'projects',
      label: '项目',
      icon: FolderGit2,
      count: current.counts.projects,
      items: current.projects as ProjectSummary[],
      component: SearchProjectResults,
    },
    {
      key: 'columns',
      label: '专栏',
      icon: BookOpen,
      count: current.counts.columns,
      items: current.columns as ColumnSummary[],
      component: SearchColumnResults,
    },
    {
      key: 'tags',
      label: '标签',
      icon: Tags,
      count: current.counts.tags,
      items: current.tags as TagResult[],
      component: SearchTagResults,
    },
    {
      key: 'users',
      label: '开发者',
      icon: UsersRound,
      count: current.counts.users,
      items: current.users as SearchUserResult[],
      component: SearchUserResults,
    },
  ]

  if (activeType.value === 'all') {
    return sections.filter((section) => section.count > 0)
  }
  return sections.filter((section) => section.key === activeType.value)
})

watch(
  keyword,
  (value) => {
    draft.value = value
  },
  { immediate: true },
)

watch(
  [keyword, activeType, currentPage],
  () => {
    if (!keyword.value) {
      searchStore.reset()
      return
    }
    void searchStore.search({
      q: keyword.value,
      type: activeType.value,
      page: currentPage.value,
      pageSize: SEARCH_PAGE_SIZE,
    })
  },
  { immediate: true },
)

watchEffect(() => {
  document.title = keyword.value
    ? `搜索 ${keyword.value} - SWStack`
    : '全站搜索 - SWStack'
})

void communityStore.loadTags()

onBeforeUnmount(() => {
  searchStore.reset()
})

function readQuery(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function tabCount(key: SearchType): number {
  if (!result.value) {
    return 0
  }
  if (key === 'all') {
    return totalResultCount.value
  }
  return result.value.counts[key]
}

function buildQuery(type: SearchType, page = 1): Record<string, string> {
  const query: Record<string, string> = { q: keyword.value }
  if (type !== 'all') {
    query.type = type
    if (page > 1) {
      query.page = String(page)
    }
  }
  return query
}

function submitSearch(): void {
  const next = draft.value.trim()
  searchInput.value?.blur()
  if (!next) {
    void router.push({ name: 'search' })
    return
  }
  if (next === keyword.value && activeType.value === 'all' && currentPage.value === 1) {
    return
  }
  void router.push({ name: 'search', query: { q: next } })
}

function selectType(type: SearchType): void {
  if (!keyword.value) {
    return
  }
  void router.push({ name: 'search', query: buildQuery(type) })
}

function goToPage(next: number): void {
  if (!result.value || activeType.value === 'all') {
    return
  }
  const totalPages = Math.max(1, Math.ceil(result.value.total / SEARCH_PAGE_SIZE))
  if (next < 1 || next > totalPages || next === result.value.page) {
    return
  }
  void router.push({ name: 'search', query: buildQuery(activeType.value, next) })
}

function clearDraft(): void {
  draft.value = ''
  searchInput.value?.focus()
}

function clearSearch(): void {
  draft.value = ''
  void router.push({ name: 'search' })
}

function searchKeyword(term: string): void {
  draft.value = term
  void router.push({ name: 'search', query: { q: term } })
}

function retrySearch(): void {
  if (!keyword.value) {
    return
  }
  void searchStore.search({
    q: keyword.value,
    type: activeType.value,
    page: currentPage.value,
    pageSize: SEARCH_PAGE_SIZE,
  })
}
</script>

<style scoped>
.search-page {
  max-width: 1040px;
  padding-top: 22px;
  padding-bottom: 46px;
}

.search-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 16px;
}

.head-copy {
  min-width: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
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
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.head-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.55;
}

.search-form {
  display: flex;
  width: 100%;
  max-width: 392px;
  height: 36px;
  flex: 0 1 392px;
  align-items: center;
  gap: 7px;
  padding-left: 10px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
}

.search-form:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.form-search-icon {
  flex: 0 0 auto;
  color: var(--text-muted);
}

.search-form input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
}

.search-form input::placeholder {
  color: var(--text-faint);
}

.search-form input::-webkit-search-cancel-button {
  display: none;
}

.input-clear {
  display: inline-flex;
  padding: 2px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--text-faint);
}

.input-clear:hover {
  background: var(--surface-muted);
  color: var(--text-muted);
}

.search-submit {
  height: 100%;
  padding: 0 15px;
  border-radius: 0 2px 2px 0;
  font-size: 12.5px;
}

.scope-tabs {
  display: flex;
  align-items: stretch;
  margin-bottom: 1px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
  scrollbar-width: none;
}

.scope-tabs::-webkit-scrollbar {
  display: none;
}

.scope-tab {
  display: inline-flex;
  min-height: 39px;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  transition: background-color 120ms ease, color 120ms ease;
}

.scope-tab:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.scope-tab.active {
  border-bottom-color: var(--brand);
  color: var(--text);
  font-weight: 600;
}

.scope-tab.active svg {
  color: var(--brand-hover);
}

.scope-count {
  display: inline-flex;
  min-width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-subtle);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 400;
  line-height: 1;
}

.scope-tab.active .scope-count {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.result-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 31px;
  padding: 8px 2px 7px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.result-summary > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.clear-search {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 10.5px;
}

.clear-search:hover {
  color: var(--link-hover);
}

.scope-note {
  display: flex;
  min-height: 30px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 2px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.note-clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 10.5px;
}

.note-clear:hover {
  color: var(--link-hover);
}

.result-section {
  margin-bottom: 11px;
  overflow: hidden;
}

.section-head {
  display: flex;
  min-height: 39px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
}

.section-title svg {
  color: var(--text-muted);
}

.section-count {
  display: inline-flex;
  min-width: 18px;
  height: 17px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 400;
  line-height: 1;
}

.section-more {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 10.5px;
}

.section-more:hover {
  color: var(--link-hover);
}

.search-state {
  margin-bottom: 12px;
}

.search-loading {
  overflow: hidden;
  margin-top: 7px;
}

.loading-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 17px;
}

.loading-row + .loading-row {
  border-top: 1px solid var(--border);
}

.loading-mark {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
}

.loading-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 7px;
}

.loading-title {
  width: 42%;
  height: 13px;
}

.loading-line {
  width: 78%;
  height: 10px;
}

.loading-meta {
  width: 32%;
  height: 8px;
}

.landing-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 14px;
  margin-top: 8px;
}

.guide-panel {
  overflow: hidden;
}

.guide-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 15px 12px;
  border-bottom: 1px solid var(--border);
}

.guide-head.compact {
  padding-bottom: 10px;
}

.guide-icon {
  display: inline-flex;
  width: 27px;
  height: 27px;
  flex: 0 0 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.guide-head h2 {
  margin: 0 0 2px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}

.guide-head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.5;
}

.scope-list {
  padding: 3px 0;
}

.scope-guide {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 15px;
}

.scope-guide + .scope-guide {
  border-top: 1px solid #f0f1f2;
}

.scope-guide-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--text-faint);
}

.scope-guide strong {
  display: block;
  margin-bottom: 1px;
  color: var(--text);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.4;
}

.scope-guide p {
  margin: 0;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.45;
}

.landing-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 14px 14px;
}

.popular-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border: 1px solid #ccdce7;
  border-radius: 3px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 11px;
  line-height: 1.35;
}

.popular-tag:hover {
  background: var(--tag-hover);
  color: var(--tag-text);
}

.popular-tag strong {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 400;
}

.search-tips {
  margin: 0;
  padding: 11px 16px 13px 30px;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.search-tips li + li {
  margin-top: 5px;
}

.guide-skeleton-title {
  width: 110px;
  height: 13px;
  margin: 16px 15px 10px;
}

.guide-skeleton-line {
  display: block;
  width: 76%;
  height: 10px;
  margin: 0 15px 8px;
}

.guide-skeleton-line.short {
  width: 48%;
  margin-bottom: 16px;
}

@media (max-width: 820px) {
  .search-head {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .search-form {
    max-width: none;
    flex-basis: auto;
  }

  .landing-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .search-page {
    padding-top: 16px;
    padding-bottom: 30px;
  }

  .head-copy h1 {
    font-size: 21px;
  }

  .head-copy p {
    font-size: 12px;
  }

  .search-form {
    height: 34px;
  }

  .scope-tab {
    min-height: 36px;
    padding: 0 10px;
    font-size: 11.5px;
  }

  .result-summary,
  .scope-note {
    padding-right: 1px;
    padding-left: 1px;
  }

  .section-head {
    padding: 0 12px;
  }
}
</style>
