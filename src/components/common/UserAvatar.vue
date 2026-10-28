<template>
  <span
    class="user-avatar"
    :style="avatarStyle"
    :title="user.name"
    :aria-label="user.name"
    role="img"
  >
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserSummary } from '@/api/types'

const props = withDefaults(
  defineProps<{
    user: Pick<UserSummary, 'name' | 'avatarColor'>
    size?: number
  }>(),
  { size: 28 },
)

const initial = computed(() => props.user.name.slice(0, 1).toUpperCase())

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  backgroundColor: props.user.avatarColor,
  fontSize: `${Math.max(11, Math.round(props.size * 0.4))}px`,
}))
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  color: #ffffff;
  font-weight: 600;
  line-height: 1;
  user-select: none;
}
</style>
