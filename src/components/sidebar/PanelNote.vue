<template>
  <section class="panel note-card" aria-labelledby="panel-note-title">
    <div class="panel-header">
      <h2 id="panel-note-title" class="panel-title">
        <ShieldCheck :size="14" aria-hidden="true" />
        发布之前
      </h2>
    </div>
    <div class="note-body">
      <p>不要粘贴真实密钥, 令牌, 个人信息或未公开的课程资料.</p>
      <ul>
        <li>用最小可复现示例代替整段业务代码</li>
        <li>贴出完整报错, 而不只是一行结论</li>
        <li>如果需要隐私信息, 用占位符替换</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'
</script>

<style scoped>
.note-body {
  padding: 12px 14px 14px;
}

.note-body p {
  margin: 0 0 9px;
  color: var(--text-secondary);
  font-size: 11.5px;
  line-height: 1.6;
}

.note-body ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.note-body li {
  position: relative;
  padding-left: 10px;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.note-body li::before {
  position: absolute;
  top: 6px;
  left: 0;
  width: 3px;
  height: 3px;
  background: var(--brand);
  content: "";
}
</style>
