<template>
  <section class="panel population-card" aria-labelledby="population-title">
    <div class="panel-header">
      <h2 id="population-title" class="panel-title">
        <UserPlus :size="14" aria-hidden="true" />
        新加入
      </h2>
      <span class="member-total">{{ members.length }} 位档案</span>
    </div>

    <div v-if="members.length === 0" class="population-loading">
      <span v-for="index in 4" :key="index" class="skeleton population-skeleton" />
    </div>

    <div v-else class="newcomer-rows">
      <RouterLink
        v-for="member in newcomers"
        :key="member.id"
        class="newcomer-row"
        :to="{ name: 'user-profile', params: { handle: member.handle } }"
      >
        <UserAvatar :user="member" :size="27" />
        <span class="newcomer-copy">
          <span class="newcomer-name">{{ member.name }}</span>
          <span class="newcomer-title">{{ member.title }}</span>
        </span>
        <span class="joined-date">{{ formatJoinDate(member.joinedAt) }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserPlus } from 'lucide-vue-next'
import type { UserProfile } from '@/api/types'
import UserAvatar from '@/components/common/UserAvatar.vue'

const props = defineProps<{
  members: UserProfile[]
}>()

const newcomers = computed(() =>
  [...props.members]
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
    .slice(0, 4),
)

function formatJoinDate(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
}
</script>

<style scoped>
.member-total {
  color: var(--text-faint);
  font-size: 10px;
}

.newcomer-rows {
  padding: 4px 0;
}

.newcomer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px;
  color: var(--text-secondary);
}

.newcomer-row:hover {
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.newcomer-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.newcomer-name {
  color: var(--text);
  font-size: 11.5px;
}

.newcomer-title {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.joined-date {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.population-loading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.population-skeleton {
  height: 28px;
}
</style>
