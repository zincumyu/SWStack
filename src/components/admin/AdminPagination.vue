<template>
  <div v-if="total > 0" class="admin-pagination">
    <span class="pagination-summary">
      第 {{ startItem }}-{{ endItem }} 条, 共 {{ total }} 条
    </span>
    <div class="pagination-controls">
      <button
        class="pagination-button"
        type="button"
        :disabled="disabled || page <= 1"
        aria-label="上一页"
        @click="$emit('change', page - 1)"
      >
        <ChevronLeft :size="13" />
      </button>
      <span class="pagination-page">{{ page }} / {{ totalPages }}</span>
      <button
        class="pagination-button"
        type="button"
        :disabled="disabled || page >= totalPages"
        aria-label="下一页"
        @click="$emit('change', page + 1)"
      >
        <ChevronRight :size="13" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    page: number
    total: number
    pageSize: number
    disabled?: boolean
  }>(),
  { disabled: false },
)

defineEmits<{
  change: [page: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const startItem = computed(() =>
  props.total === 0 ? 0 : Math.min((props.page - 1) * props.pageSize + 1, props.total),
)
const endItem = computed(() => Math.min(props.page * props.pageSize, props.total))
</script>

<style scoped>
.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 11px;
  border-top: 1px solid var(--border);
  color: var(--text-faint);
  font-size: 10.5px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 7px;
}

.pagination-button {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
}

.pagination-button:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
  color: var(--text);
}

.pagination-button:disabled {
  opacity: 0.4;
}

.pagination-page {
  min-width: 42px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  text-align: center;
}

@media (max-width: 560px) {
  .pagination-summary {
    display: none;
  }

  .admin-pagination {
    justify-content: flex-end;
  }
}
</style>
