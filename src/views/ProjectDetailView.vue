<template>
  <div class="page-container project-detail-page">
    <div class="detail-back">
      <RouterLink :to="{ name: 'projects' }">
        <ArrowLeft :size="13" />
        返回项目展示
      </RouterLink>
    </div>

    <div
      v-if="projectStore.boardLoading && !projectStore.boardLoaded"
      class="detail-loading"
      aria-busy="true"
      aria-label="项目加载中"
    >
      <div class="panel hero-loading">
        <span class="skeleton loading-cover" />
        <div class="loading-copy">
          <span class="skeleton loading-line short" />
          <span class="skeleton loading-title" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line" />
        </div>
      </div>
      <div class="detail-layout">
        <div class="panel loading-panel">
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line short" />
        </div>
        <div class="panel loading-panel">
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line" />
        </div>
      </div>
    </div>

    <div
      v-else-if="projectStore.boardError && !projectStore.boardEnabled"
      class="panel detail-state"
    >
      <EmptyState title="项目板块加载失败" :description="projectStore.boardError">
        <button class="btn btn-secondary btn-sm" type="button" @click="retry">重试</button>
      </EmptyState>
    </div>

    <ProjectBoardClosed v-else-if="projectStore.isBoardClosed" />

    <div
      v-else-if="projectStore.detailLoading && !project"
      class="detail-loading"
      aria-busy="true"
      aria-label="项目加载中"
    >
      <div class="panel hero-loading">
        <span class="skeleton loading-cover" />
        <div class="loading-copy">
          <span class="skeleton loading-line short" />
          <span class="skeleton loading-title" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line" />
        </div>
      </div>
      <div class="detail-layout">
        <div class="panel loading-panel">
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line short" />
        </div>
        <div class="panel loading-panel">
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line" />
        </div>
      </div>
    </div>

    <div v-else-if="projectStore.detailError" class="panel detail-state">
      <EmptyState title="项目不可用" :description="projectStore.detailError">
        <button class="btn btn-secondary btn-sm" type="button" @click="retry">重试</button>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'projects' }">
          返回项目展示
        </RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="project">
      <section class="project-hero panel" aria-labelledby="project-title">
        <div class="hero-cover">
          <img :src="project.coverImage" :alt="`${project.name} 界面截图`" />
        </div>

        <div class="hero-copy">
          <div class="hero-kicker">
            <ProjectStatusBadge :status="project.status" />
            <span v-if="project.isFeatured" class="hero-featured">精选项目</span>
            <span v-if="project.teamName" class="hero-team">{{ project.teamName }}</span>
          </div>

          <h1 id="project-title">{{ project.name }}</h1>
          <p class="hero-tagline">{{ project.tagline }}</p>

          <div class="hero-tech" aria-label="技术栈">
            <span v-for="tech in project.techStack" :key="tech" class="tech-chip">
              {{ tech }}
            </span>
          </div>

          <div class="hero-needs">
            <span
              v-for="need in project.needs"
              :key="need"
              class="need-pill"
              :class="need"
            >
              <MessageSquareText v-if="need === 'feedback'" :size="11" />
              <UsersRound v-else :size="11" />
              {{ PROJECT_NEED_META[need].label }}
            </span>
            <span v-if="project.needs.length === 0" class="needs-empty">暂不招募</span>
          </div>

          <div class="hero-actions">
            <a
              v-if="project.githubUrl"
              class="btn btn-secondary btn-sm"
              :href="project.githubUrl"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Github :size="13" />
              GitHub
            </a>
            <a
              v-if="project.demoUrl"
              class="btn btn-secondary btn-sm"
              :href="project.demoUrl"
              target="_blank"
              rel="noreferrer noopener"
            >
              <ExternalLink :size="13" />
              在线 Demo
            </a>
            <RouterLink
              v-if="isOwner"
              class="btn btn-ghost btn-sm"
              :to="{ name: 'project-edit', params: { id: project.id } }"
            >
              <Pencil :size="13" />
              编辑项目
            </RouterLink>
          </div>

          <dl class="hero-meta">
            <div>
              <dt>负责人</dt>
              <dd class="meta-owner">
                <UserAvatar :user="project.owner" :size="20" />
                {{ project.owner.name }}
              </dd>
            </div>
            <div>
              <dt>成员</dt>
              <dd>{{ project.memberCount }} 人</dd>
            </div>
            <div>
              <dt>最近更新</dt>
              <dd>{{ formatRelativeTime(project.lastUpdatedAt) }}</dd>
            </div>
            <div>
              <dt>开发日志</dt>
              <dd>{{ project.updateCount }} 篇</dd>
            </div>
          </dl>
        </div>
      </section>

      <div class="detail-layout">
        <div class="detail-main">
          <section
            v-if="project.screenshots.length"
            class="panel gallery-panel"
            aria-labelledby="gallery-title"
          >
            <div class="panel-header">
              <h2 id="gallery-title" class="panel-title">
                <Images :size="14" aria-hidden="true" />
                项目截图
              </h2>
              <span class="panel-note">
                {{ project.screenshots.length }} 张, 点击放大
              </span>
            </div>
            <div class="gallery-body">
              <ProjectGallery
                :images="project.screenshots"
                :label="`${project.name} 截图`"
              />
            </div>
          </section>

          <section class="panel readme-panel" aria-labelledby="readme-title">
            <div class="panel-header">
              <h2 id="readme-title" class="panel-title">
                <BookOpen :size="14" aria-hidden="true" />
                README
              </h2>
              <span class="panel-note">由项目成员维护</span>
            </div>
            <div class="readme-body">
              <MarkdownRenderer :source="project.readme" />
            </div>
          </section>

          <section class="panel timeline-panel" aria-labelledby="timeline-title">
            <div class="panel-header">
              <h2 id="timeline-title" class="panel-title">
                <History :size="14" aria-hidden="true" />
                开发日志
              </h2>
              <span class="panel-note">{{ project.updateCount }} 条更新</span>
            </div>

            <ol v-if="project.updates.length" class="update-timeline">
              <li v-for="update in project.updates" :key="update.id">
                <span class="timeline-dot" aria-hidden="true" />
                <div class="timeline-content">
                  <div class="timeline-head">
                    <h3>{{ update.title }}</h3>
                    <time :datetime="update.createdAt">
                      {{ formatShortDate(update.createdAt) }}
                    </time>
                  </div>
                  <p>{{ update.body }}</p>
                  <div class="timeline-author">
                    <UserAvatar :user="update.author" :size="18" />
                    <span>{{ update.author.name }}</span>
                    <span class="author-time">{{ formatRelativeTime(update.createdAt) }}</span>
                  </div>
                </div>
              </li>
            </ol>
            <div v-else class="timeline-empty">还没有公开的开发日志.</div>
          </section>
        </div>

        <aside class="detail-side">
          <section class="panel side-panel" aria-labelledby="needs-title">
            <div class="panel-header">
              <h2 id="needs-title" class="panel-title">
                <Sparkles :size="14" aria-hidden="true" />
                正在寻找
              </h2>
            </div>
            <div class="needs-body">
              <div v-if="project.needs.length" class="need-rows">
                <div
                  v-for="need in project.needs"
                  :key="need"
                  class="need-row"
                  :class="need"
                >
                  <span class="need-icon" aria-hidden="true">
                    <MessageSquareText v-if="need === 'feedback'" :size="13" />
                    <UsersRound v-else :size="13" />
                  </span>
                  <div>
                    <strong>{{ PROJECT_NEED_META[need].label }}</strong>
                    <p>{{ PROJECT_NEED_META[need].description }}</p>
                  </div>
                </div>
              </div>
              <p v-else class="needs-none">项目组当前没有公开招募需求.</p>

              <a
                v-if="contactUrl"
                class="btn btn-primary btn-sm needs-cta"
                :href="contactUrl"
                target="_blank"
                rel="noreferrer noopener"
              >
                {{ contactLabel }}
                <ExternalLink :size="12" />
              </a>
              <p v-else class="needs-contact-note">项目组暂未公开联系方式.</p>
            </div>
          </section>

          <section class="panel side-panel" aria-labelledby="members-title">
            <div class="panel-header">
              <h2 id="members-title" class="panel-title">
                <Users :size="14" aria-hidden="true" />
                项目成员
              </h2>
              <span class="panel-note">{{ project.memberCount }} 人</span>
            </div>
            <ul class="member-list">
              <li v-for="member in project.members" :key="member.user.id">
                <RouterLink
                  class="member-link"
                  :to="{ name: 'user-profile', params: { handle: member.user.handle } }"
                >
                  <UserAvatar :user="member.user" :size="28" />
                  <span class="member-copy">
                    <span class="member-name">
                      {{ member.user.name }}
                      <span v-if="member.isOwner" class="owner-badge">负责人</span>
                    </span>
                    <span class="member-role">{{ member.role }}</span>
                  </span>
                  <ArrowUpRight :size="12" class="member-arrow" />
                </RouterLink>
              </li>
            </ul>
          </section>

          <section class="panel side-panel" aria-labelledby="info-title">
            <div class="panel-header">
              <h2 id="info-title" class="panel-title">
                <Info :size="14" aria-hidden="true" />
                项目信息
              </h2>
            </div>
            <dl class="info-list">
              <div>
                <dt>状态</dt>
                <dd><ProjectStatusBadge :status="project.status" /></dd>
              </div>
              <div v-if="project.teamName">
                <dt>团队</dt>
                <dd>{{ project.teamName }}</dd>
              </div>
              <div>
                <dt>创建于</dt>
                <dd>{{ formatShortDate(project.createdAt) }}</dd>
              </div>
              <div>
                <dt>最近更新</dt>
                <dd>{{ formatShortDate(project.lastUpdatedAt) }}</dd>
              </div>
              <div>
                <dt>开发日志</dt>
                <dd>{{ project.updateCount }} 篇</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>

    <div v-else class="panel detail-state">
      <EmptyState title="没有找到这个项目" description="项目可能已被隐藏或删除.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'projects' }">
          返回项目展示
        </RouterLink>
      </EmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ExternalLink,
  Github,
  History,
  Images,
  Info,
  MessageSquareText,
  Pencil,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import ProjectBoardClosed from '@/components/projects/ProjectBoardClosed.vue'
import ProjectGallery from '@/components/projects/ProjectGallery.vue'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import { useProjectStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { formatRelativeTime, formatShortDate } from '@/utils/format'
import { PROJECT_NEED_META } from '@/utils/project-meta'

const route = useRoute()
const projectStore = useProjectStore()
const sessionStore = useSessionStore()

const slug = computed(() => String(route.params.slug ?? ''))
const project = computed(() => projectStore.current)
const isOwner = computed(
  () =>
    Boolean(project.value) &&
    sessionStore.user?.handle === project.value?.owner.handle,
)

const contactUrl = computed(() => {
  const github = project.value?.githubUrl
  if (!github) {
    return ''
  }
  const needs = project.value?.needs ?? []
  return needs.includes('feedback') && !needs.includes('teammates')
    ? `${github}/issues`
    : github
})

const contactLabel = computed(() => {
  const needs = project.value?.needs ?? []
  if (needs.includes('feedback') && needs.includes('teammates')) {
    return '在 GitHub 参与项目'
  }
  if (needs.includes('feedback')) {
    return '在 GitHub 提交反馈'
  }
  return '在 GitHub 联系项目组'
})

function load(force = false): void {
  const value = slug.value
  if (!value) {
    return
  }
  void projectStore.loadProject(value, force)
}

function retry(): void {
  void projectStore.loadBoard(true).then(() => load(true))
}

watch(
  slug,
  () => {
    load()
  },
  { immediate: true },
)

watch(
  project,
  (value) => {
    if (value) {
      document.title = `${value.name} - SWStack`
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.project-detail-page {
  padding-top: 0;
}

.detail-back {
  margin: 0 0 9px;
}

.detail-back a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 11px;
}

.detail-back a:hover {
  color: var(--link-hover);
}

.project-hero {
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  overflow: hidden;
}

.hero-cover {
  overflow: hidden;
  border-right: 1px solid var(--border);
  background: var(--surface-subtle);
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 18px 22px 17px;
}

.hero-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.hero-featured {
  padding: 2px 6px;
  border: 1px solid #e8d6b4;
  border-radius: 2px;
  background: #fffaf0;
  color: #87611e;
  font-size: 9px;
  line-height: 1.25;
}

.hero-team {
  margin-left: auto;
  color: var(--text-faint);
  font-size: 10px;
}

.hero-copy h1 {
  margin: 9px 0 4px;
  color: var(--text);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.55px;
  line-height: 1.2;
}

.hero-tagline {
  max-width: 680px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.hero-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 11px;
}

.tech-chip {
  padding: 1px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 9.5px;
  line-height: 1.5;
}

.hero-needs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.need-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-size: 9.5px;
  line-height: 1.4;
}

.need-pill.feedback {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.need-pill.teammates {
  border-color: #cbdbe5;
  background: #f1f7fa;
  color: #3e6c85;
}

.needs-empty {
  color: var(--text-faint);
  font-size: 10px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 13px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin: auto 0 0;
  padding-top: 14px;
}

.hero-meta > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-meta dt {
  color: var(--text-faint);
  font-size: 9.5px;
}

.hero-meta dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 11px;
}

.meta-owner {
  display: flex;
  align-items: center;
  gap: 5px;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
  align-items: start;
  margin-top: 14px;
}

.detail-main {
  min-width: 0;
}

.readme-panel {
  overflow: hidden;
}

.gallery-panel {
  margin-bottom: 14px;
  overflow: hidden;
}

.gallery-body {
  padding: 12px 14px 14px;
}

.panel-note {
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.readme-body {
  padding: 16px 20px 18px;
}

.readme-body :deep(.markdown-body) {
  font-size: 13.5px;
  line-height: 1.72;
}

.timeline-panel {
  margin-top: 14px;
  overflow: hidden;
}

.update-timeline {
  position: relative;
  margin: 0;
  padding: 16px 18px 18px 32px;
  list-style: none;
}

.update-timeline::before {
  position: absolute;
  top: 23px;
  bottom: 26px;
  left: 22px;
  width: 1px;
  background: var(--border);
  content: '';
}

.update-timeline li {
  position: relative;
  padding-bottom: 18px;
}

.update-timeline li:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  top: 5px;
  left: -14px;
  width: 7px;
  height: 7px;
  border: 2px solid var(--surface);
  border-radius: 50%;
  background: var(--brand);
  box-shadow: 0 0 0 1px var(--brand-border);
}

.timeline-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.timeline-head h3 {
  margin: 0;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
}

.timeline-head time {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.timeline-content > p {
  margin: 4px 0 7px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.65;
}

.timeline-author {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.author-time {
  margin-left: 2px;
}

.timeline-empty {
  padding: 28px 18px;
  color: var(--text-muted);
  font-size: 11.5px;
  text-align: center;
}

.detail-side {
  position: sticky;
  top: calc(var(--header-height) + 20px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.side-panel {
  overflow: hidden;
}

.needs-body {
  padding: 11px 12px 12px;
}

.need-rows {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.need-row {
  display: flex;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.need-row.feedback {
  border-color: #f0d8bf;
  background: #fffaf4;
}

.need-row.teammates {
  border-color: #d7e2ea;
  background: #f7fafc;
}

.need-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
}

.need-row.feedback .need-icon {
  border-color: var(--brand-border);
  color: var(--brand-hover);
}

.need-row.teammates .need-icon {
  border-color: #cbdbe5;
  color: #3e6c85;
}

.need-row strong {
  display: block;
  margin-bottom: 1px;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.need-row p {
  margin: 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.55;
}

.needs-none {
  margin: 0;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.6;
}

.needs-cta {
  width: 100%;
  margin-top: 10px;
}

.needs-contact-note {
  margin: 9px 0 0;
  color: var(--text-faint);
  font-size: 9.5px;
}

.member-list {
  margin: 0;
  padding: 5px;
  list-style: none;
}

.member-link {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px;
  border-radius: 3px;
  color: var(--text-secondary);
}

.member-link:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.member-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.owner-badge {
  padding: 0 4px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 8px;
  font-weight: 500;
  line-height: 1.5;
}

.member-role {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
}

.info-list {
  margin: 0;
  padding: 3px 12px 6px;
}

.info-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
}

.info-list > div:last-child {
  border-bottom: 0;
}

.info-list dt {
  color: var(--text-faint);
  font-size: 10px;
}

.info-list dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 10.5px;
  text-align: right;
}

.detail-state {
  overflow: hidden;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero-loading {
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  overflow: hidden;
}

.loading-cover {
  min-height: 260px;
  border-radius: 0;
}

.loading-copy {
  display: flex;
  padding: 24px;
  flex-direction: column;
  gap: 10px;
}

.loading-line {
  display: block;
  width: 100%;
  height: 10px;
}

.loading-line.short {
  width: 34%;
}

.loading-title {
  display: block;
  width: 54%;
  height: 25px;
  margin: 4px 0;
}

.loading-panel {
  display: flex;
  padding: 18px;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 1040px) {
  .project-hero {
    grid-template-columns: 340px minmax(0, 1fr);
  }

  .hero-loading {
    grid-template-columns: 340px minmax(0, 1fr);
  }

  .detail-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

@media (max-width: 900px) {
  .project-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-cover {
    aspect-ratio: 16 / 8;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .hero-cover img {
    height: 100%;
  }

  .detail-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .detail-side {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-loading {
    grid-template-columns: minmax(0, 1fr);
  }

  .loading-cover {
    aspect-ratio: 16 / 8;
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .detail-back {
    margin-bottom: 8px;
  }

  .hero-copy {
    padding: 14px 15px 15px;
  }

  .hero-copy h1 {
    font-size: 23px;
  }

  .hero-team {
    width: 100%;
    margin-left: 0;
  }

  .hero-meta {
    gap: 12px 18px;
  }

  .readme-body {
    padding: 14px 15px 16px;
  }

  .readme-body :deep(.markdown-body) {
    font-size: 13px;
  }

  .detail-side {
    grid-template-columns: minmax(0, 1fr);
  }

  .timeline-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .update-timeline {
    padding: 14px 14px 16px 28px;
  }

  .update-timeline::before {
    left: 18px;
  }

  .timeline-dot {
    left: -14px;
  }
}
</style>
