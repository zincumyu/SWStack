<template>
  <div class="page-container">
    <nav class="breadcrumb" aria-label="面包屑">
      <RouterLink to="/users">开发者</RouterLink>
      <ChevronRight :size="12" aria-hidden="true" />
      <span>{{ handle }}</span>
    </nav>

    <div v-if="userStore.profileLoading" class="profile-loading">
      <div class="panel profile-skeleton">
        <div class="profile-skeleton-top">
          <span class="skeleton avatar-skeleton" />
          <div class="skeleton-lines">
            <span class="skeleton name-skeleton" />
            <span class="skeleton text-skeleton" />
            <span class="skeleton text-skeleton short" />
          </div>
        </div>
        <div class="skeleton stats-skeleton" />
      </div>
    </div>

    <div v-else-if="!profile" class="profile-error panel">
      <EmptyState
        title="没有找到这个开发者"
        :description="userStore.profileError || '检查链接是否正确, 或回到开发者列表.'"
      >
        <RouterLink class="btn btn-secondary btn-sm" to="/users">返回开发者列表</RouterLink>
      </EmptyState>
    </div>

    <div v-else class="content-grid">
      <main class="primary-column">
        <section class="profile-header panel">
          <div class="profile-main">
            <UserAvatar :user="profile" :size="66" />
            <div class="profile-copy">
              <div class="profile-name-row">
                <h1>{{ profile.name }}</h1>
                <span class="profile-handle">@{{ profile.handle }}</span>
              </div>
              <p class="profile-role">{{ profile.title }}</p>
              <p class="profile-bio">{{ profile.bio }}</p>
              <div class="profile-meta">
                <span><MapPin :size="12" />{{ profile.location }}</span>
                <span><GraduationCap :size="12" />{{ profile.school }}</span>
                <span><CalendarDays :size="12" />{{ formatShortDate(profile.joinedAt) }} 加入</span>
              </div>
            </div>
            <button
              class="btn"
              :class="following ? 'btn-secondary' : 'btn-primary'"
              type="button"
              @click="toggleFollow"
            >
              <UserCheck v-if="following" :size="14" />
              <UserPlus v-else :size="14" />
              {{ following ? '已关注' : '关注' }}
            </button>
          </div>

          <div class="profile-stats">
            <div class="profile-stat">
              <strong>{{ formatCompact(profile.reputation) }}</strong>
              <span>声望</span>
            </div>
            <div class="profile-stat">
              <strong>{{ formatNumber(profile.answerCount) }}</strong>
              <span>回答</span>
            </div>
            <div class="profile-stat">
              <strong>{{ formatNumber(profile.questionCount) }}</strong>
              <span>提问</span>
            </div>
            <div class="profile-stat">
              <strong>{{ formatCompact(profile.viewCount) }}</strong>
              <span>主页浏览</span>
            </div>
          </div>
        </section>

        <section class="panel expertise-panel" aria-labelledby="expertise-title">
          <div class="panel-header">
            <h2 id="expertise-title" class="panel-title">
              <Tags :size="14" aria-hidden="true" />
              擅长标签
            </h2>
          </div>
          <div class="expertise-tags">
            <RouterLink
              v-for="tag in profile.topTags"
              :key="tag.slug"
              class="expertise-tag"
              :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
            >
              <span class="expertise-name">{{ tag.name }}</span>
              <span class="expertise-score">{{ formatCompact(tag.questionCount) }}</span>
            </RouterLink>
          </div>
        </section>

        <section class="panel profile-questions" aria-labelledby="recent-questions-title">
          <div class="panel-header">
            <h2 id="recent-questions-title" class="panel-title">
              <MessageSquareText :size="14" aria-hidden="true" />
              最近提问
            </h2>
            <span class="question-total">{{ profile.recentQuestions.length }} 条</span>
          </div>

          <div v-if="profile.recentQuestions.length === 0" class="no-questions">
            还没有公开提问.
          </div>

          <RouterLink
            v-for="question in profile.recentQuestions"
            :key="question.id"
            class="profile-question"
            :to="{ name: 'question-detail', params: { id: question.id } }"
          >
            <div class="question-score">
              <strong>{{ question.score }}</strong>
              <span>投票</span>
            </div>
            <div class="question-copy">
              <div class="question-title-row">
                <span class="question-title">{{ question.title }}</span>
                <span v-if="question.hasAcceptedAnswer" class="accepted-label">
                  <CheckCircle2 :size="11" />
                  已解决
                </span>
              </div>
              <p>{{ question.excerpt }}</p>
              <div class="question-footer">
                <span v-for="tag in question.tags" :key="tag.slug" class="profile-tag">
                  #{{ tag.name }}
                </span>
                <span class="question-time">{{ formatRelativeTime(question.createdAt) }}</span>
              </div>
            </div>
            <span class="answer-count" :class="{ accepted: question.hasAcceptedAnswer }">
              {{ question.answerCount }} 回答
            </span>
          </RouterLink>
        </section>
      </main>

      <aside class="sidebar-rail">
        <section class="panel badges-panel" aria-labelledby="badges-title">
          <div class="panel-header">
            <h2 id="badges-title" class="panel-title">
              <Award :size="14" aria-hidden="true" />
              社区徽章
            </h2>
          </div>
          <div class="badge-list">
            <span
              v-for="badge in profile.badges"
              :key="badge.label"
              class="medal-badge"
              :class="`tone-${badge.tone}`"
            >
              <Award :size="13" />
              {{ badge.label }}
            </span>
          </div>
        </section>
        <TopMembersCard />
        <CommunityOverviewCard />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  MapPin,
  MessageSquareText,
  Tags,
  UserCheck,
  UserPlus,
} from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import TopMembersCard from '@/components/sidebar/TopMembersCard.vue'
import CommunityOverviewCard from '@/components/sidebar/CommunityOverviewCard.vue'
import { useUserDirectoryStore } from '@/stores/users'
import { useToastStore } from '@/stores/toast'
import {
  formatCompact,
  formatNumber,
  formatRelativeTime,
  formatShortDate,
} from '@/utils/format'

const route = useRoute()
const userStore = useUserDirectoryStore()
const toastStore = useToastStore()
const following = ref(false)

const handle = computed(() => String(route.params.handle || ''))
const profile = computed(() => userStore.profile)

function toggleFollow(): void {
  if (!profile.value) {
    return
  }
  following.value = !following.value
  if (following.value) {
    toastStore.success(`已关注 ${profile.value.name}`)
  } else {
    toastStore.info(`已取消关注 ${profile.value.name}`)
  }
}

watch(
  handle,
  (value) => {
    following.value = false
    void userStore.loadProfile(value)
  },
  { immediate: true },
)

watchEffect(() => {
  document.title = profile.value
    ? `${profile.value.name} - SWStack`
    : '开发者主页 - SWStack'
})
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  color: var(--text-faint);
  font-size: 11px;
}

.breadcrumb a {
  color: var(--text-muted);
}

.breadcrumb a:hover {
  color: var(--link-hover);
}

.profile-header {
  overflow: hidden;
}

.profile-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
}

.profile-copy {
  min-width: 0;
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 7px;
}

.profile-name-row h1 {
  margin: 0;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
}

.profile-handle {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10.5px;
}

.profile-role {
  margin: 2px 0 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.profile-bio {
  max-width: 580px;
  margin: 0 0 10px;
  color: var(--text-secondary);
  font-size: 12.5px;
  line-height: 1.65;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.profile-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.profile-main > .btn {
  flex: 0 0 auto;
  margin-top: 2px;
}

.profile-main > .btn :deep(svg) {
  flex: 0 0 auto;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--border);
  background: var(--surface-subtle);
}

.profile-stat {
  display: flex;
  min-height: 61px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.profile-stat + .profile-stat {
  border-left: 1px solid var(--border);
}

.profile-stat strong {
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.profile-stat span {
  color: var(--text-faint);
  font-size: 9.5px;
}

.expertise-panel {
  margin-top: 14px;
}

.expertise-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 13px;
}

.expertise-tag {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  color: var(--tag-text);
}

.expertise-tag:hover {
  border-color: var(--tag-hover);
}

.expertise-name {
  padding: 4px 8px;
  background: var(--tag-bg);
  font-size: 11.5px;
}

.expertise-score {
  padding: 0 7px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 9px;
}

.profile-questions {
  margin-top: 14px;
  overflow: hidden;
}

.question-total {
  color: var(--text-faint);
  font-size: 10px;
}

.profile-question {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  color: var(--text-secondary);
}

.profile-question:hover {
  background: #fbfcfc;
  color: var(--text-secondary);
}

.profile-question + .profile-question {
  border-top: 1px solid var(--border);
}

.question-score {
  display: flex;
  width: 41px;
  flex: 0 0 41px;
  flex-direction: column;
  align-items: center;
  padding-top: 1px;
}

.question-score strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}

.question-score span {
  color: var(--text-faint);
  font-size: 9px;
}

.question-copy {
  min-width: 0;
  flex: 1;
}

.question-title-row {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.question-title {
  color: var(--link);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.profile-question:hover .question-title {
  color: var(--link-hover);
}

.accepted-label {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  color: var(--accepted);
  font-size: 9px;
}

.question-copy p {
  display: -webkit-box;
  margin: 4px 0 7px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.question-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.profile-tag {
  padding: 1px 4px;
  border-radius: 2px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 9px;
}

.question-time {
  margin-left: auto;
  color: var(--text-faint);
  font-size: 9.5px;
}

.answer-count {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.answer-count.accepted {
  color: var(--accepted);
}

.no-questions {
  padding: 34px 16px;
  color: var(--text-faint);
  font-size: 11.5px;
  text-align: center;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 13px;
}

.medal-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 10.5px;
}

.medal-badge.tone-gold {
  border-color: #e7c988;
  background: #fffaf0;
  color: #8a5b09;
}

.medal-badge.tone-silver {
  border-color: #ced4da;
  background: #f8f9fa;
  color: #59636c;
}

.medal-badge.tone-bronze {
  border-color: #dec1a3;
  background: #fdf8f2;
  color: #83542b;
}

.profile-loading {
  max-width: 880px;
}

.profile-skeleton {
  padding: 20px;
}

.profile-skeleton-top {
  display: flex;
  gap: 16px;
}

.avatar-skeleton {
  width: 66px;
  height: 66px;
  flex: 0 0 66px;
}

.skeleton-lines {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.name-skeleton {
  width: 150px;
  height: 22px;
}

.text-skeleton {
  width: 76%;
  height: 10px;
}

.text-skeleton.short {
  width: 46%;
}

.stats-skeleton {
  height: 55px;
  margin-top: 18px;
}

.profile-error {
  max-width: 880px;
}

@media (max-width: 900px) {
  .profile-main {
    flex-wrap: wrap;
  }

  .profile-main > .btn {
    margin-left: 82px;
  }
}

@media (max-width: 640px) {
  .profile-main {
    gap: 12px;
    padding: 15px;
  }

  .profile-main :deep(.user-avatar) {
    width: 52px !important;
    height: 52px !important;
    font-size: 20px !important;
  }

  .profile-name-row h1 {
    font-size: 21px;
  }

  .profile-main > .btn {
    width: 100%;
    margin-left: 0;
    margin-top: 4px;
  }

  .profile-stat strong {
    font-size: 14px;
  }

  .profile-question {
    gap: 10px;
    padding: 12px;
  }

  .question-score {
    display: none;
  }

  .answer-count {
    display: none;
  }

  .question-time {
    margin-left: 0;
    width: 100%;
    margin-top: 2px;
  }
}
</style>
