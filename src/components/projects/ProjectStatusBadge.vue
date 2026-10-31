<template>
  <span class="project-status" :class="status">
    {{ PROJECT_STATUS_META[status].label }}
  </span>
</template>

<script setup lang="ts">
import type { ProjectStatus } from '@/api/types'
import { PROJECT_STATUS_META } from '@/utils/project-meta'

defineProps<{
  status: ProjectStatus
}>()
</script>

<style scoped>
.project-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.25;
  white-space: nowrap;
}

.project-status::before {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  content: '';
}

.project-status.idea {
  border-color: #ccd9e4;
  background: #f2f7fb;
  color: #4d6f8b;
}

.project-status.building {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.project-status.beta {
  border-color: #c5d9d0;
  background: #f1f8f4;
  color: #3d6f59;
}

.project-status.launched {
  border-color: #c6ddcd;
  background: var(--accepted-bg);
  color: var(--accepted);
}

.project-status.archived {
  border-color: var(--border);
  background: var(--surface-muted);
  color: var(--text-faint);
}
</style>
