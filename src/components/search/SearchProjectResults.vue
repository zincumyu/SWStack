<template>
  <div class="result-list">
    <RouterLink
      v-for="project in items"
      :key="project.id"
      class="project-row"
      :to="{ name: 'project-detail', params: { slug: project.slug } }"
    >
      <div class="project-cover">
        <img
          :src="project.coverImage"
          :alt="`${project.name} 界面截图`"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div class="project-copy">
        <div class="project-title-row">
          <span class="project-title">
            <SearchHighlight :text="project.name" :keyword="keyword" />
          </span>
          <ProjectStatusBadge :status="project.status" />
          <span v-if="project.isFeatured" class="featured-flag">精选</span>
        </div>

        <p class="project-tagline">
          <SearchHighlight :text="project.tagline" :keyword="keyword" />
        </p>

        <div class="project-meta">
          <span class="project-owner">
            <UserAvatar :user="project.owner" :size="16" />
            <SearchHighlight :text="project.owner.name" :keyword="keyword" />
          </span>
          <span
            v-for="tech in project.techStack.slice(0, 4)"
            :key="tech"
            class="tech-chip"
          >
            <SearchHighlight :text="tech" :keyword="keyword" />
          </span>
          <span class="project-updates">{{ project.updateCount }} 篇日志</span>
          <time :datetime="project.lastUpdatedAt">
            {{ formatRelativeTime(project.lastUpdatedAt) }}
          </time>
        </div>
      </div>

      <ArrowRight :size="14" class="row-arrow" aria-hidden="true" />
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { ProjectSummary } from '@/api/types'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import SearchHighlight from '@/components/search/SearchHighlight.vue'
import { formatRelativeTime } from '@/utils/format'

withDefaults(
  defineProps<{
    items: ProjectSummary[]
    keyword?: string
  }>(),
  { keyword: '' },
)
</script>

<style scoped>
.result-list :deep(*) {
  min-width: 0;
}

.project-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
  color: var(--text-secondary);
  transition: background-color 120ms ease;
}

.project-row + .project-row {
  border-top: 1px solid var(--border);
}

.project-row:hover {
  background: #fbfcfc;
  color: var(--text-secondary);
}

.project-cover {
  width: 94px;
  height: 58px;
  flex: 0 0 94px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-muted);
}

.project-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-copy {
  min-width: 0;
  flex: 1;
}

.project-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.project-title {
  overflow: hidden;
  color: var(--link);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-row:hover .project-title {
  color: var(--link-hover);
}

.featured-flag {
  flex: 0 0 auto;
  padding: 1px 5px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 9px;
  font-weight: 600;
}

.project-tagline {
  overflow: hidden;
  margin: 3px 0 7px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 10px;
  white-space: nowrap;
}

.project-owner {
  display: inline-flex;
  max-width: 150px;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  color: var(--text-muted);
}

.project-owner :deep(.user-avatar) {
  flex: 0 0 auto;
}

.tech-chip {
  max-width: 90px;
  overflow: hidden;
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
  text-overflow: ellipsis;
}

.project-updates {
  margin-left: auto;
}

.project-meta time {
  color: var(--text-faint);
}

.row-arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
}

@media (max-width: 640px) {
  .project-row {
    gap: 10px;
    padding: 11px 12px;
  }

  .project-cover {
    width: 68px;
    height: 45px;
    flex-basis: 68px;
  }

  .project-title {
    font-size: 13px;
  }

  .project-tagline {
    margin-bottom: 6px;
    white-space: normal;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .tech-chip,
  .project-updates,
  .row-arrow {
    display: none;
  }

  .project-meta {
    gap: 5px;
  }

  .project-meta time {
    margin-left: auto;
  }
}
</style>
