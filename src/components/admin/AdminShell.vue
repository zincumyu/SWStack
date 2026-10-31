<template>
  <div class="page-container admin-shell">
    <div class="admin-layout">
      <aside class="admin-rail" aria-label="管理导航">
        <div class="admin-identity">
          <span class="admin-mark" aria-hidden="true">
            <ShieldCheck :size="17" />
          </span>
          <div class="admin-identity-copy">
            <span>CONTROL</span>
            <strong>管理后台</strong>
          </div>
        </div>

        <nav class="admin-nav">
          <RouterLink
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-dashboard' }"
            :to="{ name: 'admin-dashboard' }"
          >
            <LayoutDashboard :size="15" />
            总览
          </RouterLink>
          <RouterLink
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-questions' }"
            :to="{ name: 'admin-questions' }"
          >
            <FileText :size="15" />
            问题管理
          </RouterLink>
          <RouterLink
            class="admin-nav-link"
            :class="{
              active:
                route.name === 'admin-projects' ||
                route.name === 'admin-project-review',
            }"
            :to="{ name: 'admin-projects' }"
          >
            <FolderGit2 :size="15" />
            项目管理
          </RouterLink>
          <RouterLink
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-users' }"
            :to="{ name: 'admin-users' }"
          >
            <UsersRound :size="15" />
            用户管理
          </RouterLink>
          <RouterLink
            class="admin-nav-link"
            :class="{ active: route.name === 'admin-tags' }"
            :to="{ name: 'admin-tags' }"
          >
            <Tags :size="15" />
            标签管理
          </RouterLink>
        </nav>

        <div class="admin-rail-foot">
          <RouterLink class="back-link" to="/">
            <ArrowLeft :size="13" />
            返回社区
          </RouterLink>
          <p>操作会即时写入当前 Mock 数据.</p>
        </div>
      </aside>

      <main class="admin-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  FileText,
  FolderGit2,
  LayoutDashboard,
  ShieldCheck,
  Tags,
  UsersRound,
} from 'lucide-vue-next'

const route = useRoute()
</script>

<style scoped>
.admin-shell {
  padding-top: 6px;
}

.admin-layout {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.admin-rail {
  position: sticky;
  top: calc(var(--header-height) + 18px);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.admin-identity {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 13px;
  border-bottom: 1px solid var(--border);
}

.admin-mark {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.admin-identity-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.admin-identity-copy span {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.1em;
}

.admin-identity-copy strong {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.admin-nav {
  display: flex;
  padding: 5px;
  flex-direction: column;
  gap: 1px;
}

.admin-nav-link {
  display: flex;
  min-height: 34px;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  border-left: 2px solid transparent;
  border-radius: 2px;
  color: var(--text-secondary);
  font-size: 12.5px;
}

.admin-nav-link:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.admin-nav-link.active {
  border-left-color: var(--brand);
  background: var(--brand-soft);
  color: var(--text);
  font-weight: 600;
}

.admin-rail-foot {
  padding: 10px 13px 12px;
  border-top: 1px solid var(--border);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 11px;
}

.back-link:hover {
  color: var(--link-hover);
}

.admin-rail-foot p {
  margin: 8px 0 0;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.55;
}

.admin-main {
  min-width: 0;
}

@media (max-width: 960px) {
  .admin-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }

  .admin-rail {
    position: static;
  }

  .admin-identity {
    padding: 9px 11px;
  }

  .admin-nav {
    overflow-x: auto;
    flex-direction: row;
    padding: 4px;
  }

  .admin-nav-link {
    min-width: max-content;
    border-bottom: 2px solid transparent;
    border-left: 0;
  }

  .admin-nav-link.active {
    border-bottom-color: var(--brand);
    border-left-color: transparent;
  }

  .admin-rail-foot {
    display: none;
  }
}

@media (max-width: 560px) {
  .admin-shell {
    padding-left: 0;
    padding-right: 0;
  }

  .admin-layout {
    gap: 10px;
  }

  .admin-rail {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .admin-main {
    padding: 0 12px;
  }

  .admin-identity {
    display: none;
  }

  .admin-nav-link {
    min-height: 31px;
    padding: 0 8px;
    font-size: 11.5px;
  }
}
</style>
