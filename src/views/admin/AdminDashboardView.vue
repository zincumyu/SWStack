<template>
  <div>
    <AdminPageHeader
      eyebrow="OVERVIEW"
      title="管理后台"
      description="查看社区运行状态, 内容规模与需要处理的治理事项."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="adminStore.overviewLoading"
          @click="refresh"
        >
          <RefreshCw :size="13" :class="{ spinning: adminStore.overviewLoading }" />
          {{ adminStore.overviewLoading ? '刷新中' : '刷新' }}
        </button>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'admin-questions' }">
          管理问题
        </RouterLink>
      </template>
    </AdminPageHeader>

    <div
      v-if="adminStore.overviewLoading && !overview"
      class="dashboard-loading"
      aria-busy="true"
      aria-label="管理总览加载中"
    >
      <div class="stat-grid">
        <div v-for="index in 5" :key="index" class="panel loading-stat">
          <span class="skeleton loading-line short" />
          <span class="skeleton loading-number" />
          <span class="skeleton loading-line" />
        </div>
      </div>
      <div class="panel dashboard-skeleton">
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line" />
      </div>
    </div>

    <div v-else-if="!overview || !stats" class="panel">
      <EmptyState
        title="管理数据加载失败"
        :description="adminStore.overviewError || '请稍后重试.'"
      >
        <button class="btn btn-secondary btn-sm" type="button" @click="refresh">重试</button>
      </EmptyState>
    </div>

    <template v-else>
      <div v-if="adminStore.overviewError" class="admin-error overview-error">
        <AlertCircle :size="14" />
        {{ adminStore.overviewError }}
      </div>

      <section class="stat-grid" aria-label="平台指标">
        <article class="stat-card panel">
          <div class="stat-head">
            <span>问题总数</span>
            <span class="stat-icon"><FileText :size="14" /></span>
          </div>
          <strong class="stat-value">{{ formatNumber(stats.questionCount) }}</strong>
          <span class="stat-meta">{{ stats.hiddenQuestionCount }} 个已隐藏</span>
        </article>
        <article class="stat-card panel">
          <div class="stat-head">
            <span>回答总数</span>
            <span class="stat-icon"><MessageSquareText :size="14" /></span>
          </div>
          <strong class="stat-value">{{ formatNumber(stats.answerCount) }}</strong>
          <span class="stat-meta">解决率 {{ stats.solvedRate }}%</span>
        </article>
        <article class="stat-card panel">
          <div class="stat-head">
            <span>开发者</span>
            <span class="stat-icon"><UsersRound :size="14" /></span>
          </div>
          <strong class="stat-value">{{ formatNumber(stats.userCount) }}</strong>
          <span class="stat-meta">{{ stats.suspendedUserCount }} 个已停用</span>
        </article>
        <article class="stat-card panel">
          <div class="stat-head">
            <span>标签</span>
            <span class="stat-icon"><Tags :size="14" /></span>
          </div>
          <strong class="stat-value">{{ formatNumber(stats.tagCount) }}</strong>
          <span class="stat-meta">{{ stats.hiddenTagCount }} 个已隐藏</span>
        </article>
        <article class="stat-card panel">
          <div class="stat-head">
            <span>项目</span>
            <span class="stat-icon"><FolderGit2 :size="14" /></span>
          </div>
          <strong class="stat-value">{{ formatNumber(stats.projectCount) }}</strong>
          <span class="stat-meta stat-project-meta">
            <span>
              {{ stats.pendingProjectCount }} 个待审核 /
              {{ stats.hiddenProjectCount }} 个已隐藏
            </span>
            <span>板块{{ stats.projectBoardEnabled ? '公开' : '已关闭' }}</span>
          </span>
        </article>
      </section>

      <section class="attention-panel panel" aria-labelledby="attention-title">
        <div class="attention-head">
          <ShieldAlert :size="16" />
          <div>
            <strong id="attention-title">治理队列</strong>
            <span>这些内容需要管理员确认</span>
          </div>
        </div>
        <div class="attention-links">
          <RouterLink
            class="attention-link"
            :to="{ name: 'admin-projects', query: { review: 'pending' } }"
          >
            <span>
              <strong>{{ stats.pendingProjectCount }}</strong>
              <span>待审核项目</span>
            </span>
            <ChevronRight :size="14" />
          </RouterLink>
          <RouterLink
            class="attention-link"
            :to="{ name: 'admin-questions', query: { status: 'hidden' } }"
          >
            <span>
              <strong>{{ stats.hiddenQuestionCount }}</strong>
              <span>已隐藏问题</span>
            </span>
            <ChevronRight :size="14" />
          </RouterLink>
          <RouterLink
            class="attention-link"
            :to="{ name: 'admin-users', query: { status: 'suspended' } }"
          >
            <span>
              <strong>{{ stats.suspendedUserCount }}</strong>
              <span>已停用账号</span>
            </span>
            <ChevronRight :size="14" />
          </RouterLink>
          <RouterLink
            class="attention-link"
            :to="{ name: 'admin-questions', query: { status: 'unanswered' } }"
          >
            <span>
              <strong>{{ stats.unansweredQuestionCount }}</strong>
              <span>未回答问题</span>
            </span>
            <ChevronRight :size="14" />
          </RouterLink>
          <RouterLink
            class="attention-link"
            :to="{ name: 'admin-projects', query: { visibility: 'hidden' } }"
          >
            <span>
              <strong>{{ stats.hiddenProjectCount }}</strong>
              <span>已隐藏项目</span>
            </span>
            <ChevronRight :size="14" />
          </RouterLink>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="panel recent-panel" aria-labelledby="recent-question-title">
          <div class="panel-header">
            <h2 id="recent-question-title" class="panel-title">
              <Activity :size="14" aria-hidden="true" />
              最近活跃问题
            </h2>
            <RouterLink class="panel-link" :to="{ name: 'admin-questions' }">全部问题</RouterLink>
          </div>
          <div v-if="recentQuestions.length === 0" class="admin-empty">暂无问题.</div>
          <RouterLink
            v-for="question in recentQuestions"
            :key="question.id"
            class="recent-question"
            :to="{ name: 'admin-questions', query: { q: String(question.id) } }"
          >
            <div class="recent-question-main">
              <div class="recent-title-row">
                <span class="admin-id">#{{ question.id }}</span>
                <span class="recent-title">{{ question.title }}</span>
                <span class="admin-badge" :class="question.status">
                  {{ question.status === 'hidden' ? '已隐藏' : '公开' }}
                </span>
              </div>
              <div class="recent-meta">
                <span>{{ question.author.name }}</span>
                <span class="meta-dot" aria-hidden="true" />
                <span>{{ question.answerCount }} 回答</span>
                <span class="meta-dot" aria-hidden="true" />
                <span>{{ question.score }} 投票</span>
              </div>
            </div>
            <span class="recent-time">{{ formatRelativeTime(question.lastActivityAt) }}</span>
          </RouterLink>
        </section>

        <section class="panel recent-panel" aria-labelledby="recent-user-title">
          <div class="panel-header">
            <h2 id="recent-user-title" class="panel-title">
              <UserPlus :size="14" aria-hidden="true" />
              新加入开发者
            </h2>
            <RouterLink class="panel-link" :to="{ name: 'admin-users' }">全部用户</RouterLink>
          </div>
          <div v-if="recentUsers.length === 0" class="admin-empty">暂无用户.</div>
          <RouterLink
            v-for="member in recentUsers"
            :key="member.id"
            class="recent-user"
            :to="{ name: 'admin-users', query: { q: member.handle } }"
          >
            <UserAvatar :user="member" :size="30" />
            <div class="recent-user-copy">
              <span class="recent-user-name">{{ member.name }}</span>
              <span>@{{ member.handle }}</span>
            </div>
            <span
              class="admin-badge"
              :class="member.role === 'admin' ? 'admin' : 'member'"
            >
              {{ member.role === 'admin' ? '管理员' : '成员' }}
            </span>
            <span class="recent-time">{{ formatShortDate(member.joinedAt) }}</span>
          </RouterLink>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Activity,
  AlertCircle,
  ChevronRight,
  FileText,
  FolderGit2,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Tags,
  UserPlus,
  UsersRound,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useAdminStore } from '@/stores/admin'
import { formatNumber, formatRelativeTime, formatShortDate } from '@/utils/format'

const adminStore = useAdminStore()

const overview = computed(() => adminStore.overview)
const stats = computed(() => adminStore.overview?.stats ?? null)
const recentQuestions = computed(() => adminStore.overview?.recentQuestions ?? [])
const recentUsers = computed(() => adminStore.overview?.recentUsers ?? [])

function refresh(): void {
  void adminStore.loadOverview(true)
}

void adminStore.loadOverview()
</script>

<style scoped>
.overview-error {
  margin-bottom: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  min-height: 100px;
  flex-direction: column;
  padding: 12px 13px;
}

.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-muted);
  font-size: 11px;
}

.stat-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-faint);
}

.stat-value {
  margin-top: 7px;
  color: var(--text);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.stat-meta {
  margin-top: auto;
  padding-top: 7px;
  color: var(--text-faint);
  font-size: 10px;
}

.stat-project-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.4;
}

.attention-panel {
  display: grid;
  grid-template-columns: 206px minmax(0, 1fr);
  overflow: hidden;
  margin-bottom: 12px;
}

.attention-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 14px;
  border-right: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--brand-hover);
}

.attention-head div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.attention-head strong {
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
}

.attention-head span {
  color: var(--text-faint);
  font-size: 9.5px;
}

.attention-links {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.attention-link {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 13px;
  color: var(--text-faint);
}

.attention-link + .attention-link {
  border-left: 1px solid var(--border);
}

.attention-link:hover {
  background: var(--surface-subtle);
  color: var(--brand-hover);
}

.attention-link > span {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.attention-link strong {
  color: var(--text);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
}

.attention-link span span {
  color: var(--text-muted);
  font-size: 10.5px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-link {
  color: var(--text-muted);
  font-size: 10.5px;
}

.panel-link:hover {
  color: var(--link-hover);
}

.recent-question {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
}

.recent-question:hover {
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.recent-question-main {
  min-width: 0;
  flex: 1;
}

.recent-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.recent-title {
  overflow: hidden;
  color: var(--link);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-question:hover .recent-title {
  color: var(--link-hover);
}

.recent-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.meta-dot {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--border-strong);
}

.recent-time {
  flex: 0 0 auto;
  padding-top: 2px;
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.recent-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
}

.recent-user:hover {
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.recent-user-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.recent-user-name {
  overflow: hidden;
  color: var(--text);
  font-size: 11.5px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-user-copy > span:last-child {
  color: var(--text-faint);
  font-size: 9.5px;
}

.loading-stat {
  display: flex;
  min-height: 100px;
  flex-direction: column;
  gap: 9px;
  padding: 13px;
}

.loading-line {
  width: 88px;
  height: 9px;
}

.loading-line.short {
  width: 56px;
}

.loading-number {
  width: 74px;
  height: 24px;
}

.dashboard-skeleton {
  display: flex;
  padding: 16px;
  flex-direction: column;
  gap: 10px;
}

.spinning {
  animation: admin-spin 0.9s linear infinite;
}

@keyframes admin-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attention-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .attention-head {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
}

@media (max-width: 820px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .stat-grid {
    gap: 8px;
  }

  .stat-card {
    min-height: 92px;
    padding: 10px;
  }

  .stat-value {
    font-size: 21px;
  }

  .attention-links {
    grid-template-columns: minmax(0, 1fr);
  }

  .attention-link + .attention-link {
    border-top: 1px solid var(--border);
    border-left: 0;
  }

  .recent-question {
    padding: 9px 11px;
  }

  .recent-user {
    padding: 9px 11px;
  }

  .recent-time {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
