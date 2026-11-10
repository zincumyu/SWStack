<template>
  <div class="result-list">
    <RouterLink
      v-for="column in items"
      :key="column.id"
      class="column-row"
      :to="{ name: 'column-detail', params: { slug: column.slug } }"
    >
      <div class="column-mark" :class="column.level" aria-hidden="true">
        <BookOpen :size="15" />
        <span>{{ COLUMN_LEVEL_META[column.level].label }}</span>
      </div>

      <div class="column-copy">
        <div class="column-title-row">
          <span class="column-title">
            <SearchHighlight :text="column.title" :keyword="keyword" />
          </span>
          <span v-if="column.featured" class="featured-flag">精选</span>
        </div>

        <p class="column-summary">
          <SearchHighlight :text="column.summary" :keyword="keyword" />
        </p>

        <div class="column-meta">
          <span class="column-author">
            <UserAvatar :user="column.author" :size="16" />
            <SearchHighlight :text="column.author.name" :keyword="keyword" />
          </span>
          <span v-for="tag in column.tags.slice(0, 3)" :key="tag.slug" class="column-tag">
            #<SearchHighlight :text="tag.name" :keyword="keyword" />
          </span>
          <span class="column-resources">{{ column.resourceCount }} 个资源</span>
          <span class="column-reading">{{ column.readingMinutes }} 分钟</span>
        </div>
      </div>

      <ArrowRight :size="14" class="row-arrow" aria-hidden="true" />
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, BookOpen } from 'lucide-vue-next'
import type { ColumnSummary } from '@/api/types'
import UserAvatar from '@/components/common/UserAvatar.vue'
import SearchHighlight from '@/components/search/SearchHighlight.vue'
import { COLUMN_LEVEL_META } from '@/utils/column-meta'

withDefaults(
  defineProps<{
    items: ColumnSummary[]
    keyword?: string
  }>(),
  { keyword: '' },
)
</script>

<style scoped>
.result-list :deep(*) {
  min-width: 0;
}

.column-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
  color: var(--text-secondary);
  transition: background-color 120ms ease;
}

.column-row + .column-row {
  border-top: 1px solid var(--border);
}

.column-row:hover {
  background: #fbfcfc;
  color: var(--text-secondary);
}

.column-mark {
  display: flex;
  width: 48px;
  height: 46px;
  flex: 0 0 48px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.column-mark span {
  font-size: 9px;
  line-height: 1;
}

.column-mark.beginner {
  border-color: #ccd9e4;
  background: #f2f7fb;
  color: #4d6f8b;
}

.column-mark.intermediate {
  border-color: #ead9c8;
  background: #fbf6f1;
  color: #85613f;
}

.column-mark.advanced {
  border-color: #c5d9d0;
  background: #f1f8f4;
  color: #3d6f59;
}

.column-copy {
  min-width: 0;
  flex: 1;
}

.column-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.column-title {
  overflow: hidden;
  color: var(--link);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-row:hover .column-title {
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

.column-summary {
  display: -webkit-box;
  overflow: hidden;
  margin: 3px 0 7px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.column-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 10px;
  white-space: nowrap;
}

.column-author {
  display: inline-flex;
  max-width: 135px;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  color: var(--text-muted);
}

.column-tag {
  max-width: 78px;
  overflow: hidden;
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
  text-overflow: ellipsis;
}

.column-resources {
  margin-left: auto;
}

.column-reading {
  color: var(--text-faint);
}

.row-arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
}

@media (max-width: 640px) {
  .column-row {
    align-items: flex-start;
    gap: 10px;
    padding: 11px 12px;
  }

  .column-mark {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }

  .column-mark span,
  .column-tag,
  .column-resources,
  .column-reading,
  .row-arrow {
    display: none;
  }

  .column-title {
    font-size: 13px;
    white-space: normal;
  }

  .column-summary {
    -webkit-line-clamp: 2;
  }

  .column-meta {
    font-size: 9.5px;
  }
}
</style>
