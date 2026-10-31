<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <AppHeader />
    <main id="main-content" class="app-main">
      <RouterView />
    </main>
    <AppFooter />
    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { useCommunityStore } from '@/stores/community'
import { useProjectStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const communityStore = useCommunityStore()
const projectStore = useProjectStore()

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

@media (max-width: 720px) {
  .app-main {
    padding: 16px 0 32px;
  }
}
</style>
