<template>
  <footer class="site-footer">
    <div class="footer-inner page-container">
      <div class="footer-brand">
        <span class="footer-mark" aria-hidden="true">SW</span>
        <div>
          <strong>SWStack</strong>
          <span>校园开发者技术社区</span>
        </div>
      </div>

      <nav class="footer-nav" aria-label="页脚导航">
        <RouterLink to="/">问答</RouterLink>
        <RouterLink v-if="projectStore.boardEnabled" to="/projects">项目</RouterLink>
        <RouterLink to="/tags">标签</RouterLink>
        <RouterLink to="/users">开发者</RouterLink>
        <RouterLink to="/welcome">新手指南</RouterLink>
        <RouterLink to="/ask">提问</RouterLink>
      </nav>

      <div class="footer-meta">
        <span>© {{ year }} SWStack</span>
        <span class="mock-badge">Mock 数据环境</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useProjectStore } from '@/stores/projects'

const year = new Date().getFullYear()
const projectStore = useProjectStore()
</script>

<style scoped>
.site-footer {
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.footer-inner {
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 16px;
  padding-bottom: 16px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 9px;
}

.footer-mark {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.footer-brand div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.footer-brand strong {
  font-size: 12.5px;
  font-weight: 650;
}

.footer-brand span {
  color: var(--text-muted);
  font-size: 11px;
}

.footer-nav {
  display: flex;
  align-items: center;
  gap: 18px;
}

.footer-nav a {
  color: var(--text-muted);
  font-size: 12px;
}

.footer-nav a:hover {
  color: var(--link-hover);
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 11px;
}

.mock-badge {
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

@media (max-width: 820px) {
  .footer-inner {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 14px 24px;
  }

  .footer-meta {
    width: 100%;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
}

@media (max-width: 520px) {
  .footer-nav {
    gap: 14px;
  }
}
</style>
