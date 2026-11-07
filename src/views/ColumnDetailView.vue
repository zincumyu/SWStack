<template>
  <div class="page-container column-detail-page">
    <div class="page-back">
      <RouterLink :to="{ name: 'columns' }">
        <ArrowLeft :size="13" />
        返回专栏
      </RouterLink>
    </div>

    <div
      v-if="loading && !column"
      class="column-loading"
      aria-busy="true"
      aria-label="专栏加载中"
    >
      <div class="panel hero-skeleton">
        <span class="skeleton loading-meta" />
        <span class="skeleton loading-title" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line short" />
      </div>
      <div class="panel loading-body">
        <span class="skeleton loading-line short" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line medium" />
      </div>
    </div>

    <div v-else-if="error" class="panel page-state">
      <EmptyState title="专栏不可用" :description="error">
        <button class="btn btn-secondary btn-sm" type="button" @click="load">
          重试
        </button>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'columns' }">
          返回专栏
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="!column" class="panel page-state">
      <EmptyState title="没有找到这篇专栏" description="专栏可能已下线或地址有误.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'columns' }">
          返回专栏
        </RouterLink>
      </EmptyState>
    </div>

    <template v-else>
      <header class="panel column-hero">
        <div class="hero-kicker">
          <span class="level-chip" :class="column.level">
            {{ COLUMN_LEVEL_META[column.level].label }}
          </span>
          <span v-if="column.featured" class="featured-chip">编辑精选</span>
          <span class="hero-rule" aria-hidden="true" />
          <span class="hero-kicker-note">LEARNING PATH / RESOURCES</span>
        </div>

        <h1>{{ column.title }}</h1>
        <p class="hero-summary">{{ column.summary }}</p>

        <div class="hero-tags">
          <TagChip v-for="tag in column.tags" :key="tag.slug" :tag="tag" />
        </div>

        <div class="hero-meta">
          <span class="hero-author">
            <UserAvatar :user="column.author" :size="22" />
            <span>{{ column.author.name }}</span>
          </span>
          <span>{{ column.readingMinutes }} 分钟阅读</span>
          <span>{{ column.resourceCount }} 个资源</span>
          <span>更新于 {{ formatShortDate(column.updatedAt) }}</span>
          <span v-if="column.publishedAt" class="hero-date">
            发布于 {{ formatShortDate(column.publishedAt) }}
          </span>
        </div>
      </header>

      <div class="detail-layout">
        <article class="panel body-panel" aria-labelledby="column-body-title">
          <div class="panel-header">
            <h2 id="column-body-title" class="panel-title">
              <BookOpen :size="14" aria-hidden="true" />
              正文
            </h2>
            <span class="panel-note">由社区作者创作与维护</span>
          </div>
          <div class="markdown-wrap">
            <MarkdownRenderer :source="column.body" />
          </div>
        </article>

        <aside class="column-side">
          <section class="panel resources-panel" aria-labelledby="resources-title">
            <div class="panel-header">
              <h2 id="resources-title" class="panel-title">
                <Link2 :size="14" aria-hidden="true" />
                资源清单
              </h2>
              <span class="panel-note">{{ column.resources.length }} 条</span>
            </div>

            <ol v-if="column.resources.length" class="resource-list">
              <li v-for="(resource, index) in column.resources" :key="`${resource.url}-${index}`">
                <a :href="resource.url" target="_blank" rel="noreferrer noopener">
                  <span class="resource-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="resource-copy">
                    <strong>{{ resource.title }}</strong>
                    <span class="resource-host">{{ resourceHost(resource.url) }}</span>
                    <span v-if="resource.description" class="resource-description">
                      {{ resource.description }}
                    </span>
                  </span>
                  <ExternalLink :size="12" class="resource-arrow" aria-hidden="true" />
                </a>
              </li>
            </ol>
            <p v-else class="resources-empty">这篇专栏暂时没有外部资源.</p>
          </section>

          <section class="panel author-panel" aria-labelledby="column-author-title">
            <div class="panel-header">
              <h2 id="column-author-title" class="panel-title">作者</h2>
            </div>
            <div class="author-body">
              <UserAvatar :user="column.author" :size="36" />
              <div class="author-copy">
                <strong>{{ column.author.name }}</strong>
                <span>@{{ column.author.handle }}</span>
                <p>{{ column.author.title }}</p>
              </div>
            </div>
            <RouterLink
              class="panel-link author-link"
              :to="{ name: 'user-profile', params: { handle: column.author.handle } }"
            >
              查看开发者主页
              <ArrowUpRight :size="11" />
            </RouterLink>
          </section>

          <RouterLink class="back-columns panel" :to="{ name: 'columns' }">
            <ArrowLeft :size="13" />
            <span>
              <strong>浏览更多专栏</strong>
              <span>按难度和标签查找学习路径</span>
            </span>
          </RouterLink>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ExternalLink,
  Link2,
} from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import TagChip from '@/components/common/TagChip.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import { columnApi } from '@/api/columns'
import type { ColumnDetail } from '@/api/types'
import { getErrorMessage } from '@/utils/errors'
import { COLUMN_LEVEL_META } from '@/utils/column-meta'
import { formatShortDate } from '@/utils/format'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const column = ref<ColumnDetail | null>(null)
const loading = ref(false)
const error = ref('')

let loadSequence = 0

watch(
  slug,
  () => {
    column.value = null
    error.value = ''
    if (slug.value) {
      void load()
    }
  },
  { immediate: true },
)

watch(
  column,
  (value) => {
    if (value) {
      document.title = `${value.title} - SWStack 专栏`
    }
  },
  { immediate: true },
)

async function load(): Promise<void> {
  if (!slug.value) {
    return
  }
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''

  try {
    const result = await columnApi.detail(slug.value)
    if (sequence !== loadSequence) {
      return
    }
    column.value = result
  } catch (cause) {
    if (sequence !== loadSequence) {
      return
    }
    column.value = null
    error.value = getErrorMessage(cause)
  } finally {
    if (sequence === loadSequence) {
      loading.value = false
    }
  }
}

function resourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
</script>

<style scoped>
.column-detail-page {
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

.column-hero {
  padding: 20px 22px 18px;
}

.hero-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.level-chip {
  padding: 1px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
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

.featured-chip {
  padding: 1px 6px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 9.5px;
  line-height: 1.5;
}

.hero-rule {
  width: 1px;
  height: 11px;
  margin: 0 2px;
  background: var(--border);
}

.hero-kicker-note {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.08em;
}

.column-hero h1 {
  max-width: 900px;
  margin: 10px 0 6px;
  color: var(--text);
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.65px;
  line-height: 1.28;
}

.hero-summary {
  max-width: 850px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.65;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 11px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 14px;
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  color: var(--text-faint);
  font-size: 9.5px;
}

.hero-author {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-weight: 500;
}

.hero-date {
  margin-left: auto;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
  align-items: start;
  margin-top: 14px;
}

.body-panel {
  overflow: hidden;
}

.panel-note {
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.markdown-wrap {
  padding: 18px 24px 24px;
}

.markdown-wrap :deep(.markdown-body) {
  font-size: 13.5px;
  line-height: 1.76;
}

.column-side {
  position: sticky;
  top: calc(var(--header-height) + 20px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resources-panel,
.author-panel {
  overflow: hidden;
}

.resource-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.resource-list li {
  border-bottom: 1px solid var(--border);
}

.resource-list li:last-child {
  border-bottom: 0;
}

.resource-list a {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 11px;
  color: var(--text-secondary);
}

.resource-list a:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.resource-index {
  flex: 0 0 auto;
  padding-top: 1px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.resource-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.resource-copy strong {
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.resource-host {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
}

.resource-description {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.resource-arrow {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--text-faint);
}

.resources-empty {
  margin: 0;
  padding: 18px 12px;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.6;
  text-align: center;
}

.author-body {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px;
}

.author-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.author-copy strong {
  color: var(--text);
  font-size: 11.5px;
  font-weight: 600;
}

.author-copy > span {
  color: var(--text-faint);
  font-size: 9.5px;
}

.author-copy p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.author-link {
  width: 100%;
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10px;
}

.author-link:hover {
  background: var(--surface-subtle);
  color: var(--link-hover);
}

.back-columns {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 12px;
  color: var(--text-muted);
}

.back-columns:hover {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
  color: var(--text);
}

.back-columns > svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.back-columns > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.back-columns strong {
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.back-columns span span {
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.5;
}

.page-state {
  overflow: hidden;
}

.column-loading {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero-skeleton {
  display: flex;
  padding: 22px;
  flex-direction: column;
  gap: 11px;
}

.loading-meta {
  width: 110px;
  height: 16px;
}

.loading-title {
  width: 56%;
  height: 28px;
}

.loading-line {
  width: 78%;
  height: 10px;
}

.loading-line.short {
  width: 34%;
}

.loading-line.medium {
  width: 54%;
}

.loading-body {
  display: flex;
  min-height: 280px;
  padding: 18px;
  flex-direction: column;
  gap: 11px;
}

@media (max-width: 940px) {
  .detail-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .column-side {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .back-columns {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .column-hero {
    padding: 15px 15px 14px;
  }

  .column-hero h1 {
    font-size: 22px;
    letter-spacing: -0.4px;
  }

  .hero-date {
    margin-left: 0;
  }

  .markdown-wrap {
    padding: 15px 15px 18px;
  }

  .markdown-wrap :deep(.markdown-body) {
    font-size: 13px;
  }

  .column-side {
    grid-template-columns: minmax(0, 1fr);
  }

  .back-columns {
    grid-column: auto;
  }

  .loading-title {
    width: 80%;
  }
}
</style>
