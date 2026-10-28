<template>
  <div>
    <AdminPageHeader
      eyebrow="PEOPLE"
      title="用户管理"
      description="调整社区角色与账号状态. 不能修改当前登录账号自己的权限."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="adminStore.usersLoading"
          @click="refresh"
        >
          <RefreshCw :size="13" />
          刷新
        </button>
      </template>
    </AdminPageHeader>

    <section class="panel admin-table-panel">
      <form class="admin-filter-bar" role="search" @submit.prevent="applyFilters">
        <label class="admin-search">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="searchDraft"
            type="search"
            placeholder="搜索姓名, 用户名或邮箱"
            aria-label="搜索用户"
          />
        </label>
        <select
          v-model="roleFilter"
          class="admin-select"
          aria-label="按角色筛选"
          @change="applyFilters"
        >
          <option value="all">全部角色</option>
          <option value="member">成员</option>
          <option value="admin">管理员</option>
        </select>
        <select
          v-model="statusFilter"
          class="admin-select"
          aria-label="按状态筛选"
          @change="applyFilters"
        >
          <option value="all">全部状态</option>
          <option value="active">正常</option>
          <option value="suspended">已停用</option>
        </select>
        <button class="btn btn-secondary btn-sm" type="submit">筛选</button>
        <button
          v-if="hasFilters"
          class="btn btn-ghost btn-sm"
          type="button"
          @click="clearFilters"
        >
          重置
        </button>
        <span class="admin-counter">{{ adminStore.userTotal }} 位用户</span>
      </form>

      <p
        v-if="!adminStore.usersLoading && !adminStore.usersError && adminStore.users.length"
        class="admin-table-hint"
      >
        左右滑动表格可查看完整内容.
      </p>

      <div v-if="adminStore.usersLoading" class="user-loading" aria-busy="true">
        <div v-for="index in 6" :key="index" class="user-skeleton-row">
          <span class="skeleton avatar-skeleton" />
          <div class="skeleton-copy">
            <span class="skeleton skeleton-name" />
            <span class="skeleton skeleton-line" />
          </div>
        </div>
      </div>

      <div v-else-if="adminStore.usersError" class="user-error">
        <EmptyState title="加载用户失败" :description="adminStore.usersError">
          <button class="btn btn-secondary btn-sm" type="button" @click="refresh">重试</button>
        </EmptyState>
      </div>

      <div v-else-if="adminStore.users.length === 0" class="admin-empty">
        没有符合条件的用户.
      </div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>状态</th>
              <th>社区数据</th>
              <th>加入时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in adminStore.users" :key="member.id">
              <td>
                <div class="user-cell">
                  <UserAvatar :user="member" :size="30" />
                  <div class="user-copy">
                    <div class="user-name-line">
                      <span class="user-name">{{ member.name }}</span>
                      <span v-if="member.id === currentUserId" class="self-badge">当前</span>
                    </div>
                    <span class="user-handle">@{{ member.handle }}</span>
                    <span class="user-email">{{ member.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <select
                  class="admin-select role-select"
                  :value="member.role"
                  :disabled="member.id === currentUserId || adminStore.userBusyId === member.id"
                  :aria-label="`调整 ${member.name} 的角色`"
                  :title="member.id === currentUserId ? '不能修改当前登录账号' : undefined"
                  @change="changeRole(member, $event)"
                >
                  <option value="member">成员</option>
                  <option value="admin">管理员</option>
                </select>
              </td>
              <td>
                <span class="admin-badge" :class="member.status">
                  {{ member.status === 'suspended' ? '已停用' : '正常' }}
                </span>
              </td>
              <td>
                <div class="user-stats">
                  <span><strong>{{ formatCompact(member.reputation) }}</strong> 声望</span>
                  <span><strong>{{ member.questionCount }}</strong> 提问</span>
                  <span><strong>{{ member.answerCount }}</strong> 回答</span>
                </div>
              </td>
              <td class="joined-cell">{{ formatShortDate(member.joinedAt) }}</td>
              <td>
                <div class="admin-row-actions">
                  <template v-if="pendingStatusId === member.id">
                    <span class="admin-confirm">确认停用?</span>
                    <button
                      class="admin-action danger"
                      type="button"
                      :disabled="adminStore.userBusyId === member.id"
                      @click="suspendUser(member)"
                    >
                      停用
                    </button>
                    <button class="admin-action" type="button" @click="pendingStatusId = null">
                      取消
                    </button>
                  </template>
                  <template v-else>
                    <button
                      v-if="member.status === 'active'"
                      class="admin-action danger"
                      type="button"
                      :disabled="member.id === currentUserId || adminStore.userBusyId === member.id"
                      :title="member.id === currentUserId ? '不能停用当前登录账号' : undefined"
                      @click="pendingStatusId = member.id"
                    >
                      <Ban :size="11" />
                      停用
                    </button>
                    <button
                      v-else
                      class="admin-action"
                      type="button"
                      :disabled="adminStore.userBusyId === member.id"
                      @click="restoreUser(member)"
                    >
                      <RotateCcw :size="11" />
                      恢复
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPagination
        :page="page"
        :total="adminStore.userTotal"
        :page-size="pageSize"
        :disabled="adminStore.usersLoading"
        @change="goToPage"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Ban, RefreshCw, RotateCcw, Search } from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import type { AccountStatus, AdminUser, UserRole } from '@/api/types'
import { useAdminStore } from '@/stores/admin'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatCompact, formatShortDate } from '@/utils/format'

const route = useRoute()
const adminStore = useAdminStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

const pageSize = 10
const page = ref(1)
const searchDraft = ref(typeof route.query.q === 'string' ? route.query.q : '')
const roleFilter = ref<'all' | UserRole>(readRole(route.query.role))
const statusFilter = ref<'all' | AccountStatus>(readStatus(route.query.status))
const pendingStatusId = ref<number | null>(null)

const currentUserId = computed(() => sessionStore.user?.id ?? null)
const hasFilters = computed(
  () =>
    Boolean(searchDraft.value.trim()) ||
    roleFilter.value !== 'all' ||
    statusFilter.value !== 'all',
)

function readRole(value: unknown): 'all' | UserRole {
  return value === 'admin' || value === 'member' ? value : 'all'
}

function readStatus(value: unknown): 'all' | AccountStatus {
  return value === 'active' || value === 'suspended' ? value : 'all'
}

function load(): void {
  pendingStatusId.value = null
  void adminStore.loadUsers({
    page: page.value,
    pageSize,
    q: searchDraft.value.trim() || undefined,
    role: roleFilter.value,
    status: statusFilter.value,
  })
}

function applyFilters(): void {
  page.value = 1
  load()
}

function clearFilters(): void {
  searchDraft.value = ''
  roleFilter.value = 'all'
  statusFilter.value = 'all'
  page.value = 1
  load()
}

function refresh(): void {
  load()
}

function goToPage(next: number): void {
  const totalPages = Math.max(1, Math.ceil(adminStore.userTotal / pageSize))
  if (next < 1 || next > totalPages || next === page.value) {
    return
  }
  page.value = next
  load()
}

function ensurePageAfterMutation(): void {
  if (adminStore.users.length === 0 && adminStore.userTotal > 0 && page.value > 1) {
    page.value -= 1
    load()
  }
}

async function changeRole(member: AdminUser, event: Event): Promise<void> {
  const select = event.target as HTMLSelectElement
  const nextRole = select.value as UserRole
  if (nextRole === member.role) {
    return
  }

  try {
    const updated = await adminStore.updateUser(member.id, { role: nextRole })
    toastStore.success(
      updated.role === 'admin' ? `${member.name} 已设为管理员` : `${member.name} 已设为成员`,
    )
    ensurePageAfterMutation()
  } catch (cause) {
    select.value = member.role
    toastStore.error(getErrorMessage(cause))
  }
}

async function suspendUser(member: AdminUser): Promise<void> {
  try {
    await adminStore.updateUser(member.id, { status: 'suspended' })
    pendingStatusId.value = null
    toastStore.success(`${member.name} 的账号已停用`)
    ensurePageAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function restoreUser(member: AdminUser): Promise<void> {
  try {
    await adminStore.updateUser(member.id, { status: 'active' })
    toastStore.success(`${member.name} 的账号已恢复`)
    ensurePageAfterMutation()
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

void load()
</script>

<style scoped>
.admin-table-panel {
  overflow: hidden;
}

.user-cell {
  display: flex;
  min-width: 210px;
  align-items: center;
  gap: 8px;
}

.user-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.user-name-line {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-name {
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
}

.self-badge {
  padding: 0 4px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 8.5px;
}

.user-handle {
  color: var(--text-faint);
  font-size: 9.5px;
}

.user-email {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.role-select {
  min-height: 28px;
  height: 28px;
  padding: 1px 23px 1px 6px;
  font-size: 10.5px;
}

.role-select:disabled {
  background: var(--surface-subtle);
  color: var(--text-faint);
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.user-stats strong {
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 500;
}

.joined-cell {
  color: var(--text-faint);
  font-size: 10px;
  white-space: nowrap;
}

.user-loading {
  padding: 4px 0;
}

.user-skeleton-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
}

.user-skeleton-row:last-child {
  border-bottom: 0;
}

.avatar-skeleton {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
}

.skeleton-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.skeleton-name {
  width: 108px;
  height: 11px;
}

.skeleton-line {
  width: 162px;
  height: 8px;
}

.user-error {
  border-bottom: 0;
}

@media (max-width: 820px) {
  .admin-filter-bar {
    row-gap: 6px;
  }

  .admin-search {
    max-width: none;
    flex-basis: 100%;
  }

  .admin-counter {
    margin-left: auto;
  }
}
</style>
