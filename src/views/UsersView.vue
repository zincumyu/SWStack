<template>
  <div class="page-container">
    <div class="content-grid">
      <main class="primary-column">
        <header class="page-heading">
          <div class="eyebrow">
            <span class="eyebrow-mark" aria-hidden="true" />
            PEOPLE
          </div>
          <h1>开发者</h1>
          <p>在这里回答问题, 分享经验, 也认识正在解决同类问题的人.</p>
        </header>

        <section class="user-directory" aria-label="开发者列表">
          <div class="directory-toolbar">
            <div class="view-tabs" role="tablist" aria-label="开发者排序">
              <button
                v-for="option in sortOptions"
                :key="option.value"
                class="view-tab"
                :class="{ active: sortBy === option.value }"
                type="button"
                role="tab"
                :aria-selected="sortBy === option.value"
                @click="sortBy = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <span class="directory-count">{{ members.length }} 位开发者</span>
          </div>

          <div v-if="userStore.membersLoading" class="member-skeletons" aria-busy="true">
            <div v-for="index in 6" :key="index" class="member-skeleton-row">
              <span class="skeleton avatar-skeleton" />
              <div class="skeleton-copy">
                <span class="skeleton name-skeleton" />
                <span class="skeleton line-skeleton" />
              </div>
            </div>
          </div>

          <div v-else-if="userStore.membersError" class="panel-inline">
            <EmptyState title="加载开发者失败" :description="userStore.membersError">
              <button class="btn btn-secondary btn-sm" type="button" @click="retry">重试</button>
            </EmptyState>
          </div>

          <div v-else-if="sortedMembers.length === 0" class="panel-inline">
            <EmptyState title="暂无开发者数据" description="稍后再来看看." />
          </div>

          <div v-else class="member-list">
            <RouterLink
              v-for="(member, index) in sortedMembers"
              :key="member.id"
              class="member-row"
              :to="{ name: 'user-profile', params: { handle: member.handle } }"
            >
              <span class="member-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <UserAvatar :user="member" :size="38" />
              <div class="member-identity">
                <div class="member-name-row">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-handle">@{{ member.handle }}</span>
                </div>
                <span class="member-title">{{ member.title }}</span>
                <span class="member-location">
                  <MapPin :size="10" />
                  {{ member.location }}
                </span>
              </div>

              <div class="member-tags">
                <span v-for="tag in member.topTags.slice(0, 3)" :key="tag.slug" class="mini-tag">
                  #{{ tag.name }}
                </span>
              </div>

              <div class="member-numbers">
                <div class="member-number">
                  <strong>{{ formatCompact(member.reputation) }}</strong>
                  <span>声望</span>
                </div>
                <div class="member-number">
                  <strong>{{ member.answerCount }}</strong>
                  <span>回答</span>
                </div>
                <div class="member-number">
                  <strong>{{ member.questionCount }}</strong>
                  <span>提问</span>
                </div>
              </div>

              <ChevronRight :size="15" class="member-arrow" />
            </RouterLink>
          </div>
        </section>
      </main>

      <aside class="sidebar-rail">
        <PopulationCard :members="members" />
        <PopularTagsCard />
        <CommunityOverviewCard />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { ChevronRight, MapPin } from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import CommunityOverviewCard from '@/components/sidebar/CommunityOverviewCard.vue'
import PopularTagsCard from '@/components/sidebar/PopularTagsCard.vue'
import PopulationCard from '@/components/sidebar/PopulationCard.vue'
import { useUserDirectoryStore } from '@/stores/users'
import { formatCompact } from '@/utils/format'

type MemberSort = 'reputation' | 'answers' | 'newest'

const userStore = useUserDirectoryStore()
const sortBy = ref<MemberSort>('reputation')

const sortOptions: Array<{ value: MemberSort; label: string }> = [
  { value: 'reputation', label: '声望' },
  { value: 'answers', label: '回答数' },
  { value: 'newest', label: '新加入' },
]

const members = computed(() => userStore.members)

const sortedMembers = computed(() => {
  const list = [...members.value]
  if (sortBy.value === 'answers') {
    return list.sort((a, b) => b.answerCount - a.answerCount)
  }
  if (sortBy.value === 'newest') {
    return list.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
  }
  return list.sort((a, b) => b.reputation - a.reputation)
})

function retry(): void {
  userStore.members = []
  void userStore.loadMembers()
}

void userStore.loadMembers()

watchEffect(() => {
  document.title = '开发者 - SWStack'
})
</script>

<style scoped>
.page-heading {
  margin-bottom: 14px;
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
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
}

.page-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
}

.user-directory {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.directory-toolbar {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
}

.view-tabs {
  display: flex;
  align-self: stretch;
}

.view-tab {
  padding: 0 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
}

.view-tab:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

.view-tab.active {
  border-bottom-color: var(--brand);
  color: var(--text);
  font-weight: 600;
}

.directory-count {
  color: var(--text-faint);
  font-size: 10.5px;
}

.member-list > .member-row + .member-row,
.member-skeletons > .member-skeleton-row + .member-skeleton-row {
  border-top: 1px solid var(--border);
}

.member-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
  color: var(--text-secondary);
  transition: background-color 120ms ease;
}

.member-row:hover {
  background: #fbfcfc;
  color: var(--text-secondary);
}

.member-rank {
  width: 17px;
  flex: 0 0 17px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.member-identity {
  display: flex;
  width: 172px;
  min-width: 0;
  flex: 0 1 172px;
  flex-direction: column;
  gap: 1px;
}

.member-name-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
}

.member-name {
  overflow: hidden;
  color: var(--link);
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-row:hover .member-name {
  color: var(--link-hover);
}

.member-handle {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-title {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-location {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.member-tags {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px;
}

.mini-tag {
  padding: 2px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
  white-space: nowrap;
}

.member-numbers {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 15px;
}

.member-number {
  display: flex;
  min-width: 35px;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.member-number strong {
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
}

.member-number span {
  color: var(--text-faint);
  font-size: 9px;
}

.member-arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
}

.panel-inline {
  border: 0;
}

.member-skeleton-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 16px;
}

.avatar-skeleton {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
}

.skeleton-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.name-skeleton {
  width: 116px;
  height: 13px;
}

.line-skeleton {
  width: 170px;
  height: 9px;
}

@media (max-width: 1000px) {
  .member-identity {
    width: 150px;
    flex-basis: 150px;
  }

  .member-numbers {
    gap: 10px;
  }

  .member-numbers .member-number:last-child {
    display: none;
  }
}

@media (max-width: 820px) {
  .member-tags {
    display: none;
  }

  .member-identity {
    flex: 1;
    width: auto;
  }
}

@media (max-width: 600px) {
  .page-heading h1 {
    font-size: 21px;
  }

  .member-rank {
    display: none;
  }

  .member-row {
    gap: 10px;
    padding: 12px;
  }

  .member-identity {
    flex-basis: 0;
  }

  .member-handle {
    display: none;
  }

  .member-numbers {
    gap: 8px;
  }

  .member-numbers .member-number:nth-child(2) {
    display: none;
  }

  .member-arrow {
    display: none;
  }

  .directory-toolbar {
    padding: 0 8px;
  }

  .view-tab {
    padding: 0 9px;
  }
}
</style>
