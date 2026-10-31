<template>
  <div class="page-container my-projects-page">
    <div class="page-back">
      <RouterLink :to="{ name: 'projects' }">
        <ArrowLeft :size="13" />
        返回项目展示
      </RouterLink>
    </div>

    <header class="page-head">
      <div class="page-head-copy">
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          MY PROJECTS
        </div>
        <h1>我的项目</h1>
        <p>维护自己的项目资料与招募需求. 每次提交后都会进入管理员审核, 通过后才会公开展示.</p>
        <span v-if="myStore.items.length" class="head-count">
          共 {{ myStore.items.length }} 个项目{{
            pendingCount ? `, ${pendingCount} 个待审核` : ''
          }}
        </span>
      </div>
      <div class="head-actions">
        <RouterLink
          v-if="projectStore.boardEnabled"
          class="btn btn-secondary btn-sm"
          :to="{ name: 'projects' }"
        >
          浏览项目
        </RouterLink>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'project-new' }">
          <Plus :size="13" />
          发布项目
        </RouterLink>
      </div>
    </header>

    <p
      v-if="projectStore.boardLoaded && !projectStore.boardEnabled && !projectStore.boardError"
      class="board-notice"
    >
      <EyeOff :size="12" aria-hidden="true" />
      项目板块当前对访客隐藏. 你仍可维护项目, 板块开启并通过审核后才会公开展示.
    </p>

    <div v-if="myStore.loading && !myStore.loaded" class="project-loading" aria-busy="true">
      <div v-for="index in 3" :key="index" class="panel loading-row">
        <span class="skeleton loading-cover" />
        <div class="loading-copy">
          <span class="skeleton loading-title" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line short" />
        </div>
      </div>
    </div>

    <div v-else-if="myStore.error" class="panel page-state">
      <EmptyState title="加载我的项目失败" :description="myStore.error">
        <button class="btn btn-secondary btn-sm" type="button" @click="retry">重试</button>
      </EmptyState>
    </div>

    <div v-else-if="myStore.items.length === 0" class="panel page-state">
      <EmptyState
        title="还没有提交过项目"
        description="把你正在做的课程项目, 实验室工具或开源作品带进来, 等待管理员审核后上线."
      >
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'project-new' }">
          发布第一个项目
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else class="project-list">
      <article
        v-for="project in myStore.items"
        :key="project.id"
        class="my-project panel"
      >
        <div class="project-cover">
          <RouterLink
            v-if="canView(project)"
            :to="{ name: 'project-detail', params: { slug: project.slug } }"
            :aria-label="`查看 ${project.name} 的公开页`"
          >
            <img :src="project.coverImage" :alt="`${project.name} 项目截图`" loading="lazy" />
          </RouterLink>
          <img
            v-else
            :src="project.coverImage"
            :alt="`${project.name} 项目截图`"
            loading="lazy"
          />
          <ProjectReviewBadge class="cover-review" :status="project.reviewStatus" />
        </div>

        <div class="project-body">
          <div class="title-row">
            <h2>{{ project.name }}</h2>
            <ProjectStatusBadge :status="project.status" />
            <span v-if="project.isFeatured" class="featured-tag">精选</span>
            <span v-if="project.visibility === 'hidden'" class="hidden-tag">管理员已隐藏</span>
          </div>
          <p class="project-tagline">{{ project.tagline }}</p>

          <div class="meta-row">
            <span class="mono">#{{ project.id }} / {{ project.slug }}</span>
            <span>{{ project.memberCount }} 人</span>
            <span>{{ project.updateCount }} 篇开发日志</span>
            <span>更新于 {{ formatRelativeTime(project.updatedAt) }}</span>
          </div>

          <div
            v-if="project.reviewStatus === 'rejected' && project.reviewNote"
            class="review-note"
          >
            <AlertTriangle :size="12" aria-hidden="true" />
            <div>
              <strong>审核备注</strong>
              <span>{{ project.reviewNote }}</span>
            </div>
          </div>
          <p v-else class="review-caption">{{ reviewCaption(project) }}</p>
        </div>

        <div class="project-actions">
          <RouterLink
            class="btn btn-primary btn-sm"
            :to="{ name: 'project-edit', params: { id: project.id } }"
          >
            <Pencil :size="12" />
            编辑
          </RouterLink>
          <RouterLink
            v-if="canView(project)"
            class="btn btn-secondary btn-sm"
            :to="{ name: 'project-detail', params: { slug: project.slug } }"
          >
            <Eye :size="12" />
            查看公开页
          </RouterLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, ArrowLeft, Eye, EyeOff, Pencil, Plus } from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import ProjectReviewBadge from '@/components/projects/ProjectReviewBadge.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import type { MyProject } from '@/api/types'
import { useMyProjectsStore } from '@/stores/my-projects'
import { useProjectStore } from '@/stores/projects'
import { formatRelativeTime } from '@/utils/format'

const myStore = useMyProjectsStore()
const projectStore = useProjectStore()

const pendingCount = computed(
  () => myStore.items.filter((project) => project.reviewStatus === 'pending').length,
)

function canView(project: MyProject): boolean {
  return (
    project.reviewStatus === 'approved' &&
    project.visibility === 'published' &&
    projectStore.boardEnabled
  )
}

function reviewCaption(project: MyProject): string {
  if (project.reviewStatus === 'pending') {
    return project.submittedAt
      ? `已提交审核, ${formatRelativeTime(project.submittedAt)}`
      : '等待管理员审核'
  }
  if (project.reviewStatus === 'approved') {
    const reviewed = project.reviewedAt
      ? `审核通过, ${formatRelativeTime(project.reviewedAt)}`
      : '已通过审核'
    return project.visibility === 'published'
      ? reviewed
      : `${reviewed}. 当前被管理员隐藏, 修改后会重新审核.`
  }
  return '请根据审核备注修改后重新提交.'
}

function retry(): void {
  void myStore.loadMine(true)
}

void myStore.loadMine(true)
</script>

<style scoped>
.my-projects-page {
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

.board-notice {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: -2px 0 12px;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.project-loading {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loading-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
}

.loading-cover {
  width: 156px;
  height: 98px;
  flex: 0 0 156px;
}

.loading-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.loading-title {
  width: 28%;
  height: 15px;
}

.loading-line {
  width: 72%;
  height: 9px;
}

.loading-line.short {
  width: 42%;
}

.page-state {
  overflow: hidden;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.my-project {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px;
}

.project-cover {
  position: relative;
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

.project-cover > a {
  display: block;
  width: 100%;
  height: 100%;
}

.cover-review {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  box-shadow: 0 1px 3px rgba(18, 24, 30, 0.12);
}

.project-body {
  min-width: 0;
  flex: 1;
}

.title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.title-row h2 {
  margin: 0;
  color: var(--text);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.15px;
}

.featured-tag,
.hidden-tag {
  padding: 1px 5px;
  border: 1px solid #e8d6b4;
  border-radius: 2px;
  background: #fffaf0;
  color: #87611e;
  font-size: 8.5px;
  line-height: 1.4;
}

.hidden-tag {
  border-color: #e7c8c8;
  background: #fdf4f4;
  color: var(--danger);
}

.project-tagline {
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
  gap: 3px 12px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.meta-row .mono {
  font-family: var(--font-mono);
}

.review-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 7px;
  padding: 6px 8px;
  border: 1px solid #e7c8c8;
  border-radius: 2px;
  background: #fdf7f7;
  color: var(--danger);
  font-size: 10px;
  line-height: 1.55;
}

.review-note div {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 6px;
}

.review-note strong {
  flex: 0 0 auto;
  font-weight: 600;
}

.review-note span {
  color: var(--text-secondary);
}

.review-caption {
  margin: 7px 0 0;
  color: var(--text-faint);
  font-size: 9.5px;
}

.project-actions {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.project-actions .btn {
  justify-content: center;
  white-space: nowrap;
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

@media (max-width: 700px) {
  .my-project {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .project-cover {
    width: 128px;
    height: 80px;
    flex-basis: 128px;
  }

  .project-body {
    flex-basis: calc(100% - 142px);
  }

  .project-actions {
    width: 100%;
    flex-direction: row;
  }

  .project-actions .btn {
    flex: 1;
  }

  .project-actions a:only-child {
    flex: 0 0 auto;
  }
}

@media (max-width: 520px) {
  .project-cover {
    width: 100%;
    height: auto;
    flex-basis: 100%;
    aspect-ratio: 16 / 9;
  }

  .project-body {
    flex-basis: 100%;
  }
}
</style>
