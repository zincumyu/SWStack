<template>
  <div class="page-container notifications-page">
    <header class="page-head">
      <div class="page-head-copy">
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          INBOX
        </div>
        <h1>通知</h1>
        <p>项目审核结果, 专栏权限变化, 专栏下线与新回答都会集中在这里.</p>
        <span v-if="store.unread > 0" class="head-count" role="status">
          {{ store.unread }} 条未读
        </span>
      </div>
      <div class="head-actions">
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="store.loading"
          @click="refresh"
        >
          <RefreshCw :size="13" :class="{ spinning: store.loading }" />
          {{ store.loading ? '刷新中' : '刷新' }}
        </button>
        <button
          class="btn btn-secondary btn-sm mark-all-button"
          type="button"
          :disabled="store.unread === 0 || store.loading || store.markingAll"
          @click="handleMarkAll"
        >
          <CheckCheck :size="13" />
          {{ store.markingAll ? '处理中' : '全部标为已读' }}
        </button>
      </div>
    </header>

    <section class="notifications-toolbar panel">
      <div class="filter-tabs" role="tablist" aria-label="通知筛选">
        <button
          class="filter-tab"
          :class="{ active: store.filter === 'all' }"
          type="button"
          role="tab"
          :aria-selected="store.filter === 'all'"
          @click="setFilter('all')"
        >
          全部
        </button>
        <button
          class="filter-tab"
          :class="{ active: store.filter === 'unread' }"
          type="button"
          role="tab"
          :aria-selected="store.filter === 'unread'"
          @click="setFilter('unread')"
        >
          未读
          <span v-if="store.unread > 0" class="tab-count">{{ store.unread }}</span>
        </button>
      </div>
      <span class="notification-summary">
        共 {{ store.total }} 条{{ store.filter === 'unread' ? '未读通知' : '通知' }}
      </span>
    </section>

    <div
      v-if="store.loading && store.items.length === 0"
      class="notification-loading"
      aria-busy="true"
      aria-label="通知加载中"
    >
      <div v-for="index in 3" :key="index" class="panel loading-row">
        <span class="skeleton loading-icon" />
        <div class="loading-copy">
          <span class="skeleton loading-title" />
          <span class="skeleton loading-line" />
          <span class="skeleton loading-line short" />
        </div>
      </div>
    </div>

    <div v-else-if="store.error" class="panel page-state">
      <EmptyState title="加载通知失败" :description="store.error">
        <button class="btn btn-secondary btn-sm" type="button" @click="refresh">重试</button>
      </EmptyState>
    </div>

    <div v-else-if="store.items.length === 0" class="panel page-state">
      <EmptyState
        :title="store.filter === 'unread' ? '没有未读通知' : '暂时没有通知'"
        :description="
          store.filter === 'unread'
            ? '所有通知都已处理. 新的审核结果, 权限变化与回答会出现在这里.'
            : '项目审核结果, 专栏权限变化, 专栏下线和新回答都会出现在这里.'
        "
      >
        <button
          v-if="store.filter === 'unread'"
          class="btn btn-secondary btn-sm"
          type="button"
          @click="setFilter('all')"
        >
          查看全部通知
        </button>
        <button v-else class="btn btn-secondary btn-sm" type="button" @click="refresh">刷新</button>
      </EmptyState>
    </div>

    <section
      v-else
      class="panel notification-panel"
      :class="{ refreshing: store.loading }"
      aria-label="通知列表"
    >
      <div class="notification-list">
        <RouterLink
          v-for="item in store.items"
          :key="item.id"
          class="notification-row"
          :class="{ unread: !item.read }"
          :to="item.link"
          @click="openNotification(item)"
        >
          <span class="type-icon" :class="item.type" aria-hidden="true">
            <component :is="TYPE_META[item.type].icon" :size="14" />
          </span>
          <div class="notification-copy">
            <div class="title-line">
              <span class="notification-title">{{ item.title }}</span>
              <span v-if="!item.read" class="unread-flag">未读</span>
            </div>
            <p class="notification-body">{{ item.body }}</p>
            <div class="notification-meta">
              <span class="type-label">{{ TYPE_META[item.type].label }}</span>
              <span>{{ formatRelativeTime(item.createdAt) }}</span>
              <span v-if="store.markingId === item.id">标记中</span>
            </div>
          </div>
          <ChevronRight :size="14" class="row-chevron" aria-hidden="true" />
        </RouterLink>
      </div>

      <AdminPagination
        :page="store.page"
        :total="store.total"
        :page-size="store.pageSize"
        :disabled="store.loading"
        @change="goToPage"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { Component } from 'vue'
import {
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserPlus,
  UserX,
  XCircle,
} from 'lucide-vue-next'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { NotificationFilter, NotificationItem, NotificationType } from '@/api/types'
import { useNotificationStore } from '@/stores/notifications'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime } from '@/utils/format'

const store = useNotificationStore()
const toastStore = useToastStore()

const TYPE_META: Record<NotificationType, { label: string; icon: Component }> = {
  project_approved: { label: '项目审核', icon: CheckCircle2 },
  project_rejected: { label: '项目审核', icon: XCircle },
  column_access_granted: { label: '专栏权限', icon: ShieldCheck },
  column_access_revoked: { label: '专栏权限', icon: ShieldOff },
  column_unpublished: { label: '专栏管理', icon: EyeOff },
  question_answered: { label: '问答', icon: MessageSquare },
  project_application_received: { label: '组队申请', icon: UserPlus },
  project_application_accepted: { label: '组队申请', icon: UserCheck },
  project_application_rejected: { label: '组队申请', icon: UserX },
}

function refresh(): void {
  void store.load({ page: store.page, filter: store.filter })
}

function setFilter(next: NotificationFilter): void {
  if (next === store.filter) {
    return
  }
  void store.load({ page: 1, filter: next })
}

function goToPage(next: number): void {
  const totalPages = Math.max(1, Math.ceil(store.total / store.pageSize))
  if (next < 1 || next > totalPages || next === store.page || store.loading) {
    return
  }
  void store.load({ page: next, filter: store.filter })
}

function openNotification(item: NotificationItem): void {
  if (item.read) {
    return
  }
  void store.markRead(item.id).catch(() => undefined)
}

async function handleMarkAll(): Promise<void> {
  try {
    const updated = await store.markAllRead()
    toastStore.success(updated > 0 ? `已将 ${updated} 条通知标为已读` : '没有未读通知')
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

onMounted(() => {
  void store.load({ page: 1, filter: 'all' })
})
</script>

<style scoped>
.notifications-page {
  max-width: 980px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
}

.page-head-copy {
  min-width: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--text-faint);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.eyebrow-mark {
  width: 14px;
  height: 2px;
  background: var(--brand);
}

.page-head h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.page-head p {
  max-width: 620px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.head-count {
  display: inline-block;
  margin-top: 5px;
  color: var(--brand-hover);
  font-size: 10.5px;
}

.head-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.mark-all-button:disabled {
  opacity: 0.55;
}

.notifications-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 0 10px;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}

.filter-tab {
  display: inline-flex;
  height: 34px;
  align-items: center;
  gap: 4px;
  padding: 0 9px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 11.5px;
}

.filter-tab:hover {
  color: var(--text);
}

.filter-tab.active {
  border-bottom-color: var(--brand);
  color: var(--text);
  font-weight: 600;
}

.tab-count {
  min-width: 14px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 9px;
  line-height: 14px;
  text-align: center;
}

.notification-summary {
  color: var(--text-faint);
  font-size: 10.5px;
  white-space: nowrap;
}

.notification-loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
}

.loading-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
}

.loading-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.loading-title {
  width: 168px;
  height: 10px;
}

.loading-line {
  width: 100%;
  height: 8px;
}

.loading-line.short {
  width: 42%;
}

.page-state {
  padding: 34px 18px;
}

.notification-panel {
  overflow: hidden;
}

.notification-panel.refreshing {
  opacity: 0.72;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  transition: background 120ms ease;
}

.notification-row:last-child {
  border-bottom: 0;
}

.notification-row:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.notification-row.unread {
  background: #fffaf4;
  box-shadow: inset 2px 0 0 var(--brand);
}

.notification-row.unread:hover {
  background: #fff6ec;
}

.type-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.type-icon.project_approved {
  border-color: #cfe4d7;
  background: var(--accepted-bg);
  color: var(--accepted);
}

.type-icon.project_rejected {
  border-color: #e8cfcf;
  background: #fbf1f1;
  color: var(--danger);
}

.type-icon.column_access_granted {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.type-icon.column_access_revoked {
  border-color: var(--border);
  background: var(--surface-muted);
  color: var(--text-muted);
}

.type-icon.column_unpublished {
  border-color: #eeddb6;
  background: #fdf7e8;
  color: #946200;
}

.type-icon.question_answered {
  border-color: #d3e5f2;
  background: #eaf3fa;
  color: var(--link);
}

.type-icon.project_application_received {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.type-icon.project_application_accepted {
  border-color: #cfe4d7;
  background: var(--accepted-bg);
  color: var(--accepted);
}

.type-icon.project_application_rejected {
  border-color: #e8cfcf;
  background: #fbf1f1;
  color: var(--danger);
}

.notification-copy {
  min-width: 0;
  flex: 1;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.notification-title {
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.4;
}

.unread-flag {
  padding: 0 4px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 8.5px;
  line-height: 1.5;
}

.notification-body {
  margin: 2px 0 4px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.notification-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.type-label {
  padding: 0 4px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  line-height: 1.5;
}

.row-chevron {
  flex: 0 0 auto;
  margin-top: 8px;
  color: var(--text-faint);
}

.notification-row:hover .row-chevron {
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 11px;
  }

  .head-actions {
    width: 100%;
  }

  .page-head h1 {
    font-size: 23px;
  }

  .notifications-toolbar {
    padding: 0 6px;
  }
}

@media (max-width: 520px) {
  .head-actions {
    flex-wrap: wrap;
  }

  .head-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .notification-row {
    gap: 8px;
    padding: 10px;
  }

  .notification-body {
    font-size: 10.5px;
  }

  .notification-summary {
    display: none;
  }
}
</style>
