<template>
  <article class="project-card panel">
    <div class="cover-wrap">
      <RouterLink
        class="cover-link"
        :to="detailTarget"
        :aria-label="`查看项目 ${project.name}`"
      >
        <img
          :src="project.coverImage"
          :alt="`${project.name} 界面截图`"
          loading="lazy"
          decoding="async"
        />
      </RouterLink>
      <ProjectStatusBadge class="cover-status" :status="project.status" />
      <span v-if="project.isFeatured" class="featured-badge">精选项目</span>
    </div>

    <div class="project-body">
      <div class="project-title-row">
        <RouterLink class="project-title" :to="detailTarget">
          {{ project.name }}
        </RouterLink>
        <span class="project-slug">{{ project.slug }}</span>
      </div>
      <p class="project-tagline">{{ project.tagline }}</p>

      <div class="tech-list" aria-label="技术栈">
        <span v-for="tech in project.techStack" :key="tech" class="tech-chip">
          {{ tech }}
        </span>
      </div>

      <div class="need-list">
        <span
          v-for="need in project.needs"
          :key="need"
          class="need-chip"
          :class="need"
        >
          <MessageSquareText v-if="need === 'feedback'" :size="10" aria-hidden="true" />
          <UsersRound v-else :size="10" aria-hidden="true" />
          {{ PROJECT_NEED_META[need].label }}
        </span>
        <span v-if="project.needs.length === 0" class="need-none">暂不招募</span>
      </div>

      <div class="project-meta">
        <span>
          <History :size="11" aria-hidden="true" />
          {{ project.updateCount }} 篇开发日志
        </span>
        <span>更新于 {{ formatRelativeTime(project.lastUpdatedAt) }}</span>
      </div>
    </div>

    <div class="project-footer">
      <div class="project-owner">
        <UserAvatar :user="project.owner" :size="20" />
        <span class="owner-name">{{ project.teamName || project.owner.name }}</span>
        <span class="member-count">{{ project.memberCount }} 人</span>
      </div>
      <div class="project-links">
        <a
          v-if="project.githubUrl"
          :href="project.githubUrl"
          target="_blank"
          rel="noreferrer noopener"
          title="打开 GitHub 仓库"
        >
          <Github :size="11" aria-hidden="true" />
          GitHub
        </a>
        <a
          v-if="project.demoUrl"
          :href="project.demoUrl"
          target="_blank"
          rel="noreferrer noopener"
          title="打开在线 Demo"
        >
          <ExternalLink :size="11" aria-hidden="true" />
          Demo
        </a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  ExternalLink,
  Github,
  History,
  MessageSquareText,
  UsersRound,
} from 'lucide-vue-next'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import type { ProjectSummary } from '@/api/types'
import { formatRelativeTime } from '@/utils/format'
import { PROJECT_NEED_META } from '@/utils/project-meta'

const props = defineProps<{
  project: ProjectSummary
}>()

const detailTarget = computed<RouteLocationRaw>(() => ({
  name: 'project-detail',
  params: { slug: props.project.slug },
}))
</script>

<style scoped>
.project-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.project-card:hover {
  border-color: #d2d7db;
  box-shadow: 0 2px 8px rgba(18, 24, 30, 0.07);
}

.cover-wrap {
  position: relative;
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
}

.cover-link {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.cover-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-status {
  position: absolute;
  top: 9px;
  left: 9px;
  z-index: 2;
  pointer-events: none;
}

.featured-badge {
  position: absolute;
  top: 9px;
  right: 9px;
  z-index: 2;
  padding: 2px 6px;
  border: 1px solid #e8d6b4;
  border-radius: 2px;
  background: #fffaf0;
  color: #87611e;
  font-size: 9px;
  line-height: 1.25;
  pointer-events: none;
}

.project-body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 7px;
  padding: 11px 13px 10px;
}

.project-title-row {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 7px;
}

.project-title {
  overflow: hidden;
  color: var(--text);
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.1px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-title:hover {
  color: var(--link-hover);
}

.project-slug {
  overflow: hidden;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-tagline {
  display: -webkit-box;
  min-height: 34px;
  margin: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tech-chip {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.5;
}

.need-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.need-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-size: 9.5px;
  line-height: 1.5;
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

.project-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  margin-top: auto;
  padding-top: 2px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.project-meta span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.project-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 13px;
  border-top: 1px solid var(--border);
  background: #fbfcfc;
}

.project-owner {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 9.5px;
}

.owner-name {
  overflow: hidden;
  max-width: 124px;
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-count {
  color: var(--text-faint);
  font-size: 9px;
  white-space: nowrap;
}

.project-links {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.project-links a {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--text-muted);
  font-size: 9.5px;
}

.project-links a:hover {
  color: var(--brand-hover);
}

@media (max-width: 560px) {
  .project-body {
    padding: 10px 11px 9px;
  }

  .project-footer {
    padding: 7px 11px;
  }

  .owner-name {
    max-width: 110px;
  }
}
</style>
