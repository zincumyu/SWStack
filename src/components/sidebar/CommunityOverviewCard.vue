<template>
  <section class="panel overview-card" aria-labelledby="overview-title">
    <div class="panel-header">
      <h2 id="overview-title" class="panel-title">
        <Activity :size="14" aria-hidden="true" />
        社区概览
      </h2>
      <span v-if="communityStore.stats" class="online-count">
        <span class="online-dot" aria-hidden="true" />
        {{ formatNumber(communityStore.stats.onlineCount) }} 在线
      </span>
    </div>

    <div v-if="communityStore.overviewLoading && !communityStore.stats" class="overview-loading">
      <div class="skeleton skeleton-block" />
      <div class="skeleton skeleton-block" />
      <div class="skeleton skeleton-line" />
    </div>

    <div v-else-if="communityStore.overviewError && !communityStore.stats" class="overview-error">
      <p>{{ communityStore.overviewError }}</p>
      <button class="text-link" type="button" @click="communityStore.loadOverview(true)">重新加载</button>
    </div>

    <template v-else-if="communityStore.stats">
      <div class="overview-grid">
        <div class="overview-stat">
          <span class="overview-value">{{ formatCompact(communityStore.stats.questionCount) }}</span>
          <span class="overview-label">问题</span>
        </div>
        <div class="overview-stat">
          <span class="overview-value">{{ formatCompact(communityStore.stats.answerCount) }}</span>
          <span class="overview-label">回答</span>
        </div>
        <div class="overview-stat">
          <span class="overview-value">{{ formatCompact(communityStore.stats.developerCount) }}</span>
          <span class="overview-label">开发者</span>
        </div>
        <div class="overview-stat">
          <span class="overview-value">{{ communityStore.stats.todayQuestionCount }}</span>
          <span class="overview-label">今日新问题</span>
        </div>
      </div>

      <div class="solved-block">
        <div class="solved-heading">
          <span>回答解决率</span>
          <strong>{{ communityStore.stats.solvedRate }}%</strong>
        </div>
        <div class="solved-track" aria-hidden="true">
          <span :style="{ width: `${communityStore.stats.solvedRate}%` }" />
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { Activity } from 'lucide-vue-next'
import { useCommunityStore } from '@/stores/community'
import { formatCompact, formatNumber } from '@/utils/format'

const communityStore = useCommunityStore()
</script>

<style scoped>
.online-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 10.5px;
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accepted);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.overview-stat {
  display: flex;
  min-height: 69px;
  flex-direction: column;
  justify-content: center;
  padding: 10px 15px;
}

.overview-stat:nth-child(odd) {
  border-right: 1px solid var(--border);
}

.overview-stat:nth-child(-n + 2) {
  border-bottom: 1px solid var(--border);
}

.overview-value {
  color: var(--text);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.35px;
  line-height: 1.25;
}

.overview-label {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 10.5px;
}

.solved-block {
  padding: 12px 15px 14px;
  border-top: 1px solid var(--border);
}

.solved-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
  color: var(--text-muted);
  font-size: 10.5px;
}

.solved-heading strong {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.solved-track {
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--surface-muted);
}

.solved-track span {
  display: block;
  height: 100%;
  background: var(--brand);
}

.overview-loading {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
}

.skeleton-block {
  height: 55px;
}

.skeleton-line {
  width: 45%;
  height: 9px;
}

.overview-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px;
  color: var(--text-muted);
  font-size: 11.5px;
}

.overview-error p {
  margin: 0;
}
</style>
