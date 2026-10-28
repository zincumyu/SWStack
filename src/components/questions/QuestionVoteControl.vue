<template>
  <div class="vote-control" aria-label="投票控件">
    <button
      class="vote-button up"
      :class="{ active: vote === 1 }"
      type="button"
      title="赞同"
      aria-label="赞同"
      :aria-pressed="vote === 1"
      :disabled="disabled"
      @click="$emit('vote', 1)"
    >
      <svg viewBox="0 0 20 18" aria-hidden="true">
        <path d="M10 2 19 16H1L10 2Z" />
      </svg>
    </button>

    <span class="vote-score" :class="{ positive: score > 0, negative: score < 0 }">
      {{ score }}
    </span>

    <button
      class="vote-button down"
      :class="{ active: vote === -1 }"
      type="button"
      title="反对"
      aria-label="反对"
      :aria-pressed="vote === -1"
      :disabled="disabled"
      @click="$emit('vote', -1)"
    >
      <svg viewBox="0 0 20 18" aria-hidden="true">
        <path d="M10 2 19 16H1L10 2Z" />
      </svg>
    </button>

    <button
      v-if="bookmarked !== undefined"
      class="bookmark-button"
      :class="{ active: bookmarked }"
      type="button"
      :title="bookmarked ? '取消收藏' : '收藏问题'"
      :aria-label="bookmarked ? '取消收藏' : '收藏问题'"
      :aria-pressed="bookmarked"
      :disabled="disabled"
      @click="$emit('bookmark')"
    >
      <Bookmark :size="17" :fill="bookmarked ? 'currentColor' : 'none'" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Bookmark } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    score: number
    vote: -1 | 0 | 1
    disabled?: boolean
    bookmarked?: boolean
  }>(),
  {
    disabled: false,
    bookmarked: undefined,
  },
)

defineEmits<{
  vote: [value: -1 | 1]
  bookmark: []
}>()
</script>

<style scoped>
.vote-control {
  display: flex;
  width: 52px;
  flex: 0 0 52px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.vote-button {
  display: inline-flex;
  width: 34px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: var(--text-faint);
}

.vote-button svg {
  width: 20px;
  height: 18px;
  fill: currentColor;
}

.vote-button.down svg {
  transform: rotate(180deg);
}

.vote-button:hover:not(:disabled) {
  border-color: var(--border);
  background: var(--surface-subtle);
  color: var(--brand);
}

.vote-button.active {
  color: var(--brand);
}

.vote-score {
  color: var(--text-secondary);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.25;
}

.vote-score.positive {
  color: var(--text);
}

.vote-score.negative {
  color: var(--text-muted);
}

.bookmark-button {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: var(--text-faint);
}

.bookmark-button:hover:not(:disabled) {
  border-color: var(--border);
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.bookmark-button.active {
  color: var(--brand);
}

@media (max-width: 720px) {
  .vote-control {
    width: 100%;
    flex-direction: row;
    gap: 3px;
  }

  .vote-button {
    width: 30px;
    height: 28px;
  }

  .vote-button svg {
    width: 17px;
    height: 15px;
  }

  .vote-score {
    min-width: 25px;
    font-size: 16px;
    text-align: center;
  }

  .bookmark-button {
    margin-top: 0;
    margin-left: auto;
  }
}
</style>
