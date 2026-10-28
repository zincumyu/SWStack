<template>
  <div class="page-container">
    <div class="content-grid">
      <main class="primary-column">
        <header class="page-heading">
          <div class="eyebrow">
            <span class="eyebrow-mark" aria-hidden="true" />
            COMMUNITY Q&A
          </div>
          <div class="heading-row">
            <div>
              <h1 v-if="isSearch">搜索 {{ keyword }}</h1>
              <h1 v-else>所有问题</h1>
              <p v-if="isSearch">在当前搜索结果中继续筛选, 或调整关键词重新查找.</p>
              <p v-else>来自校园开发者的真实技术问题. 找到可以复用的思路, 也留下你的答案.</p>
            </div>
            <button v-if="isSearch" class="btn btn-secondary clear-search" type="button" @click="clearSearch">
              <X :size="14" />
              清除搜索
            </button>
          </div>
        </header>

        <QuestionFeed :keyword="keyword" />
      </main>

      <aside class="sidebar-rail">
        <CommunityOverviewCard />
        <PopularTagsCard />
        <TopMembersCard />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import QuestionFeed from '@/components/questions/QuestionFeed.vue'
import CommunityOverviewCard from '@/components/sidebar/CommunityOverviewCard.vue'
import PopularTagsCard from '@/components/sidebar/PopularTagsCard.vue'
import TopMembersCard from '@/components/sidebar/TopMembersCard.vue'

const route = useRoute()
const router = useRouter()

const keyword = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
const isSearch = computed(() => route.name === 'search' && Boolean(keyword.value))

function clearSearch(): void {
  void router.push({ name: 'questions' })
}

watchEffect(() => {
  document.title = isSearch.value
    ? `搜索 ${keyword.value} - SWStack`
    : '所有问题 - SWStack'
})
</script>

<style scoped>
.page-heading {
  margin: 1px 0 15px;
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

.heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.heading-row h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.heading-row p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.55;
}

.clear-search {
  flex: 0 0 auto;
  margin-top: 4px;
  height: 30px;
  font-size: 11.5px;
}

@media (max-width: 720px) {
  .page-heading {
    margin-bottom: 12px;
  }

  .eyebrow {
    margin-bottom: 5px;
  }

  .heading-row h1 {
    font-size: 21px;
  }

  .heading-row p {
    font-size: 12px;
  }

  .heading-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }
}
</style>
