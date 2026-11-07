<template>
  <div v-if="updates.length === 0" class="update-list-empty">
    {{ emptyText }}
  </div>

  <ol v-else class="update-manage-list">
    <li
      v-for="update in updates"
      :key="update.id"
      class="update-entry"
      :class="{ editing: editingId === update.id }"
    >
      <div class="entry-head">
        <div class="entry-title-row">
          <h3>{{ update.title }}</h3>
          <span v-if="editingId === update.id" class="editing-chip">编辑中</span>
        </div>
        <time :datetime="update.createdAt">
          {{ formatShortDate(update.createdAt) }}
        </time>
      </div>

      <p class="entry-body">{{ update.body }}</p>

      <div class="entry-foot">
        <div class="entry-author">
          <UserAvatar :user="update.author" :size="18" />
          <span>{{ update.author.name }}</span>
          <span>{{ formatRelativeTime(update.createdAt) }}</span>
          <span v-if="update.updatedAt" class="edited-mark">
            已编辑 {{ formatRelativeTime(update.updatedAt) }}
          </span>
        </div>

        <div v-if="allowEdit || allowDelete" class="entry-actions">
          <template v-if="confirmId === update.id">
            <span class="confirm-copy" role="status">删除后不可恢复, 确认?</span>
            <button
              class="entry-action danger"
              type="button"
              :disabled="busyId === update.id"
              @click="emit('delete', update.id)"
            >
              {{ busyId === update.id ? '删除中' : '删除' }}
            </button>
            <button
              class="entry-action"
              type="button"
              :disabled="busyId === update.id"
              @click="emit('cancelDelete')"
            >
              取消
            </button>
          </template>
          <template v-else>
            <button
              v-if="allowEdit"
              class="entry-action"
              type="button"
              :disabled="busyId !== null"
              :aria-label="`编辑日志 ${update.title}`"
              @click="emit('edit', update.id)"
            >
              <Pencil :size="11" />
              编辑
            </button>
            <button
              v-if="allowDelete"
              class="entry-action danger"
              type="button"
              :disabled="busyId !== null"
              :aria-label="`删除日志 ${update.title}`"
              @click="emit('requestDelete', update.id)"
            >
              <Trash2 :size="11" />
              删除
            </button>
          </template>
        </div>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { ProjectUpdate } from '@/api/types'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { formatRelativeTime, formatShortDate } from '@/utils/format'

withDefaults(
  defineProps<{
    updates: ProjectUpdate[]
    allowEdit?: boolean
    allowDelete?: boolean
    busyId?: number | null
    confirmId?: number | null
    editingId?: number | null
    emptyText?: string
  }>(),
  {
    allowEdit: false,
    allowDelete: false,
    busyId: null,
    confirmId: null,
    editingId: null,
    emptyText: '还没有开发日志.',
  },
)

const emit = defineEmits<{
  edit: [id: number]
  requestDelete: [id: number]
  cancelDelete: []
  delete: [id: number]
}>()
</script>

<style scoped>
.update-list-empty {
  padding: 30px 16px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.6;
  text-align: center;
}

.update-manage-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--border);
  list-style: none;
}

.update-entry {
  position: relative;
  padding: 11px 13px 12px;
  border-bottom: 1px solid var(--border);
  transition: background-color 120ms ease;
}

.update-entry:last-child {
  border-bottom: 0;
}

.update-entry.editing {
  background: var(--brand-soft);
}

.update-entry.editing::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--brand);
  content: '';
}

.entry-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.entry-title-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.entry-title-row h3 {
  margin: 0;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.editing-chip {
  flex: 0 0 auto;
  padding: 0 4px;
  border: 1px solid var(--brand-border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--brand-hover);
  font-size: 8.5px;
  line-height: 1.5;
}

.entry-head time {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.entry-body {
  margin: 5px 0 8px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.entry-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.entry-author {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 6px;
  color: var(--text-faint);
  font-size: 9px;
}

.entry-author span:first-of-type {
  color: var(--text-secondary);
  font-weight: 500;
}

.edited-mark {
  color: var(--text-faint);
  font-style: italic;
}

.entry-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.confirm-copy {
  color: var(--danger);
  font-size: 9px;
  line-height: 1.4;
}

.entry-action {
  display: inline-flex;
  min-height: 23px;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.4;
  white-space: nowrap;
}

.entry-action:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
  color: var(--text);
}

.entry-action.danger {
  color: var(--danger);
}

.entry-action.danger:hover:not(:disabled) {
  border-color: #e5c1c1;
  background: #fdf6f6;
  color: var(--danger);
}

.entry-action:disabled {
  opacity: 0.55;
}

@media (max-width: 560px) {
  .entry-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .entry-foot {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .entry-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .entry-action {
    min-height: 27px;
    padding: 3px 8px;
  }
}
</style>
