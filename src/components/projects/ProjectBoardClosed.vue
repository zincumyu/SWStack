<template>
  <section class="panel board-closed" aria-labelledby="board-closed-title">
    <span class="closed-icon" aria-hidden="true">
      <FolderGit2 :size="22" />
    </span>
    <div class="closed-copy">
      <div class="closed-eyebrow">PROJECT BOARD</div>
      <h2 id="board-closed-title">{{ title }}</h2>
      <p>{{ description }}</p>
      <div class="closed-actions">
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'questions' }">
          浏览问答
          <ArrowRight :size="12" />
        </RouterLink>
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'users' }">
          认识开发者
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, FolderGit2 } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '项目板块暂未开放',
    description: '管理员已暂时隐藏项目展示. 你仍然可以浏览问答, 标签与开发者目录.',
  },
)
</script>

<style scoped>
.board-closed {
  display: flex;
  max-width: 720px;
  margin: 20px auto;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 26px;
}

.closed-icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.closed-eyebrow {
  margin-bottom: 5px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
}

.closed-copy h2 {
  margin: 0 0 5px;
  color: var(--text);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.closed-copy p {
  max-width: 460px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.65;
}

.closed-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 15px;
}

@media (max-width: 560px) {
  .board-closed {
    margin-top: 12px;
    padding: 18px;
    flex-direction: column;
    gap: 12px;
  }

  .closed-actions .btn {
    flex: 1;
  }
}
</style>
