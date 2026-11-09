<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <div v-if="sessionError" class="app-banner" role="alert">
      <AlertTriangle :size="14" aria-hidden="true" />
      <span class="app-banner-text">无法加载登录状态: {{ sessionStore.error }}</span>
      <button
        class="btn btn-secondary btn-sm"
        type="button"
        :disabled="sessionStore.loading"
        @click="retrySession"
      >
        重试
      </button>
    </div>
    <AppHeader />
    <main id="main-content" class="app-main">
      <RouterView />
    </main>
    <AppFooter />
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { useCommunityStore } from '@/stores/community'
import { useProjectStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const communityStore = useCommunityStore()
const projectStore = useProjectStore()

// 401 是正常未登录; 只有加载失败且尚未确认会话状态时才提示重试.
const sessionError = computed(() => Boolean(sessionStore.error && !sessionStore.initialized))

function retrySession(): void {
  void sessionStore.load()
}

void sessionStore.load()
void communityStore.loadOverview()
void projectStore.loadBoard()
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 24px 0 44px;
}

.skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 100;
  padding: 8px 12px;
  border-radius: 3px;
  background: var(--text);
  color: #ffffff;
  transform: translateY(-160%);
}

.skip-link:focus {
  transform: translateY(0);
  color: #ffffff;
}

.app-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
  border-bottom: 1px solid var(--brand-border);
  background: var(--brand-soft);
  color: var(--text);
  font-size: 12px;
}

.app-banner-text {
  flex: 1;
  min-width: 0;
}

@media (max-width: 720px) {
  .app-main {
    padding: 16px 0 32px;
  }
}
</style>
