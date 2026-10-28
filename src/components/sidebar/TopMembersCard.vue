<template>
  <section class="panel members-card" aria-labelledby="top-members-title">
    <div class="panel-header">
      <h2 id="top-members-title" class="panel-title">
        <Award :size="14" aria-hidden="true" />
        本周之星
      </h2>
      <RouterLink class="panel-link" to="/users">
        榜单
        <ChevronRight :size="13" />
      </RouterLink>
    </div>

    <div v-if="communityStore.overviewLoading && topMembers.length === 0" class="member-loading">
      <span v-for="index in 5" :key="index" class="skeleton member-skeleton" />
    </div>

    <div v-else class="member-rows">
      <RouterLink
        v-for="(member, index) in topMembers"
        :key="member.user.id"
        class="member-row"
        :to="{ name: 'user-profile', params: { handle: member.user.handle } }"
      >
        <span class="rank" :class="{ first: index === 0 }">{{ String(index + 1).padStart(2, '0') }}</span>
        <UserAvatar :user="member.user" :size="25" />
        <span class="member-copy">
          <span class="member-name">{{ member.user.name }}</span>
          <span class="member-tag">#{{ member.topTag }}</span>
        </span>
        <span class="member-score">{{ member.weeklyScore }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Award, ChevronRight } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useCommunityStore } from '@/stores/community'

const communityStore = useCommunityStore()
const topMembers = computed(() => communityStore.topMembers.slice(0, 5))
</script>

<style scoped>
.member-rows {
  padding: 5px 0;
}

.member-row {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  padding: 5px 13px;
  color: var(--text-secondary);
}

.member-row:hover {
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.rank {
  width: 17px;
  flex: 0 0 17px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.rank.first {
  color: var(--brand-hover);
  font-weight: 600;
}

.member-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.member-name {
  overflow: hidden;
  color: var(--text);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-tag {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-score {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
}

.member-loading {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
}

.member-skeleton {
  height: 27px;
}
</style>
