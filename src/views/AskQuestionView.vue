<template>
  <div class="page-container">
    <div class="content-grid">
      <main class="primary-column">
        <header class="page-heading">
          <div class="eyebrow">
            <span class="eyebrow-mark" aria-hidden="true" />
            ASK THE COMMUNITY
          </div>
          <h1>提问</h1>
          <p>提供上下文, 复现步骤和已经尝试过的方案. 问题越具体, 回答越有用.</p>
        </header>

        <form class="ask-form panel" novalidate @submit.prevent="submit">
          <div class="form-panel-head">
            <div>
              <h2>问题详情</h2>
              <p>发布前请确认没有包含密钥, 个人信息或未公开的课程代码.</p>
            </div>
            <span class="required-note"><span aria-hidden="true">*</span> 必填</span>
          </div>

          <div class="field-group">
            <label class="field-label" for="question-title">
              标题
              <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <p class="field-hint">像向同学描述问题一样写标题, 说明目标和当前障碍.</p>
            <input
              id="question-title"
              v-model="title"
              class="text-field"
              type="text"
              maxlength="150"
              placeholder="例如: Vue 3 的 watch 在路由切换后仍会触发, 如何定位原因"
              :aria-invalid="Boolean(errors.title)"
              aria-describedby="title-error"
            />
            <div class="field-footer">
              <span v-if="errors.title" id="title-error" class="field-error">{{ errors.title }}</span>
              <span v-else class="field-counter">8-150 个字符</span>
              <span class="field-counter">{{ title.length }}/150</span>
            </div>
          </div>

          <div class="field-group">
            <div class="label-row">
              <div>
                <label class="field-label" for="question-body">
                  问题描述
                  <span class="required-mark" aria-hidden="true">*</span>
                </label>
                <p class="field-hint">包含环境版本, 关键代码, 报错信息和复现步骤. 支持 Markdown.</p>
              </div>
              <div class="editor-mode" role="tablist" aria-label="问题描述编辑模式">
                <button
                  class="mode-button"
                  :class="{ active: mode === 'write' }"
                  type="button"
                  role="tab"
                  :aria-selected="mode === 'write'"
                  @click="mode = 'write'"
                >
                  编写
                </button>
                <button
                  class="mode-button"
                  :class="{ active: mode === 'preview' }"
                  type="button"
                  role="tab"
                  :aria-selected="mode === 'preview'"
                  @click="mode = 'preview'"
                >
                  预览
                </button>
              </div>
            </div>

            <div v-if="mode === 'write'" class="body-editor">
              <textarea
                id="question-body"
                v-model="body"
                class="body-textarea"
                rows="14"
                placeholder="描述你的问题..."
                :aria-invalid="Boolean(errors.body)"
                aria-describedby="body-error"
              />
            </div>
            <div v-else class="body-preview">
              <MarkdownRenderer v-if="body.trim()" :source="body" />
              <p v-else class="preview-empty">还没有内容可以预览.</p>
            </div>

            <div class="field-footer">
              <span v-if="errors.body" id="body-error" class="field-error">{{ errors.body }}</span>
              <span v-else class="field-counter">至少 20 个字符</span>
              <span class="field-counter">{{ body.length }} 个字符</span>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="tag-input">
              标签
              <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <p class="field-hint">最多添加 5 个标签. 输入后按 Enter 添加.</p>

            <div class="tag-editor" :class="{ invalid: Boolean(errors.tags) }">
              <span v-for="slug in selectedTags" :key="slug" class="selected-tag">
                {{ tagName(slug) }}
                <button
                  class="remove-tag"
                  type="button"
                  :aria-label="`移除标签 ${tagName(slug)}`"
                  @click="removeTag(slug)"
                >
                  <X :size="11" />
                </button>
              </span>
              <input
                id="tag-input"
                v-model="tagDraft"
                class="tag-input"
                type="text"
                placeholder="添加标签"
                :disabled="selectedTags.length >= 5"
                @keydown="handleTagKeydown"
              />
            </div>
            <p v-if="errors.tags" class="field-error tag-error">{{ errors.tags }}</p>

            <div v-if="selectedTags.length < 5 && suggestedTags.length" class="tag-suggestions">
              <span class="suggestions-label">可用标签</span>
              <button
                v-for="tag in suggestedTags"
                :key="tag.slug"
                class="suggestion-chip"
                type="button"
                @click="addTag(tag.name)"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>

          <div v-if="submitError" class="submit-error" role="alert">
            <AlertCircle :size="15" />
            {{ submitError }}
          </div>

          <div class="form-actions">
            <RouterLink class="btn btn-ghost" to="/">取消</RouterLink>
            <button class="btn btn-primary publish-button" type="submit" :disabled="submitting">
              <Send :size="14" />
              {{ submitting ? '发布中...' : '发布问题' }}
            </button>
          </div>
        </form>
      </main>

      <aside class="sidebar-rail">
        <AskTipsCard />
        <PopularTagsCard />
        <PanelNote />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, Send, X } from 'lucide-vue-next'
import AskTipsCard from '@/components/sidebar/AskTipsCard.vue'
import PopularTagsCard from '@/components/sidebar/PopularTagsCard.vue'
import PanelNote from '@/components/sidebar/PanelNote.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import { questionApi } from '@/api/questions'
import { useCommunityStore } from '@/stores/community'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'

const router = useRouter()
const communityStore = useCommunityStore()
const toastStore = useToastStore()

const title = ref('')
const body = ref('')
const tagDraft = ref('')
const selectedTags = ref<string[]>([])
const mode = ref<'write' | 'preview'>('write')
const submitting = ref(false)
const submitError = ref('')
const errors = reactive({
  title: '',
  body: '',
  tags: '',
})

const suggestedTags = computed(() => {
  const query = tagDraft.value.trim().toLowerCase()
  return communityStore.allTags
    .filter((tag) => !selectedTags.value.includes(tag.slug))
    .filter((tag) => !query || tag.name.toLowerCase().includes(query))
    .slice(0, 8)
})

function tagName(slug: string): string {
  return communityStore.allTags.find((tag) => tag.slug === slug)?.name ?? slug
}

function addTag(raw: string): void {
  const value = raw.trim().toLowerCase().replace(/\s+/g, '-')
  if (!value) {
    return
  }
  if (selectedTags.value.length >= 5) {
    errors.tags = '最多添加 5 个标签'
    return
  }
  const found = communityStore.allTags.find(
    (tag) => tag.slug === value || tag.name.toLowerCase() === value,
  )
  if (!found) {
    errors.tags = '请从可用标签中选择, 或检查标签拼写'
    return
  }
  if (selectedTags.value.includes(found.slug)) {
    tagDraft.value = ''
    return
  }
  selectedTags.value.push(found.slug)
  tagDraft.value = ''
  errors.tags = ''
}

function removeTag(slug: string): void {
  selectedTags.value = selectedTags.value.filter((item) => item !== slug)
  errors.tags = ''
}

function handleTagKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag(tagDraft.value)
    return
  }
  if (event.key === 'Backspace' && !tagDraft.value && selectedTags.value.length > 0) {
    removeTag(selectedTags.value[selectedTags.value.length - 1])
  }
}

function validate(): boolean {
  errors.title = ''
  errors.body = ''
  errors.tags = ''
  submitError.value = ''

  if (title.value.trim().length < 8) {
    errors.title = '标题至少需要 8 个字符'
  } else if (title.value.trim().length > 150) {
    errors.title = '标题不能超过 150 个字符'
  }
  if (body.value.trim().length < 20) {
    errors.body = '问题描述至少需要 20 个字符'
  }
  if (selectedTags.value.length === 0) {
    errors.tags = '请至少添加一个标签'
  }
  return !errors.title && !errors.body && !errors.tags
}

async function submit(): Promise<void> {
  if (submitting.value || !validate()) {
    return
  }

  submitting.value = true
  submitError.value = ''
  try {
    const created = await questionApi.create({
      title: title.value.trim(),
      body: body.value.trim(),
      tags: selectedTags.value,
    })
    toastStore.success('问题已发布')
    await router.push({ name: 'question-detail', params: { id: created.id } })
  } catch (cause) {
    submitError.value = getErrorMessage(cause)
  } finally {
    submitting.value = false
  }
}

void communityStore.loadTags()

watchEffect(() => {
  document.title = '提问 - SWStack'
})
</script>

<style scoped>
.page-heading {
  margin-bottom: 14px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.1em;
}

.eyebrow-mark {
  width: 5px;
  height: 5px;
  background: var(--brand);
}

.page-heading h1 {
  margin: 0 0 4px;
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.25;
}

.page-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12.5px;
}

.ask-form {
  overflow: hidden;
}

.form-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.form-panel-head h2 {
  margin: 0 0 3px;
  font-size: 15px;
  font-weight: 600;
}

.form-panel-head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 11px;
}

.required-note {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-size: 10.5px;
}

.required-note span,
.required-mark {
  color: var(--brand-hover);
}

.field-group {
  padding: 17px 18px;
  border-bottom: 1px solid var(--border);
}

.field-label {
  display: block;
  margin-bottom: 2px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.field-hint {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.55;
}

.text-field {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
}

.text-field:focus,
.body-textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.text-field::placeholder,
.body-textarea::placeholder {
  color: var(--text-faint);
}

.field-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 18px;
  margin-top: 5px;
  color: var(--text-faint);
  font-size: 10px;
}

.field-counter:first-child {
  margin-right: auto;
}

.field-error {
  color: var(--danger);
  font-size: 10.5px;
}

.label-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.editor-mode {
  display: flex;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
}

.mode-button {
  height: 26px;
  padding: 0 9px;
  border: 0;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 10.5px;
}

.mode-button + .mode-button {
  border-left: 1px solid var(--border);
}

.mode-button.active {
  background: var(--surface-muted);
  color: var(--text);
  font-weight: 600;
}

.body-editor,
.body-preview {
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
}

.body-editor:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.body-textarea {
  display: block;
  width: 100%;
  min-height: 260px;
  padding: 11px 12px;
  resize: vertical;
  border: 0;
  border-radius: 3px;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.7;
}

.body-preview {
  min-height: 260px;
  padding: 15px;
}

.preview-empty {
  margin: 0;
  color: var(--text-faint);
  font-size: 12px;
}

.tag-editor {
  display: flex;
  min-height: 38px;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  padding: 5px 7px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
}

.tag-editor:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.tag-editor.invalid {
  border-color: var(--danger);
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 22px;
  padding: 2px 4px 2px 7px;
  border-radius: 3px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 11.5px;
}

.remove-tag {
  display: inline-flex;
  padding: 2px;
  border: 0;
  background: transparent;
  color: var(--tag-text);
  opacity: 0.65;
}

.remove-tag:hover {
  opacity: 1;
}

.tag-input {
  min-width: 100px;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 12px;
}

.tag-input::placeholder {
  color: var(--text-faint);
}

.tag-error {
  margin: 5px 0 0;
}

.tag-suggestions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.suggestions-label {
  margin-right: 2px;
  color: var(--text-faint);
  font-size: 10px;
}

.suggestion-chip {
  padding: 2px 7px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 10.5px;
}

.suggestion-chip:hover {
  border-color: var(--border-strong);
  background: var(--tag-bg);
  color: var(--tag-text);
}

.submit-error {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 13px 18px 0;
  padding: 9px 10px;
  border: 1px solid #e5c1c1;
  border-radius: 3px;
  background: #fff7f7;
  color: var(--danger);
  font-size: 11.5px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 13px 18px;
  background: var(--surface-subtle);
}

.publish-button {
  min-width: 106px;
}

@media (max-width: 720px) {
  .page-heading h1 {
    font-size: 21px;
  }

  .page-heading p {
    font-size: 12px;
  }

  .form-panel-head,
  .field-group {
    padding-left: 13px;
    padding-right: 13px;
  }

  .form-panel-head p {
    display: none;
  }

  .label-row {
    flex-direction: column;
    gap: 7px;
  }

  .editor-mode {
    align-self: flex-end;
  }

  .form-actions {
    padding: 12px 13px;
  }

  .body-textarea {
    min-height: 220px;
  }
}
</style>
