<template>
  <div class="toast-region" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="item in toastStore.items"
        :key="item.id"
        class="toast"
        :class="`toast-${item.tone}`"
        :role="item.tone === 'error' ? 'alert' : 'status'"
      >
        <CheckCircle2 v-if="item.tone === 'success'" :size="17" />
        <AlertCircle v-else-if="item.tone === 'error'" :size="17" />
        <Info v-else :size="17" />
        <span class="toast-message">{{ item.message }}</span>
        <button class="toast-close" type="button" aria-label="关闭提示" @click="toastStore.dismiss(item.id)">
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-region {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 80;
  display: flex;
  width: min(360px, calc(100vw - 24px));
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 10px 11px 12px;
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: 4px;
  background: var(--surface);
  box-shadow: 0 6px 20px rgba(24, 30, 35, 0.12);
  color: var(--text-secondary);
  pointer-events: auto;
}

.toast-success {
  border-left-color: var(--accepted);
}

.toast-success > svg {
  color: var(--accepted);
}

.toast-error {
  border-left-color: var(--danger);
}

.toast-error > svg {
  color: var(--danger);
}

.toast-info {
  border-left-color: var(--brand);
}

.toast-info > svg {
  color: var(--brand);
}

.toast-message {
  flex: 1;
  font-size: 12.5px;
  line-height: 1.55;
}

.toast-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: 0;
  background: transparent;
  color: var(--text-faint);
}

.toast-close:hover {
  color: var(--text);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 600px) {
  .toast-region {
    right: 12px;
    bottom: 12px;
  }
}
</style>
