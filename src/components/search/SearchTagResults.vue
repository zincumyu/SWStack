<template>
  <div class="result-list">
    <RouterLink
      v-for="tag in items"
      :key="tag.slug"
      class="tag-row"
      :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
    >
      <span class="tag-mark" aria-hidden="true">#</span>

      <div class="tag-copy">
        <span class="tag-name">
          <SearchHighlight :text="tag.name" :keyword="keyword" />
        </span>
        <p class="tag-description">
          <SearchHighlight :text="tag.description" :keyword="keyword" />
        </p>
        <div class="tag-meta">
          <span class="weekly">本周 +{{ tag.weeklyCount }}</span>
          <span>{{ formatCompact(tag.followerCount) }} 人关注</span>
        </div>
      </div>

      <div class="tag-numbers">
        <strong>{{ formatNumber(tag.questionCount) }}</strong>
        <span>个问题</span>
      </div>

      <ArrowRight :size="14" class="row-arrow" aria-hidden="true" />
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { Tag } from '@/api/types'
import SearchHighlight from '@/components/search/SearchHighlight.vue'
import { formatCompact, formatNumber } from '@/utils/format'

withDefaults(
  defineProps<{
    items: Tag[]
    keyword?: string
  }>(),
  { keyword: '' },
)
</script>

<style scoped>
.tag-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--text-secondary);
  transition: background-color 120ms ease;
}

.tag-row + .tag-row {
  border-top: 1px solid var(--border);
}

.tag-row:hover {
  background: #fbfcfc;
  color: var(--text-secondary);
}

.tag-mark {
  display: inline-flex;
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccdce7;
  border-radius: 3px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}

.tag-copy {
  min-width: 0;
  flex: 1;
}

.tag-name {
  display: inline-flex;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.4;
}

.tag-description {
  display: -webkit-box;
  overflow: hidden;
  margin: 4px 0 4px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.tag-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.tag-meta .weekly {
  color: var(--brand-hover);
}

.tag-numbers {
  display: flex;
  width: 54px;
  flex: 0 0 54px;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.tag-numbers strong {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.tag-numbers span {
  color: var(--text-faint);
  font-size: 9px;
}

.row-arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
}

@media (max-width: 640px) {
  .tag-row {
    gap: 10px;
    padding: 11px 12px;
  }

  .tag-mark {
    width: 27px;
    height: 27px;
    flex-basis: 27px;
    font-size: 12px;
  }

  .tag-description {
    -webkit-line-clamp: 2;
  }

  .tag-meta span:last-child,
  .row-arrow {
    display: none;
  }

  .tag-numbers {
    width: 44px;
    flex-basis: 44px;
  }
}
</style>
