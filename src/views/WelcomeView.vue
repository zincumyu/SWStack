<template>
  <div class="page-container welcome-page">
    <section class="welcome-hero panel" aria-labelledby="welcome-title">
      <div class="hero-copy">
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          WELCOME TO SWSTACK
        </div>
        <h1 id="welcome-title">
          把校园里的问题,<br />
          变成可以复用的知识.
        </h1>
        <p class="hero-intro">
          SWStack 是面向高校开发者的技术问答社区. 从课程项目到实验室踩坑,
          把具体的问题讲清楚, 把有用的答案留下来.
        </p>
        <div class="hero-actions">
          <RouterLink class="btn btn-primary" :to="{ name: 'questions' }">
            浏览问题
            <ArrowRight :size="14" aria-hidden="true" />
          </RouterLink>
          <RouterLink class="btn btn-secondary" :to="joinTarget">
            {{ sessionStore.isAuthenticated ? '提出一个问题' : '登录加入' }}
          </RouterLink>
        </div>
      </div>

      <div class="hero-stats" aria-label="社区数据">
        <div v-for="stat in stats" :key="stat.label" class="hero-stat">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </div>
        <p class="hero-stats-note">
          <span class="live-dot" aria-hidden="true" />
          {{ statsNote }}
        </p>
      </div>
    </section>

    <section class="welcome-section" aria-labelledby="start-title">
      <div class="section-head">
        <div>
          <div class="eyebrow">START HERE</div>
          <h2 id="start-title">三步开始</h2>
        </div>
        <p>不需要很厉害, 先把问题讲清楚.</p>
      </div>

      <div class="step-grid">
        <RouterLink class="step-card panel" :to="{ name: 'questions' }">
          <div class="step-top">
            <span class="step-index">01</span>
            <Search :size="16" aria-hidden="true" />
          </div>
          <h3>先搜索</h3>
          <p>很多问题已经有人遇到. 先读现有讨论, 再补充新的上下文.</p>
          <span class="step-link">
            浏览问题
            <ArrowRight :size="12" aria-hidden="true" />
          </span>
        </RouterLink>

        <RouterLink class="step-card panel" :to="joinTarget">
          <div class="step-top">
            <span class="step-index">02</span>
            <PenLine :size="16" aria-hidden="true" />
          </div>
          <h3>把问题问清楚</h3>
          <p>写清环境, 报错和尝试过的方案. 好问题让答案更容易出现.</p>
          <span class="step-link">
            {{ sessionStore.isAuthenticated ? '去提问' : '登录后提问' }}
            <ArrowRight :size="12" aria-hidden="true" />
          </span>
        </RouterLink>

        <RouterLink class="step-card panel" :to="{ name: 'tags' }">
          <div class="step-top">
            <span class="step-index">03</span>
            <MessageSquare :size="16" aria-hidden="true" />
          </div>
          <h3>留下你的经验</h3>
          <p>不只贴最终代码. 说明为什么这样改, 以及边界在哪里.</p>
          <span class="step-link">
            浏览标签
            <ArrowRight :size="12" aria-hidden="true" />
          </span>
        </RouterLink>
      </div>
    </section>

    <section class="welcome-cta panel" aria-labelledby="welcome-cta-title">
      <div class="cta-copy">
        <h2 id="welcome-cta-title">从下一个问题开始.</h2>
        <p>浏览正在讨论的问题, 回答一个你踩过的坑, 或者认识正在做项目的同学.</p>
      </div>
      <div class="cta-actions">
        <RouterLink class="btn btn-primary" :to="joinTarget">
          {{ sessionStore.isAuthenticated ? '去提问' : '登录加入' }}
        </RouterLink>
        <RouterLink class="btn btn-secondary" :to="{ name: 'users' }">
          认识开发者
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { ArrowRight, MessageSquare, PenLine, Search } from 'lucide-vue-next'
import { useCommunityStore } from '@/stores/community'
import { useSessionStore } from '@/stores/session'
import { formatCompact } from '@/utils/format'

const communityStore = useCommunityStore()
const sessionStore = useSessionStore()

const joinTarget = computed<RouteLocationRaw>(() =>
  sessionStore.isAuthenticated
    ? { name: 'ask' }
    : { name: 'login', query: { redirect: '/ask' } },
)

const stats = computed(() => {
  const data = communityStore.stats
  return [
    { label: '问题', value: data ? formatCompact(data.questionCount) : '--' },
    { label: '回答', value: data ? formatCompact(data.answerCount) : '--' },
    { label: '开发者', value: data ? formatCompact(data.developerCount) : '--' },
  ]
})

const statsNote = computed(() => {
  const data = communityStore.stats
  return data ? `今日新增 ${data.todayQuestionCount} 个问题` : '校园开发者正在讨论'
})
</script>

<style scoped>
.welcome-page {
  max-width: 1088px;
  padding-top: 6px;
}

.welcome-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 248px;
  gap: 30px;
  padding: 28px 30px;
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

.hero-copy h1 {
  margin: 0 0 10px;
  color: var(--text);
  font-size: 31px;
  font-weight: 600;
  letter-spacing: -0.75px;
  line-height: 1.28;
}

.hero-intro {
  max-width: 560px;
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
}

.hero-stats {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 24px;
  border-left: 1px solid var(--border);
}

.hero-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.hero-stat:first-child {
  padding-top: 0;
}

.hero-stat:last-of-type {
  border-bottom: 0;
}

.hero-stat strong {
  color: var(--text);
  font-size: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.hero-stat span {
  color: var(--text-muted);
  font-size: 11px;
}

.hero-stats-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 6px 0 0;
  color: var(--text-faint);
  font-size: 10px;
}

.live-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: var(--accepted);
}

.welcome-section {
  margin-top: 24px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 12px;
}

.section-head h2 {
  margin: 0;
  color: var(--text);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.section-head > p {
  max-width: 360px;
  margin: 0;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.55;
  text-align: right;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.step-card {
  display: flex;
  min-height: 182px;
  flex-direction: column;
  padding: 15px 16px 14px;
  color: var(--text);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.step-card:hover {
  border-color: var(--brand-border);
  color: var(--text);
  box-shadow: 0 1px 3px rgba(18, 24, 30, 0.06);
}

.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: var(--text-faint);
}

.step-index {
  padding: 1px 5px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.5;
}

.step-card h3 {
  margin: 0 0 6px;
  color: var(--text);
  font-size: 13.5px;
  font-weight: 600;
}

.step-card p {
  margin: 0 0 14px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.65;
}

.step-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  color: var(--link);
  font-size: 11px;
}

.step-card:hover .step-link {
  color: var(--link-hover);
}

.welcome-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 14px;
  padding: 18px 20px;
}

.cta-copy h2 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.cta-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.55;
}

.cta-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

@media (max-width: 900px) {
  .welcome-hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding-top: 16px;
    padding-left: 0;
    border-top: 1px solid var(--border);
    border-left: 0;
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    padding: 0 14px;
    border-right: 1px solid var(--border);
    border-bottom: 0;
  }

  .hero-stat:first-child {
    padding-left: 0;
  }

  .hero-stat:last-of-type {
    border-right: 0;
  }

  .hero-stat strong {
    font-size: 21px;
  }

  .hero-stats-note {
    grid-column: 1 / -1;
    margin-top: 12px;
  }
}

@media (max-width: 760px) {
  .step-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .step-card {
    min-height: 0;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .section-head > p {
    max-width: none;
    text-align: left;
  }

  .welcome-cta {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .cta-actions {
    width: 100%;
  }

  .cta-actions .btn {
    flex: 1;
  }
}

@media (max-width: 560px) {
  .welcome-page {
    padding-top: 0;
  }

  .welcome-hero {
    padding: 20px 18px;
  }

  .hero-copy h1 {
    font-size: 25px;
    letter-spacing: -0.6px;
  }

  .hero-intro {
    font-size: 12.5px;
  }

  .hero-actions {
    flex-wrap: wrap;
  }

  .hero-actions .btn {
    flex: 1;
  }

  .hero-stat {
    padding: 0 9px;
  }

  .hero-stat strong {
    font-size: 19px;
  }

  .hero-stat span {
    font-size: 10px;
  }

  .hero-stats-note {
    font-size: 9.5px;
  }

  .step-card {
    padding: 14px;
  }

  .welcome-cta {
    padding: 16px;
  }

  .cta-actions {
    flex-wrap: wrap;
  }
}
</style>
