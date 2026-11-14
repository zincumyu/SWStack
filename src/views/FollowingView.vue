<template>
  <div class="page-container">
    <div class="content-grid">
      <main class="primary-column">
        <header class="page-heading">
          <div class="eyebrow">
            <span class="eyebrow-mark" aria-hidden="true" />
            FOLLOWING FEED
          </div>
          <h1>关注动态</h1>
          <p>关注开发者或标签, 把新问题, 新专栏和项目日志集中到这里.</p>
        </header>

        <QuestionFeedNav active="following" />

        <section class="feed-panel" aria-label="关注动态列表">
          <div class="feed-toolbar">
            <div class="feed-summary">
              <span>
                <strong>{{ followStore.feedTotal }}</strong>
                条动态
              </span>
              <span class="follow-counts">
                关注 {{ followStore.userHandles.length }} 位开发者,
                {{ followStore.tagSlugs.length }} 个标签
              </span>
            </div>
            <button
              class="btn btn-secondary btn-sm refresh-button"
              type="button"
              :disabled="followStore.feedLoading"
              @click="refresh"
            >
              <RefreshCw :size="13" :class="{ spinning: followStore.feedLoading }" />
              刷新
            </button>
          </div>

          <div
            v-if="followStore.feedLoading && !followStore.feedLoaded"
            class="feed-loading"
            aria-busy="true"
            aria-label="关注动态加载中"
          >
            <div v-for="index in 5" :key="index" class="loading-row">
              <span class="skeleton loading-kind" />
              <div class="loading-copy">
                <span class="skeleton loading-title" />
                <span class="skeleton loading-excerpt" />
                <div class="loading-meta">
                  <span class="skeleton loading-tag" />
                  <span class="skeleton loading-author" />
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="followStore.feedError && followStore.feedItems.length === 0"
            class="feed-state"
          >
            <EmptyState title="关注动态加载失败" :description="followStore.feedError">
              <button class="btn btn-secondary btn-sm" type="button" @click="refresh">
                重新加载
              </button>
            </EmptyState>
          </div>

          <div v-else-if="followStore.feedItems.length === 0" class="feed-empty">
            <span class="empty-icon" aria-hidden="true"><Rss :size="24" /></span>
            <h2>{{ emptyTitle }}</h2>
            <p>{{ emptyDescription }}</p>

            <div
              v-if="suggestedMembers.length > 0 || suggestedTags.length > 0"
              class="recommend-grid"
            >
              <section
                v-if="suggestedMembers.length > 0"
                class="recommend-block"
                aria-labelledby="recommend-people-title"
              >
                <h3 id="recommend-people-title">推荐开发者</h3>
                <div class="recommend-list">
                  <div v-for="member in suggestedMembers" :key="member.id" class="recommend-row">
                    <RouterLink
                      class="recommend-identity"
                      :to="{ name: 'user-profile', params: { handle: member.handle } }"
                    >
                      <UserAvatar :user="member" :size="28" />
                      <span class="recommend-copy">
                        <span class="recommend-name">{{ member.name }}</span>
                        <span class="recommend-hint">{{ member.title }}</span>
                      </span>
                    </RouterLink>
                    <button
                      class="btn btn-secondary btn-sm recommend-follow"
                      type="button"
                      :disabled="
                        !followStore.statusLoaded || followStore.isPendingUser(member.handle)
                      "
                      @click="followMember(member.handle, member.name)"
                    >
                      <UserPlus :size="12" />
                      关注
                    </button>
                  </div>
                </div>
              </section>

              <section
                v-if="suggestedTags.length > 0"
                class="recommend-block"
                aria-labelledby="recommend-tags-title"
              >
                <h3 id="recommend-tags-title">推荐标签</h3>
                <div class="recommend-list">
                  <div v-for="tag in suggestedTags" :key="tag.slug" class="recommend-row">
                    <RouterLink
                      class="recommend-tag"
                      :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
                    >
                      <span class="tag-hash">#</span>
                      <span class="recommend-copy">
                        <span class="recommend-name">{{ tag.name }}</span>
                        <span class="recommend-hint">{{ tag.questionCount }} 个问题</span>
                      </span>
                    </RouterLink>
                    <button
                      class="btn btn-secondary btn-sm recommend-follow"
                      type="button"
                      :disabled="!followStore.statusLoaded || followStore.isPendingTag(tag.slug)"
                      @click="followTag(tag.slug, tag.name)"
                    >
                      <UserPlus :size="12" />
                      关注
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div class="empty-actions">
              <RouterLink class="btn btn-secondary btn-sm" to="/users">浏览开发者</RouterLink>
              <RouterLink class="btn btn-secondary btn-sm" to="/tags">浏览标签</RouterLink>
            </div>
          </div>

          <template v-else>
            <FollowingFeedList :items="followStore.feedItems" />
            <AdminPagination
              :page="followStore.feedPage"
              :total="followStore.feedTotal"
              :page-size="followStore.feedPageSize"
              :disabled="followStore.feedLoading"
              @change="goToPage"
            />
          </template>
        </section>
      </main>

      <aside class="sidebar-rail">
        <CommunityOverviewCard />
        <TopMembersCard />
        <PopularTagsCard />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { RefreshCw, Rss, UserPlus } from 'lucide-vue-next'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import FollowingFeedList from '@/components/following/FollowingFeedList.vue'
import QuestionFeedNav from '@/components/questions/QuestionFeedNav.vue'
import CommunityOverviewCard from '@/components/sidebar/CommunityOverviewCard.vue'
import PopularTagsCard from '@/components/sidebar/PopularTagsCard.vue'
import TopMembersCard from '@/components/sidebar/TopMembersCard.vue'
import { useCommunityStore } from '@/stores/community'
import { useFollowStore } from '@/stores/follows'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'

const communityStore = useCommunityStore()
const followStore = useFollowStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()

const suggestedMembers = computed(() =>
  communityStore.topMembers
    .map((member) => member.user)
    .filter((member) => member.id !== sessionStore.user?.id)
    .filter((member) => !followStore.isFollowingUser(member.handle))
    .slice(0, 4),
)

const suggestedTags = computed(() =>
  communityStore.popularTags.filter((tag) => !followStore.isFollowingTag(tag.slug)).slice(0, 4),
)

const hasFollows = computed(
  () => followStore.userHandles.length > 0 || followStore.tagSlugs.length > 0,
)

const emptyTitle = computed(() =>
  hasFollows.value ? '关注对象暂时还没有新动态' : '先关注一些人和标签',
)

const emptyDescription = computed(() =>
  hasFollows.value
    ? '他们发布问题, 专栏或项目日志后, 会出现在这里. 也可以继续关注更多开发者.'
    : '关注后, 相关问题, 专栏和公开项目的最新开发日志会按时间汇总到这里.',
)

async function followMember(handle: string, name: string): Promise<void> {
  try {
    await followStore.toggleUser(handle)
    toastStore.success(`已关注 ${name}`)
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

async function followTag(slug: string, name: string): Promise<void> {
  try {
    await followStore.toggleTag(slug)
    toastStore.success(`已关注 ${name} 标签`)
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

function refresh(): void {
  void followStore.loadStatus()
  void followStore.loadFeed(1)
}

function goToPage(page: number): void {
  void followStore.loadFeed(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

void followStore.loadStatus()
void followStore.loadFeed(1)
void communityStore.loadOverview()

watchEffect(() => {
  document.title = '关注动态 - SWStack'
})
</script>

<style scoped>
.page-heading {
  margin: 1px 0 15px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.1em;
}

.eyebrow-mark {
  width: 5px;
  height: 5px;
  background: var(--brand);
}

.page-heading h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.page-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.55;
}

.feed-panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.feed-toolbar {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 11px 7px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
}

.feed-summary {
  display: flex;
  min-width: 0;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--text-muted);
  font-size: 11px;
}

.feed-summary strong {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.follow-counts {
  color: var(--text-faint);
  font-size: 10.5px;
}

.refresh-button {
  flex: 0 0 auto;
}

.spinning {
  animation: following-spin 0.9s linear infinite;
}

@keyframes following-spin {
  to {
    transform: rotate(360deg);
  }
}

.feed-loading {
  padding: 3px 0;
}

.loading-row {
  display: flex;
  gap: 12px;
  padding: 14px 15px;
}

.loading-row + .loading-row {
  border-top: 1px solid var(--border);
}

.loading-kind {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
}

.loading-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 7px;
}

.loading-title {
  width: 48%;
  height: 12px;
}

.loading-excerpt {
  width: 82%;
  height: 9px;
}

.loading-meta {
  display: flex;
  gap: 6px;
}

.loading-tag {
  width: 46px;
  height: 8px;
}

.loading-author {
  width: 76px;
  height: 8px;
}

.feed-state {
  padding: 24px 16px;
}

.feed-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 22px 26px;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  width: 45px;
  height: 45px;
  align-items: center;
  justify-content: center;
  margin-bottom: 9px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-faint);
}

.feed-empty h2 {
  margin: 0 0 5px;
  color: var(--text);
  font-size: 17px;
  font-weight: 600;
}

.feed-empty > p {
  max-width: 540px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.recommend-grid {
  display: grid;
  width: 100%;
  max-width: 760px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 21px;
  text-align: left;
}

.recommend-block {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
}

.recommend-block h3 {
  margin: 0;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 10.5px;
  font-weight: 600;
}

.recommend-list {
  padding: 3px 0;
}

.recommend-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 5px 8px 5px 10px;
}

.recommend-row:hover {
  background: #fbfcfc;
}

.recommend-identity,
.recommend-tag {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.recommend-identity:hover,
.recommend-tag:hover {
  color: var(--text-secondary);
}

.recommend-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.recommend-name {
  overflow: hidden;
  color: var(--text);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-hint {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-hash {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 13px;
}

.recommend-follow {
  flex: 0 0 auto;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

@media (max-width: 720px) {
  .page-heading {
    margin-bottom: 12px;
  }

  .eyebrow {
    margin-bottom: 5px;
  }

  .page-heading h1 {
    font-size: 21px;
  }

  .page-heading p {
    font-size: 12px;
  }

  .follow-counts {
    display: none;
  }
}

@media (max-width: 640px) {
  .feed-empty {
    padding: 26px 13px 22px;
  }

  .recommend-grid {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 16px;
  }

  .feed-toolbar {
    padding-right: 8px;
  }
}
</style>
