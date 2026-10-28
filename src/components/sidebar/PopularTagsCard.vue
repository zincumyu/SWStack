<template>
  <section class="panel tags-card" aria-labelledby="popular-tags-title">
    <div class="panel-header">
      <h2 id="popular-tags-title" class="panel-title">
        <Hash :size="14" aria-hidden="true" />
        热门标签
      </h2>
      <RouterLink class="panel-link" to="/tags">
        全部
        <ChevronRight :size="13" />
      </RouterLink>
    </div>

    <div v-if="communityStore.overviewLoading && popularTags.length === 0" class="tag-loading">
      <span v-for="index in 6" :key="index" class="skeleton tag-skeleton" />
    </div>

    <div v-else class="tag-rows">
      <RouterLink
        v-for="tag in popularTags"
        :key="tag.slug"
        class="tag-row"
        :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
      >
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-week">+{{ tag.weeklyCount }}</span>
        <span class="tag-count">{{ formatCompact(tag.questionCount) }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Hash } from 'lucide-vue-next'
import { useCommunityStore } from '@/stores/community'
import { formatCompact } from '@/utils/format'

const communityStore = useCommunityStore()
const popularTags = computed(() => communityStore.popularTags.slice(0, 6))
</script>

<style scoped>
.tag-rows {
  padding: 5px 0;
}

.tag-row {
  display: flex;
  min-height: 31px;
  align-items: center;
  gap: 6px;
  padding: 4px 13px;
  color: var(--text-secondary);
}

.tag-row:hover {
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.tag-name {
  max-width: 148px;
  overflow: hidden;
  padding: 2px 6px;
  border-radius: 2px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-row:hover .tag-name {
  background: var(--tag-hover);
}

.tag-week {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.tag-count {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
}

.tag-loading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.tag-skeleton {
  width: 100%;
  height: 23px;
}
</style>
