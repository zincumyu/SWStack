<template>
  <div class="page-container">
    <div class="content-grid">
      <main class="primary-column">
        <header class="page-heading">
          <div class="eyebrow">
            <span class="eyebrow-mark" aria-hidden="true" />
            TAXONOMY
          </div>
          <h1>标签</h1>
          <p>标签把问题连接到具体的技术栈. 选对标签, 问题更容易被熟悉它的人看见.</p>
        </header>

        <div class="tags-toolbar">
          <form class="tags-search" role="search" @submit.prevent>
            <Search :size="15" aria-hidden="true" />
            <input v-model="keyword" type="search" placeholder="按名称筛选标签" aria-label="按名称筛选标签" />
            <button
              v-if="keyword"
              class="search-clear"
              type="button"
              aria-label="清除筛选"
              @click="keyword = ''"
            >
              <X :size="13" />
            </button>
          </form>
          <span class="tags-total">{{ filteredTags.length }} 个标签</span>
        </div>

        <div v-if="communityStore.tagsLoading" class="tags-grid" aria-busy="true" aria-label="标签加载中">
          <div v-for="index in 6" :key="index" class="tag-card tag-skeleton-wrap">
            <span class="skeleton skeleton-title" />
            <span class="skeleton skeleton-text" />
            <span class="skeleton skeleton-meta" />
          </div>
        </div>

        <div v-else-if="communityStore.tagsError" class="panel">
          <EmptyState title="加载标签失败" :description="communityStore.tagsError">
            <button class="btn btn-secondary btn-sm" type="button" @click="communityStore.loadTags(true)">
              重试
            </button>
          </EmptyState>
        </div>

        <div v-else-if="filteredTags.length === 0" class="panel">
          <EmptyState title="没有匹配的标签" description="换一个名称再试." />
        </div>

        <div v-else class="tags-grid">
          <RouterLink
            v-for="tag in filteredTags"
            :key="tag.slug"
            class="tag-card"
            :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
          >
            <div class="tag-card-top">
              <span class="tag-card-name">{{ tag.name }}</span>
              <span class="tag-card-count">{{ formatNumber(tag.questionCount) }} 个问题</span>
            </div>
            <p>{{ tag.description }}</p>
            <div class="tag-card-meta">
              <span class="weekly">本周 +{{ tag.weeklyCount }}</span>
              <span>{{ formatCompact(tag.followerCount) }} 关注</span>
            </div>
          </RouterLink>
        </div>
      </main>

      <aside class="sidebar-rail">
        <CommunityOverviewCard />
        <TopMembersCard />
        <AskTipsCard />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { Search, X } from 'lucide-vue-next'
import AskTipsCard from '@/components/sidebar/AskTipsCard.vue'
import CommunityOverviewCard from '@/components/sidebar/CommunityOverviewCard.vue'
import TopMembersCard from '@/components/sidebar/TopMembersCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useCommunityStore } from '@/stores/community'
import { formatCompact, formatNumber } from '@/utils/format'

const communityStore = useCommunityStore()
const keyword = ref('')

const filteredTags = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) {
    return communityStore.allTags
  }
  return communityStore.allTags.filter(
    (tag) => tag.name.toLowerCase().includes(query) || tag.description.includes(query),
  )
})

void communityStore.loadTags()

watchEffect(() => {
  document.title = '标签 - SWStack'
})
</script>

<style scoped>
.page-heading {
  margin-bottom: 14px;
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

.page-heading h1 {
  margin: 0 0 4px;
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
}

.page-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.55;
}

.tags-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.tags-search {
  display: flex;
  width: 280px;
  height: 33px;
  align-items: center;
  gap: 7px;
  padding: 0 9px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-muted);
}

.tags-search:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.tags-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 12px;
}

.tags-search input::placeholder {
  color: var(--text-faint);
}

.tags-search input::-webkit-search-cancel-button {
  display: none;
}

.search-clear {
  display: inline-flex;
  padding: 1px;
  border: 0;
  background: transparent;
  color: var(--text-faint);
}

.tags-total {
  color: var(--text-muted);
  font-size: 11px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(242px, 1fr));
  gap: 10px;
}

.tag-card {
  display: flex;
  min-height: 126px;
  flex-direction: column;
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
  color: var(--text-secondary);
  transition: border-color 120ms ease;
}

.tag-card:hover {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.tag-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
}

.tag-card-name {
  display: inline-flex;
  max-width: 170px;
  overflow: hidden;
  padding: 3px 7px;
  border-radius: 3px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 12.5px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-card:hover .tag-card-name {
  background: var(--tag-hover);
}

.tag-card-count {
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.tag-card p {
  display: -webkit-box;
  margin: 0 0 10px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tag-card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f0f1f2;
  color: var(--text-faint);
  font-size: 9.5px;
}

.tag-card-meta .weekly {
  color: var(--brand-hover);
}

.tag-skeleton-wrap {
  gap: 9px;
}

.skeleton-title {
  width: 72px;
  height: 22px;
}

.skeleton-text {
  width: 96%;
  height: 10px;
}

.skeleton-meta {
  width: 60%;
  height: 8px;
  margin-top: auto;
}

@media (max-width: 1080px) {
  .tags-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 720px) {
  .page-heading h1 {
    font-size: 21px;
  }

  .tags-search {
    width: 100%;
  }

  .tags-toolbar {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .tags-total {
    order: 2;
    width: 100%;
  }

  .tags-grid {
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  }
}

@media (max-width: 480px) {
  .tags-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .tag-card {
    min-height: 116px;
  }
}
</style>
