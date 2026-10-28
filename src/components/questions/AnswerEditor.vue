<template>
  <section class="answer-editor" aria-labelledby="answer-editor-title">
    <div class="editor-heading">
      <div>
        <h2 id="answer-editor-title">你的回答</h2>
        <p>用可复现的步骤和必要的代码说明你的解法.</p>
      </div>
      <span class="markdown-badge">Markdown</span>
    </div>

    <div class="editor-tabs" role="tablist" aria-label="回答编辑器">
      <button
        class="editor-tab"
        :class="{ active: mode === 'write' }"
        type="button"
        role="tab"
        :aria-selected="mode === 'write'"
        @click="mode = 'write'"
      >
        编写
      </button>
      <button
        class="editor-tab"
        :class="{ active: mode === 'preview' }"
        type="button"
        role="tab"
        :aria-selected="mode === 'preview'"
        @click="mode = 'preview'"
      >
        预览
      </button>
    </div>

    <div v-if="mode === 'write'" class="editor-input-wrap">
      <textarea
        v-model="draft"
        class="answer-textarea"
        rows="11"
        placeholder="描述你的思路, 给出关键代码. 支持 Markdown 语法."
        :disabled="submitting"
      />
    </div>
    <div v-else class="editor-preview">
      <MarkdownRenderer v-if="draft.trim()" :source="draft" />
      <p v-else class="preview-placeholder">还没有内容可以预览.</p>
    </div>

    <div class="editor-footer">
      <span class="editor-hint" :class="{ warning: charCount > 0 && charCount < 20 }">
        <template v-if="charCount === 0">至少需要 20 个字符</template>
        <template v-else-if="charCount < 20">还需要 {{ 20 - charCount }} 个字符</template>
        <template v-else>{{ charCount }} 个字符</template>
      </span>
      <button
        class="btn btn-primary"
        type="button"
        :disabled="submitting || charCount < 20"
        @click="submit"
      >
        {{ submitting ? '发布中...' : '发布回答' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'

const props = withDefaults(
  defineProps<{
    submitting?: boolean
  }>(),
  { submitting: false },
)

const emit = defineEmits<{
  submit: [body: string]
}>()

const mode = ref<'write' | 'preview'>('write')
const draft = ref('')
const charCount = computed(() => draft.value.trim().length)

function submit(): void {
  if (props.submitting || charCount.value < 20) {
    return
  }
  emit('submit', draft.value.trim())
}

function reset(): void {
  draft.value = ''
  mode.value = 'write'
}

defineExpose({ reset })
</script>

<style scoped>
.answer-editor {
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.editor-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 17px 18px 14px;
}

.editor-heading h2 {
  margin: 0 0 3px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.35;
}

.editor-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 11.5px;
}

.markdown-badge {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.editor-tabs {
  display: flex;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
}

.editor-tab {
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
}

.editor-tab.active {
  border-bottom-color: var(--brand);
  color: var(--text);
  font-weight: 600;
}

.editor-input-wrap {
  padding: 13px 18px 0;
}

.answer-textarea {
  display: block;
  width: 100%;
  min-height: 230px;
  padding: 12px 13px;
  resize: vertical;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.7;
}

.answer-textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.answer-textarea::placeholder {
  color: var(--text-faint);
  font-family: var(--font-sans);
}

.editor-preview {
  min-height: 230px;
  padding: 17px 18px;
}

.preview-placeholder {
  margin: 0;
  color: var(--text-faint);
  font-size: 12px;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 18px;
}

.editor-hint {
  color: var(--text-faint);
  font-size: 11px;
}

.editor-hint.warning {
  color: var(--brand-hover);
}

@media (max-width: 720px) {
  .editor-heading {
    padding: 14px 13px 12px;
  }

  .editor-heading p {
    display: none;
  }

  .editor-tabs {
    padding: 0 13px;
  }

  .editor-input-wrap {
    padding: 11px 13px 0;
  }

  .editor-preview {
    padding: 14px 13px;
  }

  .editor-footer {
    padding: 11px 13px;
  }

  .answer-textarea {
    min-height: 195px;
  }
}
</style>
