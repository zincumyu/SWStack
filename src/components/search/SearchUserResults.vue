<template>
  <div class="result-list">
    <RouterLink
      v-for="user in items"
      :key="user.id"
      class="user-row"
      :to="{ name: 'user-profile', params: { handle: user.handle } }"
    >
      <UserAvatar :user="user" :size="36" />

      <div class="user-copy">
        <div class="user-name-row">
          <span class="user-name">
            <SearchHighlight :text="user.name" :keyword="keyword" />
          </span>
          <span class="user-handle">@{{ user.handle }}</span>
          <span class="user-title">
            <SearchHighlight :text="user.title" :keyword="keyword" />
          </span>
        </div>
        <p class="user-bio">
          <SearchHighlight :text="user.bio" :keyword="keyword" />
        </p>
        <span class="user-school">
          <School :size="10" aria-hidden="true" />
          <SearchHighlight :text="user.school" :keyword="keyword" />
        </span>
      </div>

      <div class="user-numbers">
        <div>
          <strong>{{ formatCompact(user.reputation) }}</strong>
          <span>声望</span>
        </div>
        <div>
          <strong>{{ user.answerCount }}</strong>
          <span>回答</span>
        </div>
        <div>
          <strong>{{ user.questionCount }}</strong>
          <span>提问</span>
        </div>
      </div>

      <ChevronRight :size="14" class="row-arrow" aria-hidden="true" />
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, School } from 'lucide-vue-next'
import type { SearchUserResult } from '@/api/types'
import UserAvatar from '@/components/common/UserAvatar.vue'
import SearchHighlight from '@/components/search/SearchHighlight.vue'
import { formatCompact } from '@/utils/format'

withDefaults(
  defineProps<{
    items: SearchUserResult[]
    keyword?: string
  }>(),
  { keyword: '' },
)
</script>

<style scoped>
.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--text-secondary);
  transition: background-color 120ms ease;
}

.user-row + .user-row {
  border-top: 1px solid var(--border);
}

.user-row:hover {
  background: #fbfcfc;
  color: var(--text-secondary);
}

.user-copy {
  min-width: 0;
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
}

.user-name {
  overflow: hidden;
  color: var(--link);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-row:hover .user-name {
  color: var(--link-hover);
}

.user-handle {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-size: 9.5px;
}

.user-title {
  overflow: hidden;
  margin-left: 2px;
  color: var(--text-muted);
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-bio {
  display: -webkit-box;
  overflow: hidden;
  margin: 3px 0 4px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.user-school {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9.5px;
  white-space: nowrap;
}

.user-numbers {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
}

.user-numbers > div {
  display: flex;
  min-width: 34px;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.user-numbers strong {
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.user-numbers span {
  color: var(--text-faint);
  font-size: 9px;
}

.row-arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
}

@media (max-width: 720px) {
  .user-row {
    gap: 10px;
    padding: 11px 12px;
  }

  .user-numbers > div:nth-child(2),
  .user-numbers > div:nth-child(3) {
    display: none;
  }

  .user-bio {
    -webkit-line-clamp: 2;
  }

  .row-arrow {
    display: none;
  }
}

@media (max-width: 480px) {
  .user-handle,
  .user-school {
    display: none;
  }
}
</style>
