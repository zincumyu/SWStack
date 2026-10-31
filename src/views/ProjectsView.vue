<template>
  <div class="page-container projects-page">
    <section class="projects-head" aria-labelledby="projects-title">
      <div class="projects-head-copy">
        <div class="projects-eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          PROJECT SHOWCASE
        </div>
        <h1 id="projects-title">项目展示</h1>
        <p>来自课程, 实验室与开源小组的真实项目. 看看别人在做什么, 也把你的项目带进来.</p>
      </div>
      <div class="head-actions">
        <div v-if="projectStore.boardEnabled" class="head-entry">
          <RouterLink
            v-if="sessionStore.isAuthenticated"
            class="btn btn-secondary btn-sm"
            :to="{ name: 'my-projects' }"
          >
            <FolderGit2 :size="13" />
            我的项目
          </RouterLink>
          <RouterLink class="btn btn-primary btn-sm" :to="submitTarget">
            <Plus :size="13" />
            发布项目
          </RouterLink>
        </div>
        <div class="head-note">
          <FolderGit2 :size="16" aria-hidden="true" />
          <div>
            <strong>{{ headCount }}</strong>
            <span>{{ headCaption }}</span>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="projectStore.boardLoading && !projectStore.boardLoaded"
      class="projects-grid"
      aria-busy="true"
      aria-label="项目加载中"
    >
      <article v-for="index in 6" :key="index" class="project-skeleton panel">
        <span class="skeleton skeleton-cover" />
        <div class="skeleton-body">
          <span class="skeleton skeleton-title" />
          <span class="skeleton skeleton-line" />
          <span class="skeleton skeleton-line short" />
          <span class="skeleton skeleton-chips" />
        </div>
      </article>
    </div>

    <div
      v-else-if="projectStore.boardError && !projectStore.boardEnabled"
      class="panel board-error"
    >
      <EmptyState
        title="项目板块加载失败"
        :description="projectStore.boardError"
      >
        <button class="btn btn-secondary btn-sm" type="button" @click="retry">重试</button>
      </EmptyState>
    </div>

    <ProjectBoardClosed v-else-if="projectStore.isBoardClosed" />

    <template v-else>
      <form class="project-filters panel" role="search" @submit.prevent="load">
        <label class="project-search">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="searchDraft"
            type="search"
            placeholder="搜索项目, 技术栈或团队"
            aria-label="搜索项目"
          />
        </label>
        <select
          v-model="statusFilter"
          class="project-select"
          aria-label="按项目状态筛选"
          @change="load"
        >
          <option value="all">全部状态</option>
          <option value="idea">构思中</option>
          <option value="building">开发中</option>
          <option value="beta">内测中</option>
          <option value="launched">已上线</option>
          <option value="archived">已归档</option>
        </select>
        <select
          v-model="needFilter"
          class="project-select"
          aria-label="按项目需求筛选"
          @change="load"
        >
          <option value="all">全部需求</option>
          <option value="feedback">求反馈</option>
          <option value="teammates">找队友</option>
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
        <span class="project-count">{{ projectStore.total }} 个项目</span>
      </form>

      <div
        v-if="projectStore.listLoading"
        class="projects-grid"
        aria-busy="true"
        aria-label="项目加载中"
      >
        <article v-for="index in 6" :key="index" class="project-skeleton panel">
          <span class="skeleton skeleton-cover" />
          <div class="skeleton-body">
            <span class="skeleton skeleton-title" />
            <span class="skeleton skeleton-line" />
            <span class="skeleton skeleton-line short" />
            <span class="skeleton skeleton-chips" />
          </div>
        </article>
      </div>

      <div v-else-if="projectStore.listError" class="panel board-error">
        <EmptyState
          title="加载项目失败"
          :description="projectStore.listError"
        >
          <button class="btn btn-secondary btn-sm" type="button" @click="retry">重试</button>
        </EmptyState>
      </div>

      <div v-else-if="projectStore.projects.length === 0" class="panel board-error">
        <EmptyState
          title="没有找到项目"
          description="换一个关键词, 状态或需求再试试."
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

      <div v-else class="projects-grid">
        <ProjectCard
          v-for="project in projectStore.projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { FolderGit2, Plus, Search } from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import ProjectBoardClosed from '@/components/projects/ProjectBoardClosed.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import type { ProjectNeedFilter, ProjectStatusFilter } from '@/api/types'
import { useProjectStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'

const projectStore = useProjectStore()
const sessionStore = useSessionStore()
const searchDraft = ref('')
const statusFilter = ref<ProjectStatusFilter>('all')
const needFilter = ref<ProjectNeedFilter>('all')
const pageSize = 12

const submitTarget = computed<RouteLocationRaw>(() =>
  sessionStore.isAuthenticated
    ? { name: 'project-new' }
    : { name: 'login', query: { redirect: '/my/projects/new' } },
)

const hasFilters = computed(
  () =>
    Boolean(searchDraft.value.trim()) ||
    statusFilter.value !== 'all' ||
    needFilter.value !== 'all',
)

const headCount = computed(() => {
  if (!projectStore.boardLoaded) {
    return '读取中'
  }
  if (projectStore.boardError) {
    return '板块不可用'
  }
  if (!projectStore.boardEnabled) {
    return '板块已隐藏'
  }
  return `${projectStore.total} 个项目`
})

const headCaption = computed(() => {
  if (!projectStore.boardLoaded) {
    return '正在读取板块状态'
  }
  if (projectStore.boardError) {
    return '暂时无法读取板块状态'
  }
  if (!projectStore.boardEnabled) {
    return '项目入口暂时关闭'
  }
  return '由社区成员维护与更新'
})

function load(): void {
  void projectStore.loadProjects({
    page: 1,
    pageSize,
    q: searchDraft.value.trim() || undefined,
    status: statusFilter.value,
    need: needFilter.value,
  })
}

function resetFilters(): void {
  searchDraft.value = ''
  statusFilter.value = 'all'
  needFilter.value = 'all'
  load()
}

function retry(): void {
  void projectStore.loadBoard(true).then(() => load())
}

load()
</script>

<style scoped>
.projects-page {
  padding-top: 2px;
}

.projects-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 14px;
}

.projects-eyebrow {
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

.projects-head h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.projects-head p {
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

.head-entry {
  display: flex;
  align-items: center;
  gap: 7px;
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
  font-size: 11px;
  font-weight: 600;
}

.head-note span {
  color: var(--text-faint);
  font-size: 9.5px;
}

.project-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 9px 11px;
  background: var(--surface-subtle);
}

.project-search {
  display: flex;
  width: 100%;
  max-width: 330px;
  min-width: 180px;
  height: 32px;
  flex: 1;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-faint);
}

.project-search:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.project-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 12px;
}

.project-search input::placeholder {
  color: var(--text-faint);
}

.project-search input::-webkit-search-cancel-button {
  display: none;
}

.project-select {
  min-height: 32px;
  padding: 5px 24px 5px 8px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 11.5px;
  cursor: pointer;
}

.project-select:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.project-count {
  margin-left: auto;
  color: var(--text-faint);
  font-size: 10.5px;
  white-space: nowrap;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.project-skeleton {
  overflow: hidden;
}

.skeleton-cover {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 0;
}

.skeleton-body {
  display: flex;
  padding: 13px;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  width: 42%;
  height: 14px;
}

.skeleton-line {
  width: 100%;
  height: 9px;
}

.skeleton-line.short {
  width: 68%;
}

.skeleton-chips {
  width: 52%;
  height: 15px;
  margin-top: 3px;
}

.board-error {
  overflow: hidden;
}

@media (max-width: 1040px) {
  .projects-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .projects-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .head-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .head-note {
    padding: 7px 9px;
  }

  .project-search {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .projects-page {
    padding-top: 0;
  }

  .projects-head h1 {
    font-size: 23px;
  }

  .projects-head p {
    font-size: 11.5px;
  }

  .projects-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .project-filters {
    gap: 6px;
  }

  .project-search {
    flex-basis: 100%;
  }

  .project-select {
    flex: 1;
    min-width: 0;
  }

  .project-count {
    margin-left: 0;
    width: 100%;
    padding-top: 2px;
    text-align: right;
  }
}
</style>
