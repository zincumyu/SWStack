<template>
  <div class="page-container">
    <div class="not-found panel">
      <div class="not-found-code" aria-hidden="true">404</div>
      <h1>页面未找到</h1>
      <p>这个地址可能已经失效, 或者你输入了一个不存在的路径.</p>
      <div class="not-found-actions">
        <RouterLink class="btn btn-primary" to="/">回到问题列表</RouterLink>
        <RouterLink class="btn btn-secondary" to="/tags">浏览标签</RouterLink>
      </div>
      <div class="not-found-hint">
        也可以按 <kbd>/</kbd> 搜索问题
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'

watchEffect(() => {
  document.title = '页面未找到 - SWStack'
})
</script>

<style scoped>
.not-found {
  display: flex;
  max-width: 760px;
  min-height: 380px;
  margin: 32px auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 24px;
  text-align: center;
}

.not-found-code {
  margin-bottom: 12px;
  color: var(--brand);
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -2px;
  line-height: 1;
}

.not-found h1 {
  margin: 0 0 7px;
  font-size: 24px;
  font-weight: 600;
}

.not-found p {
  margin: 0 0 20px;
  color: var(--text-muted);
  font-size: 12.5px;
}

.not-found-actions {
  display: flex;
  gap: 8px;
}

.not-found-hint {
  margin-top: 20px;
  color: var(--text-faint);
  font-size: 11px;
}

.not-found-hint kbd {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  font-family: var(--font-mono);
  font-size: 10px;
}

@media (max-width: 520px) {
  .not-found {
    margin: 12px 0;
    min-height: 330px;
    padding: 32px 18px;
  }

  .not-found-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>
