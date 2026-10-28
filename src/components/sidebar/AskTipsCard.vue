<template>
  <section class="tips-card" aria-labelledby="ask-tips-title">
    <div class="tips-kicker">
      <Lightbulb :size="14" aria-hidden="true" />
      提问检查清单
    </div>
    <h2 id="ask-tips-title">一个好问题值得被认真回答</h2>
    <ol class="tips-list">
      <li>
        <span class="tip-number">01</span>
        <span>写清楚运行环境, 版本和最小复现步骤</span>
      </li>
      <li>
        <span class="tip-number">02</span>
        <span>贴出真正报错的代码片段, 不要只描述现象</span>
      </li>
      <li>
        <span class="tip-number">03</span>
        <span>说明你已经尝试过什么, 以及结果是什么</span>
      </li>
    </ol>
    <RouterLink class="tips-link" to="/ask">
      去提问
      <ArrowRight :size="14" />
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, Lightbulb } from 'lucide-vue-next'
</script>

<style scoped>
.tips-card {
  padding: 15px;
  border: 1px solid var(--border);
  border-top: 3px solid var(--brand);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.tips-kicker {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
  color: var(--brand-hover);
  font-size: 10.5px;
  font-weight: 600;
}

.tips-card h2 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin: 0 0 14px;
  padding: 0;
  list-style: none;
}

.tips-list li {
  display: flex;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 11.5px;
  line-height: 1.6;
}

.tip-number {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  line-height: 1.8;
}

.tips-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--link);
  font-size: 11.5px;
  font-weight: 500;
}

.tips-link:hover {
  color: var(--link-hover);
}
</style>
