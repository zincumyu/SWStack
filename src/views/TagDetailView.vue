<template>
  <div class="page-container">
    <div class="content-grid">
      <main class="primary-column">
        <nav class="breadcrumb" aria-label="面包屑">
          <RouterLink to="/tags">标签</RouterLink>
          <ChevronRight :size="12" aria-hidden="true" />
          <span>{{ slug }}</span>
        </nav>

        <header class="tag-heading">
          <div class="tag-heading-main">
            <div class="tag-title-row">
              <span class="tag-symbol" aria-hidden="true">#</span>
              <h1>{{ tag?.name || slug }}</h1>
              <span class="tag-kind">标签</span>
            </div>
            <p class="tag-description">
              {{ tag?.description || '关于这个标签的问题和讨论.' }}
            </p>
          </div>

          <div v-if="tag" class="tag-heading-side">
            <button
              class="btn btn-sm tag-follow-button"
              :class="following ? 'btn-secondary' : 'btn-primary'"
              type="button"
              :disabled="!followStore.statusLoaded || followPending"
              :aria-pressed="following"
              @click="toggleFollow"
            >
              <UserCheck v-if="following" :size="13" />
              <UserPlus v-else :size="13" />
              {{ followPending ? '处理中' : following ? '已关注' : '关注标签' }}
            </button>

            <div class="tag-metrics">
              <div class="tag-metric">
                <strong>{{ formatNumber(tag.questionCount) }}</strong>
                <span>个问题</span>
              </div>
              <div class="tag-metric">
                <strong class="weekly">+{{ tag.weeklyCount }}</strong>
                <span>本周新增</span>
              </div>
              <div class="tag-metric">
                <strong>{{ formatCompact(followerCount) }}</strong>
                <span>关注者</span>
              </div>
            </div>
          </div>
        </header>

        <QuestionFeed
          :tag="slug"
          :empty-title="`${tag?.name || slug} 还没有问题`"
          empty-description="成为第一个用这个标签提问的人."
        />
      </main>

      <aside class="sidebar-rail">
        <CommunityOverviewCard />
        <PopularTagsCard />
        <TopMembersCard />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, UserCheck, UserPlus } from 'lucide-vue-next'
import QuestionFeed from '@/components/questions/QuestionFeed.vue'
import CommunityOverviewCard from '@/components/sidebar/CommunityOverviewCard.vue'
import PopularTagsCard from '@/components/sidebar/PopularTagsCard.vue'
import TopMembersCard from '@/components/sidebar/TopMembersCard.vue'
import { useCommunityStore } from '@/stores/community'
import { useFollowStore } from '@/stores/follows'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatCompact, formatNumber } from '@/utils/format'

const route = useRoute()
const communityStore = useCommunityStore()
const followStore = useFollowStore()
const toastStore = useToastStore()
const followerCount = ref(0)

const slug = computed(() => String(route.params.slug || ''))
const tag = computed(() => communityStore.allTags.find((item) => item.slug === slug.value))
const following = computed(() => followStore.isFollowingTag(slug.value))
const followPending = computed(() => followStore.isPendingTag(slug.value))

watch(
  tag,
  (value) => {
    followerCount.value = value?.followerCount ?? 0
  },
  { immediate: true },
)

async function toggleFollow(): Promise<void> {
  if (!tag.value || followPending.value || !followStore.statusLoaded) {
    return
  }
  try {
    const result = await followStore.toggleTag(slug.value)
    followerCount.value = result.followerCount
    if (result.following) {
      toastStore.success(`已关注 ${tag.value.name} 标签`)
    } else {
      toastStore.info(`已取消关注 ${tag.value.name} 标签`)
    }
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

void communityStore.loadTags()
void followStore.loadStatus()

watchEffect(() => {
  document.title = `${tag.value?.name || slug.value} - 标签 - SWStack`
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

.tag-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 15px;
}

.tag-heading-main {
  min-width: 0;
}

.tag-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-symbol {
  display: inline-flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 15px;
}

.tag-title-row h1 {
  margin: 0;
  color: var(--text);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.tag-kind {
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.tag-description {
  margin: 6px 0 0 35px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.tag-heading-side {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
}

.tag-follow-button {
  min-width: 88px;
}

.tag-metrics {
  display: flex;
  flex: 0 0 auto;
  padding-bottom: 2px;
}

.tag-metric {
  display: flex;
  min-width: 78px;
  flex-direction: column;
  gap: 1px;
  padding: 0 13px;
  border-left: 1px solid var(--border);
}

.tag-metric strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.tag-metric strong.weekly {
  color: var(--brand-hover);
}

.tag-metric span {
  color: var(--text-faint);
  font-size: 10px;
}

@media (max-width: 900px) {
  .tag-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .tag-heading-side {
    width: calc(100% - 35px);
    align-items: flex-start;
    margin-left: 35px;
  }

  .tag-metrics {
    width: 100%;
    padding-top: 9px;
    border-top: 1px solid var(--border);
  }

  .tag-metric:first-child {
    padding-left: 0;
    border-left: 0;
  }
}

@media (max-width: 560px) {
  .tag-title-row h1 {
    font-size: 21px;
  }

  .tag-description {
    margin-left: 0;
  }

  .tag-heading-side {
    width: 100%;
    margin-left: 0;
  }

  .tag-metrics {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }

  .tag-metric {
    min-width: 0;
    flex: 1;
    padding: 0 10px;
  }
}
</style>
