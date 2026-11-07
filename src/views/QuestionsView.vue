<template>
  <div class="page-container">
    <div class="content-grid">
      <main class="primary-column">
        <header class="page-heading">
          <div class="eyebrow">
            <span class="eyebrow-mark" aria-hidden="true" />
            COMMUNITY Q&A
          </div>
          <h1>所有问题</h1>
          <p>来自校园开发者的真实技术问题. 找到可以复用的思路, 也留下你的答案.</p>
        </header>

        <QuestionFeed />
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
import { watchEffect } from 'vue'
import QuestionFeed from '@/components/questions/QuestionFeed.vue'
import CommunityOverviewCard from '@/components/sidebar/CommunityOverviewCard.vue'
import PopularTagsCard from '@/components/sidebar/PopularTagsCard.vue'
import TopMembersCard from '@/components/sidebar/TopMembersCard.vue'

watchEffect(() => {
  document.title = '所有问题 - SWStack'
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

.page-heading h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.page-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.55;
}

@media (max-width: 720px) {
  .page-heading {
    margin-bottom: 12px;
  }

  .eyebrow {
    margin-bottom: 5px;
  }

  .page-heading h1 {
    font-size: 21px;
  }

  .page-heading p {
    font-size: 12px;
  }
}
</style>
