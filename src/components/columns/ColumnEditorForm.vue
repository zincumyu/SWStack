<template>
  <div class="column-editor-form">
    <div class="editor-back">
      <RouterLink :to="backTarget">
        <ArrowLeft :size="12" />
        {{ backLabel }}
      </RouterLink>
    </div>

    <AdminPageHeader
      :eyebrow="isEdit ? 'EDIT COLUMN' : 'NEW COLUMN'"
      :title="isEdit ? '编辑专栏' : '新建专栏'"
      :description="editorDescription"
    >
      <template #actions>
        <span class="status-badge" :class="form.status">
          {{ COLUMN_STATUS_META[form.status].label }}
        </span>
        <span v-if="!isAdminMode && form.moderationLocked" class="locked-badge">
          管理员已下线
        </span>
        <RouterLink
          v-if="original?.status === 'published'"
          class="btn btn-ghost btn-sm"
          :to="{ name: 'column-detail', params: { slug: original.slug } }"
        >
          <Eye :size="13" />
          查看公开页
        </RouterLink>
        <RouterLink class="btn btn-secondary btn-sm" :to="backTarget"> 取消 </RouterLink>
        <button
          class="btn btn-primary btn-sm"
          type="submit"
          form="column-editor-form"
          :disabled="saving || loading || Boolean(loadError)"
        >
          <Save :size="13" />
          {{ saving ? '保存中...' : '保存专栏' }}
        </button>
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="editor-loading" aria-busy="true" aria-label="专栏加载中">
      <div class="panel loading-panel">
        <span class="skeleton loading-line short" />
        <span class="skeleton loading-title" />
        <span class="skeleton loading-line" />
        <span class="skeleton loading-line medium" />
      </div>
      <div class="panel loading-panel tall">
        <span class="skeleton loading-line short" />
        <span class="skeleton loading-block" />
      </div>
    </div>

    <div v-else-if="loadError" class="panel page-state">
      <EmptyState title="无法加载专栏" :description="loadError">
        <button class="btn btn-secondary btn-sm" type="button" @click="init">重试</button>
        <RouterLink class="btn btn-ghost btn-sm" :to="backTarget">
          {{ backLabel }}
        </RouterLink>
      </EmptyState>
    </div>

    <form
      v-else
      id="column-editor-form"
      class="editor-form"
      novalidate
      @submit.prevent="save"
      @input="errors.form = ''"
    >
      <div v-if="errors.form" class="form-banner" role="alert">
        <AlertCircle :size="14" aria-hidden="true" />
        {{ errors.form }}
      </div>

      <div
        v-if="!isAdminMode && form.moderationLocked"
        class="form-banner locked-banner"
        role="status"
      >
        <ShieldAlert :size="14" aria-hidden="true" />
        管理员已将这篇专栏下线. 你仍可以修改并保存为草稿, 需要管理员重新发布后才会公开.
      </div>

      <section class="panel editor-panel" aria-labelledby="column-basic-title">
        <div class="section-head">
          <div>
            <h2 id="column-basic-title">基本信息</h2>
            <p>标题, 摘要和标签会出现在专栏列表与搜索结果中.</p>
          </div>
          <span class="section-note">公开字段</span>
        </div>

        <div class="section-body">
          <div class="field-grid">
            <div class="field">
              <label class="field-label" for="column-title">
                专栏标题
                <span class="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                id="column-title"
                v-model="form.title"
                class="admin-input"
                type="text"
                maxlength="80"
                placeholder="例如: Vue 3 工程化入门路径"
                :aria-invalid="Boolean(errors.title)"
              />
              <div class="field-footer">
                <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
                <span v-else class="field-hint">4-80 个字符</span>
                <span class="field-counter">{{ form.title.length }}/80</span>
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="column-slug">
                地址标识
                <span class="required-mark" aria-hidden="true">*</span>
              </label>
              <div class="slug-field" :class="{ invalid: Boolean(errors.slug) }">
                <span aria-hidden="true">/columns/</span>
                <input
                  id="column-slug"
                  v-model="form.slug"
                  type="text"
                  maxlength="64"
                  placeholder="vue3-engineering-path"
                  :aria-invalid="Boolean(errors.slug)"
                  @input="form.slug = form.slug.toLowerCase()"
                />
              </div>
              <div class="field-footer">
                <span v-if="errors.slug" class="field-error">{{ errors.slug }}</span>
                <span v-else class="field-hint">小写字母, 数字和连字符</span>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="column-summary">
              摘要
              <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <textarea
              id="column-summary"
              v-model="form.summary"
              class="admin-textarea summary-textarea"
              rows="3"
              maxlength="200"
              placeholder="用一到两句话说明这篇专栏解决什么问题, 适合谁阅读."
              :aria-invalid="Boolean(errors.summary)"
            />
            <div class="field-footer">
              <span v-if="errors.summary" class="field-error">{{ errors.summary }}</span>
              <span v-else class="field-hint">20-200 个字符, 会显示在专栏卡片上</span>
              <span class="field-counter">{{ form.summary.length }}/200</span>
            </div>
          </div>

          <div class="option-grid">
            <div class="field">
              <label class="field-label" for="column-level">难度</label>
              <select id="column-level" v-model="form.level" class="admin-select">
                <option v-for="level in COLUMN_LEVELS" :key="level.value" :value="level.value">
                  {{ level.label }} - {{ level.description }}
                </option>
              </select>
            </div>

            <div class="field">
              <label class="field-label" for="column-status">发布状态</label>
              <select
                id="column-status"
                v-model="form.status"
                class="admin-select"
                :disabled="!isAdminMode && form.moderationLocked"
              >
                <option value="draft">
                  {{ isAdminMode ? '草稿, 仅管理员可见' : '草稿, 仅你和管理员可见' }}
                </option>
                <option value="published">发布, 立即公开</option>
              </select>
              <p v-if="!isAdminMode && form.moderationLocked" class="field-lock-hint">
                管理员重新发布前, 专栏会保持草稿状态.
              </p>
            </div>
          </div>

          <label v-if="isAdminMode" class="feature-check">
            <input v-model="form.featured" type="checkbox" />
            <span class="check-box" aria-hidden="true" />
            <span class="check-copy">
              <strong>设为编辑精选</strong>
              <span>会在专栏列表中优先展示, 并标记为精选.</span>
            </span>
          </label>
          <p v-else-if="form.featured" class="feature-note">
            当前为编辑精选. 精选由管理员设置, 保存修改不会改变这个标记.
          </p>
        </div>
      </section>

      <section class="panel editor-panel" aria-labelledby="column-tags-title">
        <div class="section-head">
          <div>
            <h2 id="column-tags-title">标签</h2>
            <p>选择 1-5 个现有标签, 方便读者按主题筛选.</p>
          </div>
          <span class="section-note">{{ form.tags.length }}/5</span>
        </div>

        <div class="section-body">
          <div
            v-if="communityStore.tagsLoading && communityStore.allTags.length === 0"
            class="tag-loading"
          >
            <span class="skeleton tag-skeleton" v-for="index in 8" :key="index" />
          </div>
          <div v-else-if="communityStore.tagsError" class="tag-load-error">
            <span>{{ communityStore.tagsError }}</span>
            <button class="btn btn-secondary btn-sm" type="button" @click="retryTags">重试</button>
          </div>
          <div v-else class="tag-options">
            <label
              v-for="tag in communityStore.allTags"
              :key="tag.slug"
              class="tag-option"
              :class="{ selected: form.tags.includes(tag.slug) }"
            >
              <input
                v-model="form.tags"
                type="checkbox"
                :value="tag.slug"
                :disabled="!form.tags.includes(tag.slug) && form.tags.length >= 5"
                @change="errors.tags = ''"
              />
              <span>#{{ tag.name }}</span>
            </label>
          </div>
          <p v-if="errors.tags" class="field-error tag-error">{{ errors.tags }}</p>
          <p v-else class="tag-hint">标签来自社区标签库. 如需新增, 请先在标签管理中创建.</p>
        </div>
      </section>

      <section class="panel editor-panel" aria-labelledby="column-body-title">
        <div class="section-head">
          <div>
            <h2 id="column-body-title">正文</h2>
            <p>支持 Markdown. 建议用小标题拆分阶段, 并给出可以执行的练习.</p>
          </div>
          <span class="section-note">Markdown</span>
        </div>

        <div class="body-grid">
          <div class="body-editor">
            <label class="field-label" for="column-body">
              专栏正文
              <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <textarea
              id="column-body"
              v-model="form.body"
              class="body-textarea"
              maxlength="20000"
              placeholder="# 学习路径&#10;&#10;先说明适合谁阅读, 再按阶段展开."
              :aria-invalid="Boolean(errors.body)"
            />
            <div class="field-footer">
              <span v-if="errors.body" class="field-error">{{ errors.body }}</span>
              <span v-else class="field-hint">100-20000 个字符, 支持标题, 列表和代码块</span>
              <span class="field-counter">{{ form.body.length }}/20000</span>
            </div>
          </div>

          <div class="body-preview">
            <div class="preview-head">
              <span>
                <Eye :size="12" aria-hidden="true" />
                实时预览
              </span>
              <span>读者看到的样式</span>
            </div>
            <div class="preview-scroll">
              <MarkdownRenderer v-if="form.body.trim()" :source="form.body" />
              <div v-else class="preview-empty">
                <BookOpen :size="22" aria-hidden="true" />
                输入正文后在这里预览.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel editor-panel" aria-labelledby="column-resources-title">
        <div class="section-head">
          <div>
            <h2 id="column-resources-title">资源清单</h2>
            <p>添加可以长期访问的文档, 课程或工具, 最多 8 条.</p>
          </div>
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            :disabled="form.resources.length >= 8"
            @click="addResource"
          >
            <Plus :size="12" />
            添加资源
          </button>
        </div>

        <div class="section-body">
          <div v-if="form.resources.length === 0" class="resources-empty">
            <Link2 :size="18" aria-hidden="true" />
            <span>还没有外部资源. 可以先发布正文, 之后补充链接.</span>
          </div>

          <div v-else class="resource-list">
            <div v-for="(resource, index) in form.resources" :key="index" class="resource-row">
              <div class="resource-row-head">
                <span class="resource-number">资源 {{ index + 1 }}</span>
                <button
                  class="remove-resource"
                  type="button"
                  :aria-label="`删除第 ${index + 1} 条资源`"
                  @click="removeResource(index)"
                >
                  <Trash2 :size="11" />
                  移除
                </button>
              </div>
              <div class="resource-fields">
                <div class="field">
                  <label class="field-label" :for="`resource-title-${index}`">
                    名称
                    <span class="required-mark" aria-hidden="true">*</span>
                  </label>
                  <input
                    :id="`resource-title-${index}`"
                    v-model="resource.title"
                    class="admin-input"
                    type="text"
                    maxlength="60"
                    placeholder="例如: 官方文档"
                  />
                </div>
                <div class="field">
                  <label class="field-label" :for="`resource-url-${index}`">
                    链接
                    <span class="required-mark" aria-hidden="true">*</span>
                  </label>
                  <input
                    :id="`resource-url-${index}`"
                    v-model="resource.url"
                    class="admin-input"
                    type="url"
                    maxlength="400"
                    placeholder="https://..."
                  />
                </div>
                <div class="field resource-description-field">
                  <label class="field-label" :for="`resource-description-${index}`"> 说明 </label>
                  <input
                    :id="`resource-description-${index}`"
                    v-model="resource.description"
                    class="admin-input"
                    type="text"
                    maxlength="160"
                    placeholder="可选, 告诉读者这个资源适合什么时候看."
                  />
                  <div class="field-footer">
                    <span class="field-hint">可留空</span>
                    <span class="field-counter">{{ resource.description.length }}/160</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="errors.resources" class="field-error resource-error">
            {{ errors.resources }}
          </p>
          <p v-else class="resources-hint">链接需要是 http(s) 地址. 发布前请确认资源可以访问.</p>
        </div>
      </section>

      <div class="form-footer">
        <p>
          <ShieldCheck :size="12" aria-hidden="true" />
          {{ footerNote }}
        </p>
        <div class="footer-actions">
          <RouterLink class="btn btn-secondary btn-sm" :to="backTarget"> 取消 </RouterLink>
          <button class="btn btn-primary btn-sm" type="submit" :disabled="saving">
            <Save :size="13" />
            {{ saving ? '保存中...' : '保存专栏' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Eye,
  Link2,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import { adminColumnApi, myColumnApi } from '@/api/columns'
import type { ColumnInput, ColumnLevel, ColumnStatus, ColumnWorkspaceDetail } from '@/api/types'
import { useCommunityStore } from '@/stores/community'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { COLUMN_LEVELS, COLUMN_STATUS_META } from '@/utils/column-meta'

interface ResourceDraft {
  title: string
  url: string
  description: string
}

interface EditorForm {
  title: string
  slug: string
  summary: string
  level: ColumnLevel
  tags: string[]
  body: string
  resources: ResourceDraft[]
  status: ColumnStatus
  featured: boolean
  moderationLocked: boolean
}

const props = defineProps<{
  mode: 'admin' | 'mine'
  columnId: number | null
}>()

const router = useRouter()
const communityStore = useCommunityStore()
const toastStore = useToastStore()

const isAdminMode = computed(() => props.mode === 'admin')
const isEdit = computed(() => props.columnId !== null)
const invalidId = computed(
  () =>
    isEdit.value &&
    (props.columnId === null || !Number.isInteger(props.columnId) || props.columnId <= 0),
)
const backTarget = computed(() =>
  isAdminMode.value ? { name: 'admin-columns' } : { name: 'my-columns' },
)
const backLabel = computed(() => (isAdminMode.value ? '返回专栏管理' : '返回我的专栏'))
const editorDescription = computed(() =>
  isAdminMode.value
    ? '用 Markdown 组织学习路径, 并附上可验证的外部资源. 草稿只有管理员可见.'
    : '用 Markdown 组织学习路径, 并附上可验证的外部资源. 草稿仅你和管理员可见.',
)
const footerNote = computed(() =>
  isAdminMode.value
    ? '发布后修改仍会立即更新公开页, 不需要额外审核.'
    : '发布后修改会立即更新公开页, 编辑精选由管理员设置.',
)

const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const original = ref<ColumnWorkspaceDetail | null>(null)

let initSequence = 0

const form = reactive<EditorForm>({
  title: '',
  slug: '',
  summary: '',
  level: 'beginner',
  tags: [],
  body: '',
  resources: [],
  status: 'draft',
  featured: false,
  moderationLocked: false,
})

const errors = reactive({
  title: '',
  slug: '',
  summary: '',
  body: '',
  tags: '',
  resources: '',
  form: '',
})

watch(
  () => [props.mode, props.columnId] as const,
  () => {
    void init()
  },
  { immediate: true },
)

watch(
  () => [form.title, isEdit.value] as const,
  ([title, editing]) => {
    const base = editing ? '编辑专栏' : '新建专栏'
    document.title = title.trim() ? `${title.trim()} - ${base} - SWStack` : `${base} - SWStack`
  },
  { immediate: true },
)

function clearErrors(): void {
  errors.title = ''
  errors.slug = ''
  errors.summary = ''
  errors.body = ''
  errors.tags = ''
  errors.resources = ''
  errors.form = ''
}

function resetForm(): void {
  form.title = ''
  form.slug = ''
  form.summary = ''
  form.level = 'beginner'
  form.tags = []
  form.body = ''
  form.resources = []
  form.status = 'draft'
  form.featured = false
  form.moderationLocked = false
  clearErrors()
}

function hydrate(detail: ColumnWorkspaceDetail): void {
  form.title = detail.title
  form.slug = detail.slug
  form.summary = detail.summary
  form.level = detail.level
  form.tags = detail.tags.map((tag) => tag.slug)
  form.body = detail.body
  form.resources = detail.resources.map((resource) => ({
    title: resource.title,
    url: resource.url,
    description: resource.description ?? '',
  }))
  form.status = detail.status
  form.featured = detail.featured
  form.moderationLocked = detail.moderationLocked
}

async function init(): Promise<void> {
  const sequence = ++initSequence
  resetForm()
  original.value = null
  loadError.value = ''
  loading.value = false
  void communityStore.loadTags()

  if (!isEdit.value) {
    return
  }
  const id = props.columnId
  if (invalidId.value || id === null) {
    loadError.value = '专栏编号无效'
    return
  }

  loading.value = true
  try {
    const detail = isAdminMode.value
      ? await adminColumnApi.detail(id)
      : await myColumnApi.detail(id)
    if (sequence !== initSequence) {
      return
    }
    original.value = detail
    hydrate(detail)
  } catch (cause) {
    if (sequence !== initSequence) {
      return
    }
    loadError.value = getErrorMessage(cause)
  } finally {
    if (sequence === initSequence) {
      loading.value = false
    }
  }
}

function addResource(): void {
  if (form.resources.length >= 8) {
    return
  }
  form.resources.push({ title: '', url: '', description: '' })
  errors.resources = ''
}

function removeResource(index: number): void {
  form.resources.splice(index, 1)
  errors.resources = ''
}

function retryTags(): void {
  void communityStore.loadTags(true)
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validate(): boolean {
  clearErrors()
  const title = form.title.trim()
  const slug = form.slug.trim()
  const summary = form.summary.trim()
  const body = form.body.trim()

  if (title.length < 4 || title.length > 80) {
    errors.title = '标题需要 4-80 个字符'
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 2 || slug.length > 64) {
    errors.slug = '地址标识只能包含小写字母, 数字和连字符'
  }
  if (summary.length < 20 || summary.length > 200) {
    errors.summary = '摘要需要 20-200 个字符'
  }
  if (body.length < 100 || body.length > 20000) {
    errors.body = '正文需要 100-20000 个字符'
  }
  if (form.tags.length < 1 || form.tags.length > 5) {
    errors.tags = '请选择 1-5 个标签'
  }
  if (form.resources.length > 8) {
    errors.resources = '资源链接最多 8 条'
  }

  for (const [index, resource] of form.resources.entries()) {
    const titleValue = resource.title.trim()
    const urlValue = resource.url.trim()
    const description = resource.description.trim()
    if (titleValue.length < 2 || titleValue.length > 60) {
      errors.resources = `第 ${index + 1} 条资源的名称需要 2-60 个字符`
      break
    }
    if (!isHttpUrl(urlValue) || urlValue.length > 400) {
      errors.resources = `第 ${index + 1} 条资源需要填写有效的 http(s) 链接`
      break
    }
    if (description.length > 160) {
      errors.resources = `第 ${index + 1} 条资源的说明不能超过 160 个字符`
      break
    }
  }

  return !Object.values(errors).some(Boolean)
}

async function save(): Promise<void> {
  if (saving.value || invalidId.value || !validate()) {
    return
  }
  const id = props.columnId
  if (isEdit.value && id === null) {
    return
  }
  saving.value = true
  errors.form = ''
  const status = !isAdminMode.value && form.moderationLocked ? 'draft' : form.status
  const input: ColumnInput = {
    title: form.title.trim(),
    slug: form.slug.trim(),
    summary: form.summary.trim(),
    level: form.level,
    tags: [...form.tags],
    body: form.body.trim(),
    resources: form.resources.map((resource) => ({
      title: resource.title.trim(),
      url: resource.url.trim(),
      description: resource.description.trim(),
    })),
    status,
    featured: form.featured,
  }

  try {
    if (isEdit.value) {
      if (isAdminMode.value) {
        await adminColumnApi.update(id as number, input)
      } else {
        await myColumnApi.update(id as number, input)
      }
      toastStore.success(status === 'published' ? '专栏已更新并公开' : '专栏已保存为草稿')
    } else {
      if (isAdminMode.value) {
        await adminColumnApi.create(input)
      } else {
        await myColumnApi.create(input)
      }
      toastStore.success(status === 'published' ? '专栏已发布' : '草稿已保存')
    }
    await router.push(backTarget.value)
  } catch (cause) {
    errors.form = getErrorMessage(cause)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.column-editor-form {
  min-width: 0;
}

.editor-back {
  margin: -3px 0 8px;
}

.editor-back a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 10.5px;
}

.editor-back a:hover {
  color: var(--link-hover);
}

.status-badge {
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.4;
  white-space: nowrap;
}

.status-badge.published {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.locked-badge {
  padding: 2px 6px;
  border: 1px solid #e7c8c8;
  border-radius: 2px;
  background: #fdf4f4;
  color: var(--danger);
  font-size: 9.5px;
  line-height: 1.4;
  white-space: nowrap;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-banner {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid #e5c1c1;
  border-radius: 3px;
  background: #fff7f7;
  color: var(--danger);
  font-size: 10.5px;
  line-height: 1.55;
}

.form-banner svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.form-banner.locked-banner {
  border-color: #e8d6b4;
  background: #fffaf0;
  color: #87611e;
}

.editor-panel {
  overflow: hidden;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
}

.section-head h2 {
  margin: 0 0 2px;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 650;
}

.section-head p {
  margin: 0;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.5;
}

.section-note {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  white-space: nowrap;
}

.section-body {
  padding: 13px 14px 14px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.field + .field {
  margin-top: 0;
}

.field-grid + .field,
.option-grid + .feature-check,
.section-body > .field {
  margin-top: 12px;
}

.field-label {
  display: block;
  margin-bottom: 4px;
  color: var(--text);
  font-size: 10.5px;
  font-weight: 600;
}

.required-mark {
  color: var(--brand);
}

.field .admin-input,
.field .admin-select,
.field .admin-textarea {
  display: block;
  width: 100%;
}

.field .admin-select {
  min-height: 32px;
}

.field .admin-select:disabled {
  background: var(--surface-subtle);
  color: var(--text-faint);
  cursor: not-allowed;
}

.summary-textarea {
  min-height: 70px;
}

.field-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.5;
}

.field-error {
  color: var(--danger);
}

.field-hint {
  min-width: 0;
}

.field-lock-hint {
  margin: 4px 0 0;
  color: #87611e;
  font-size: 9px;
  line-height: 1.5;
}

.field-counter {
  flex: 0 0 auto;
  font-family: var(--font-mono);
}

.slug-field {
  display: flex;
  min-height: 32px;
  align-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  overflow: hidden;
}

.slug-field:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.slug-field.invalid {
  border-color: var(--danger);
}

.slug-field > span {
  flex: 0 0 auto;
  padding-left: 9px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.slug-field input {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 6px 9px 6px 3px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 12px;
}

.feature-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 13px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  cursor: pointer;
}

.feature-check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.check-box {
  position: relative;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  margin-top: 1px;
  border: 1px solid var(--border-strong);
  border-radius: 2px;
  background: var(--surface);
}

.feature-check input:checked + .check-box {
  border-color: var(--brand);
  background: var(--brand);
}

.feature-check input:checked + .check-box::after {
  position: absolute;
  top: 1px;
  left: 4px;
  width: 4px;
  height: 8px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  content: '';
  transform: rotate(45deg);
}

.feature-check input:focus-visible + .check-box {
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.check-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.check-copy strong {
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.check-copy span {
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.feature-note {
  margin: 13px 0 0;
  padding: 9px 10px;
  border: 1px solid var(--brand-border);
  border-radius: 3px;
  background: var(--brand-soft);
  color: var(--brand-hover);
  font-size: 9.5px;
  line-height: 1.55;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-option {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.3;
  cursor: pointer;
}

.tag-option:hover {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
}

.tag-option.selected {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.tag-option input {
  width: 11px;
  height: 11px;
  margin: 0;
  accent-color: var(--brand);
}

.tag-option:has(input:disabled) {
  opacity: 0.45;
  cursor: not-allowed;
}

.tag-error {
  margin: 7px 0 0;
  font-size: 9.5px;
}

.tag-hint {
  margin: 8px 0 0;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.5;
}

.tag-loading {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-skeleton {
  width: 72px;
  height: 24px;
}

.tag-load-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--danger);
  font-size: 10px;
}

.body-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 13px 14px 14px;
}

.body-editor {
  min-width: 0;
}

.body-textarea {
  display: block;
  width: 100%;
  height: 560px;
  padding: 10px;
  resize: vertical;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11.5px;
  line-height: 1.65;
}

.body-textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.body-textarea::placeholder {
  color: var(--text-faint);
}

.body-textarea[aria-invalid='true'] {
  border-color: var(--danger);
}

.body-preview {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--border);
  color: var(--text-faint);
  font-size: 9px;
}

.preview-head > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.preview-scroll {
  height: 560px;
  overflow-y: auto;
  padding: 12px 14px;
  background: var(--surface);
}

.preview-scroll :deep(.markdown-body) {
  font-size: 12.5px;
  line-height: 1.7;
}

.preview-empty {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.resources-empty {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 13px;
  border: 1px dashed var(--border-strong);
  border-radius: 3px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-row {
  padding: 9px 10px 10px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.resource-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
}

.resource-number {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
}

.remove-resource {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 5px;
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
  color: var(--text-faint);
  font-size: 9px;
}

.remove-resource:hover {
  border-color: #e5c1c1;
  background: #fdf6f6;
  color: var(--danger);
}

.resource-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.resource-description-field {
  grid-column: 1 / -1;
}

.resource-error {
  margin: 8px 0 0;
  font-size: 9.5px;
}

.resources-hint {
  margin: 8px 0 0;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.5;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
}

.form-footer > p {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.5;
}

.form-footer > p svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.footer-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}

.page-state {
  overflow: hidden;
}

.editor-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-panel {
  display: flex;
  padding: 16px;
  flex-direction: column;
  gap: 10px;
}

.loading-panel.tall {
  min-height: 420px;
}

.loading-line {
  display: block;
  width: 70%;
  height: 9px;
}

.loading-line.short {
  width: 28%;
}

.loading-line.medium {
  width: 50%;
}

.loading-title {
  display: block;
  width: 38%;
  height: 22px;
}

.loading-block {
  display: block;
  width: 100%;
  flex: 1;
  min-height: 300px;
}

@media (max-width: 1020px) {
  .body-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .body-textarea,
  .preview-scroll {
    height: 420px;
  }
}

@media (max-width: 720px) {
  .field-grid,
  .option-grid,
  .resource-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .resource-description-field {
    grid-column: auto;
  }

  .section-head {
    flex-wrap: wrap;
    padding: 10px 12px;
  }

  .section-body {
    padding: 11px 12px 12px;
  }

  .body-grid {
    padding: 11px 12px 12px;
  }

  .body-textarea,
  .preview-scroll {
    height: 360px;
  }

  .form-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .footer-actions {
    width: 100%;
  }

  .footer-actions .btn {
    flex: 1;
  }
}

@media (max-width: 520px) {
  .status-badge {
    display: none;
  }

  .body-textarea,
  .preview-scroll {
    height: 320px;
  }
}
</style>
