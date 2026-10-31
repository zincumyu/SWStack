<template>
  <header class="site-header">
    <div class="header-inner page-container">
      <RouterLink class="brand" to="/" aria-label="SWStack 首页">
        <span class="brand-mark" aria-hidden="true">
          <Code2 :size="19" :stroke-width="2.2" />
        </span>
        <span class="brand-name">SWStack</span>
      </RouterLink>

      <nav class="primary-nav" aria-label="主导航">
        <RouterLink class="nav-link" :class="{ active: questionsActive }" to="/">问答</RouterLink>
        <RouterLink
          v-if="projectStore.boardEnabled"
          class="nav-link"
          :class="{ active: projectsActive }"
          to="/projects"
        >
          项目
        </RouterLink>
        <RouterLink class="nav-link" :class="{ active: tagsActive }" to="/tags">标签</RouterLink>
        <RouterLink class="nav-link" :class="{ active: usersActive }" to="/users">开发者</RouterLink>
      </nav>

      <form class="global-search" role="search" @submit.prevent="submitSearch">
        <Search :size="15" class="search-icon" aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="searchDraft"
          type="search"
          placeholder="搜索问题"
          aria-label="搜索问题"
        />
        <kbd>/</kbd>
      </form>

      <div class="header-actions">
        <button class="icon-button notification-button" type="button" aria-label="通知" @click="notify">
          <Bell :size="18" />
          <span class="notification-dot" aria-hidden="true" />
        </button>

        <RouterLink
          v-if="projectStore.boardEnabled"
          class="icon-button mobile-project-link"
          to="/projects"
          aria-label="项目展示"
          title="项目展示"
        >
          <FolderGit2 :size="18" />
        </RouterLink>

        <RouterLink class="btn btn-primary ask-button" :to="askTarget" aria-label="提问">
          <PenLine :size="15" />
          <span class="ask-label">提问</span>
        </RouterLink>

        <div v-if="sessionStore.user" ref="profileMenuRef" class="profile-menu">
          <button
            class="profile-trigger"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="profileMenuOpen"
            aria-label="账号菜单"
            @click.stop="profileMenuOpen = !profileMenuOpen"
          >
            <UserAvatar :user="sessionStore.user" :size="27" />
            <span class="profile-copy">
              <span class="profile-name">{{ sessionStore.user.name }}</span>
              <span class="profile-reputation">{{ formatCompact(sessionStore.user.reputation) }}</span>
            </span>
            <ChevronDown
              :size="13"
              class="profile-chevron"
              :class="{ rotated: profileMenuOpen }"
            />
          </button>

          <div v-if="profileMenuOpen" class="profile-dropdown" role="menu">
            <div class="profile-dropdown-head">
              <span class="dropdown-name">{{ sessionStore.user.name }}</span>
              <span class="dropdown-handle">@{{ sessionStore.user.handle }}</span>
              <span class="dropdown-role" :class="{ admin: sessionStore.isAdmin }">
                {{ sessionStore.isAdmin ? '管理员' : '社区成员' }}
              </span>
            </div>

            <RouterLink
              class="profile-menu-item"
              role="menuitem"
              :to="{ name: 'user-profile', params: { handle: sessionStore.user.handle } }"
              @click="closeProfileMenu"
            >
              <UserRound :size="14" />
              个人主页
            </RouterLink>
            <RouterLink
              class="profile-menu-item"
              role="menuitem"
              :to="{ name: 'my-projects' }"
              @click="closeProfileMenu"
            >
              <FolderGit2 :size="14" />
              我的项目
            </RouterLink>
            <RouterLink
              v-if="sessionStore.isAdmin"
              class="profile-menu-item"
              role="menuitem"
              :to="{ name: 'admin-dashboard' }"
              @click="closeProfileMenu"
            >
              <ShieldCheck :size="14" />
              管理后台
            </RouterLink>
            <div class="profile-menu-divider" role="separator" />
            <button
              class="profile-menu-item signout-button"
              type="button"
              role="menuitem"
              @click="signOut"
            >
              <LogOut :size="14" />
              退出登录
            </button>
          </div>
        </div>
        <span
          v-else-if="sessionStore.loading && !sessionStore.initialized"
          class="profile-skeleton skeleton"
          aria-hidden="true"
        />
        <RouterLink
          v-else-if="route.name !== 'login'"
          class="btn btn-secondary login-button"
          :to="loginTarget"
        >
          <LogIn :size="14" />
          <span>登录</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import {
  Bell,
  ChevronDown,
  Code2,
  FolderGit2,
  LogIn,
  LogOut,
  PenLine,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useProjectStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toast'
import { formatCompact } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const projectStore = useProjectStore()
const toastStore = useToastStore()
const searchDraft = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const profileMenuRef = ref<HTMLElement | null>(null)
const profileMenuOpen = ref(false)

const askTarget = computed<RouteLocationRaw>(() =>
  sessionStore.isAuthenticated
    ? { name: 'ask' }
    : { name: 'login', query: { redirect: '/ask' } },
)

const loginTarget = computed<RouteLocationRaw>(() => ({
  name: 'login',
  query: { redirect: route.fullPath },
}))

const questionsActive = computed(() =>
  ['questions', 'search', 'question-detail'].includes(String(route.name)),
)
const projectsActive = computed(() =>
  ['projects', 'project-detail'].includes(String(route.name)),
)
const tagsActive = computed(() => ['tags', 'tag-detail'].includes(String(route.name)))
const usersActive = computed(() => ['users', 'user-profile'].includes(String(route.name)))

watch(
  () => route.query.q,
  (value) => {
    searchDraft.value = typeof value === 'string' ? value : ''
  },
  { immediate: true },
)

function submitSearch(): void {
  const keyword = searchDraft.value.trim()
  searchInput.value?.blur()
  if (!keyword) {
    void router.push({ name: 'questions' })
    return
  }
  void router.push({ name: 'search', query: { q: keyword } })
}

function notify(): void {
  toastStore.info('暂时没有新的通知')
}

function closeProfileMenu(): void {
  profileMenuOpen.value = false
}

async function signOut(): Promise<void> {
  closeProfileMenu()
  await sessionStore.logout().catch(() => undefined)
  toastStore.info('已退出登录')
  await router.push({ name: 'questions' })
}

function handleDocumentClick(event: MouseEvent): void {
  if (!profileMenuOpen.value) {
    return
  }
  const target = event.target as Node | null
  if (target && profileMenuRef.value && !profileMenuRef.value.contains(target)) {
    closeProfileMenu()
  }
}

function handleShortcut(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeProfileMenu()
    return
  }
  const target = event.target as HTMLElement | null
  const isTyping =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  if (event.key === '/' && !isTyping) {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeProfileMenu()
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleShortcut)
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleShortcut)
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  height: var(--header-height);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(18, 24, 30, 0.03);
}

.header-inner {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 16px;
}

.brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  color: var(--text);
}

.brand:hover {
  color: var(--text);
}

.brand-mark {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--brand);
  color: #ffffff;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.45px;
}

.primary-nav {
  display: flex;
  align-self: stretch;
  align-items: stretch;
  border-left: 1px solid var(--border);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 0 13px;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 13px;
}

.nav-link:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.nav-link.active {
  border-bottom-color: var(--brand);
  color: var(--text);
  font-weight: 600;
}

.global-search {
  display: flex;
  width: 100%;
  max-width: 340px;
  min-width: 160px;
  height: 34px;
  align-items: center;
  gap: 7px;
  padding: 0 9px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
}

.global-search:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.search-icon {
  flex: 0 0 auto;
  color: var(--text-muted);
}

.global-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
}

.global-search input::placeholder {
  color: var(--text-faint);
}

.global-search input::-webkit-search-cancel-button {
  cursor: pointer;
}

.global-search kbd {
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1;
}

.header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  margin-left: auto;
}

.notification-button {
  position: relative;
}

.mobile-project-link {
  display: none;
}

.notification-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border: 1px solid var(--surface);
  border-radius: 50%;
  background: var(--brand);
}

.ask-button {
  height: 32px;
  margin-left: 2px;
  padding: 0 12px;
}

.profile-menu {
  position: relative;
}

.profile-trigger {
  display: flex;
  height: 38px;
  align-items: center;
  gap: 7px;
  margin-left: 2px;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: var(--text);
}

.profile-trigger:hover,
.profile-trigger[aria-expanded='true'] {
  border-color: var(--border);
  background: var(--surface-subtle);
  color: var(--text);
}

.profile-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.profile-name {
  max-width: 84px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-reputation {
  color: var(--text-muted);
  font-size: 10.5px;
}

.profile-chevron {
  color: var(--text-faint);
  transition: transform 120ms ease;
}

.profile-chevron.rotated {
  transform: rotate(180deg);
}

.login-button {
  height: 32px;
  padding: 0 10px;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 60;
  width: 208px;
  padding: 5px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  box-shadow: 0 7px 20px rgba(18, 24, 30, 0.12);
}

.profile-dropdown-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 3px 6px;
  margin-bottom: 4px;
  padding: 8px 9px 9px;
  border-bottom: 1px solid var(--border);
}

.dropdown-name {
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
}

.dropdown-handle {
  color: var(--text-faint);
  font-size: 10.5px;
}

.dropdown-role {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
}

.dropdown-role.admin {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.profile-menu-item {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: left;
}

.profile-menu-item:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.profile-menu-divider {
  height: 1px;
  margin: 4px 2px;
  background: var(--border);
}

.signout-button {
  color: var(--danger);
}

.signout-button:hover {
  background: #fbf1f1;
  color: var(--danger);
}

.profile-skeleton {
  width: 76px;
  height: 30px;
}

@media (max-width: 1020px) {
  .header-inner {
    gap: 10px;
  }

  .nav-link {
    padding: 0 9px;
  }

  .global-search {
    max-width: 280px;
  }

  .profile-copy,
  .profile-chevron {
    display: none;
  }
}

@media (max-width: 820px) {
  .primary-nav {
    display: none;
  }

  .mobile-project-link {
    display: inline-flex;
  }

  .global-search {
    max-width: none;
  }

  .profile-skeleton {
    width: 30px;
  }
}

@media (max-width: 640px) {
  .site-header {
    height: auto;
  }

  .header-inner {
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .brand-name {
    font-size: 16px;
  }

  .global-search {
    order: 5;
    flex-basis: 100%;
  }

  .global-search kbd,
  .notification-button {
    display: none;
  }

  .header-actions {
    gap: 5px;
  }

  .ask-button {
    width: 32px;
    padding: 0;
  }

  .ask-label {
    display: none;
  }

  .profile-trigger {
    padding: 2px;
  }
}
</style>
