<template>
  <div>
    <AdminPageHeader
      eyebrow="TAXONOMY"
      title="标签管理"
      description="新建标签, 维护描述与公开状态. 隐藏的标签不会出现在社区标签目录中."
    >
      <template #actions>
        <button
          class="btn btn-secondary btn-sm"
          type="button"
          :disabled="adminStore.tagsLoading"
          @click="refresh"
        >
          <RefreshCw :size="13" />
          刷新
        </button>
        <button class="btn btn-primary btn-sm" type="button" @click="toggleCreateForm">
          <Plus :size="13" />
          新建标签
        </button>
      </template>
    </AdminPageHeader>

    <section v-if="showCreate" class="panel create-panel" aria-labelledby="create-tag-title">
      <div class="create-head">
        <div>
          <h2 id="create-tag-title">新建标签</h2>
          <p>标签标识用于 URL, 创建后保持不变.</p>
        </div>
        <button class="icon-button" type="button" aria-label="关闭新建标签" @click="closeCreateForm">
          <X :size="15" />
        </button>
      </div>
      <form class="create-form" novalidate @submit.prevent="createTag">
        <div class="create-grid">
          <div class="create-field">
            <label for="tag-name">显示名称</label>
            <input
              id="tag-name"
              ref="nameInput"
              v-model="createForm.name"
              class="admin-input"
              type="text"
              maxlength="30"
              placeholder="例如: 机器学习"
            />
            <span v-if="createErrors.name" class="field-error">{{ createErrors.name }}</span>
          </div>
          <div class="create-field">
            <label for="tag-slug">标签标识</label>
            <input
              id="tag-slug"
              v-model="createForm.slug"
              class="admin-input"
              type="text"
              maxlength="32"
              placeholder="例如: machine-learning"
            />
            <span v-if="createErrors.slug" class="field-error">{{ createErrors.slug }}</span>
            <span v-else class="field-hint">小写字母, 数字和连字符.</span>
          </div>
          <div class="create-field create-field-full">
            <label for="tag-description">描述</label>
            <textarea
              id="tag-description"
              v-model="createForm.description"
              class="admin-textarea"
              rows="3"
              maxlength="200"
              placeholder="说明这个标签覆盖的技术范围."
            />
            <span v-if="createErrors.description" class="field-error">
              {{ createErrors.description }}
            </span>
            <span v-else class="field-hint">{{ createForm.description.length }}/200 个字符</span>
          </div>
        </div>

        <div v-if="createError" class="admin-error" role="alert">
          <AlertCircle :size="14" />
          {{ createError }}
        </div>

        <div class="create-actions">
          <button class="btn btn-secondary btn-sm" type="button" @click="closeCreateForm">
            取消
          </button>
          <button class="btn btn-primary btn-sm" type="submit" :disabled="creatingBusy">
            {{ creatingBusy ? '创建中...' : '创建标签' }}
          </button>
        </div>
      </form>
    </section>

    <section class="panel admin-table-panel">
      <div class="admin-filter-bar">
        <label class="admin-search">
          <Search :size="14" aria-hidden="true" />
          <input
            v-model="keyword"
            type="search"
            placeholder="搜索名称, 标识或描述"
            aria-label="搜索标签"
          />
        </label>
        <select
          v-model="statusFilter"
          class="admin-select"
          aria-label="按标签状态筛选"
        >
          <option value="all">全部状态</option>
          <option value="active">公开</option>
          <option value="hidden">已隐藏</option>
        </select>
        <button
          v-if="hasFilters"
          class="btn btn-ghost btn-sm"
          type="button"
          @click="clearFilters"
        >
          重置
        </button>
        <span class="admin-counter">{{ filteredTags.length }} 个标签</span>
      </div>

      <p
        v-if="!adminStore.tagsLoading && !adminStore.tagsError && filteredTags.length"
        class="admin-table-hint"
      >
        左右滑动表格可查看完整内容.
      </p>

      <div v-if="adminStore.tagsLoading" class="tag-loading" aria-busy="true">
        <div v-for="index in 6" :key="index" class="tag-skeleton-row">
          <span class="skeleton skeleton-tag" />
          <span class="skeleton skeleton-description" />
          <span class="skeleton skeleton-counts" />
        </div>
      </div>

      <div v-else-if="adminStore.tagsError" class="tag-error">
        <EmptyState title="加载标签失败" :description="adminStore.tagsError">
          <button class="btn btn-secondary btn-sm" type="button" @click="refresh">重试</button>
        </EmptyState>
      </div>

      <div v-else-if="filteredTags.length === 0" class="admin-empty">
        没有符合条件的标签.
      </div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table tag-table">
          <thead>
            <tr>
              <th>标签</th>
              <th>描述</th>
              <th>问题</th>
              <th>关注</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tag in filteredTags" :key="tag.slug">
              <td class="tag-cell">
                <span class="tag-chip">#{{ tag.name }}</span>
                <span class="tag-slug">{{ tag.slug }}</span>
              </td>
              <td class="description-cell">
                <template v-if="editingSlug === tag.slug">
                  <textarea
                    v-model="editDraft"
                    class="admin-textarea edit-textarea"
                    rows="2"
                    maxlength="200"
                    :aria-label="`编辑 ${tag.name} 的描述`"
                  />
                  <span v-if="editError" class="field-error">{{ editError }}</span>
                </template>
                <p v-else class="tag-description" :title="tag.description">
                  {{ tag.description }}
                </p>
              </td>
              <td class="tag-numbers">
                <strong>{{ formatNumber(tag.questionCount) }}</strong>
                <span>本周 +{{ tag.weeklyCount }}</span>
              </td>
              <td class="tag-numbers">
                <strong>{{ formatCompact(tag.followerCount) }}</strong>
                <span>关注者</span>
              </td>
              <td>
                <span class="admin-badge" :class="tag.status">
                  {{ tag.status === 'hidden' ? '已隐藏' : '公开' }}
                </span>
              </td>
              <td>
                <div class="admin-row-actions">
                  <template v-if="editingSlug === tag.slug">
                    <button
                      class="admin-action"
                      type="button"
                      :disabled="adminStore.tagBusySlug === tag.slug"
                      @click="saveDescription(tag)"
                    >
                      保存
                    </button>
                    <button class="admin-action" type="button" @click="cancelEdit">取消</button>
                  </template>
                  <template v-else>
                    <button class="admin-action" type="button" @click="startEdit(tag)">
                      <Pencil :size="11" />
                      编辑
                    </button>
                    <button
                      class="admin-action"
                      :class="{ danger: tag.status === 'active' }"
                      type="button"
                      :disabled="adminStore.tagBusySlug === tag.slug"
                      @click="toggleStatus(tag)"
                    >
                      <Eye v-if="tag.status === 'hidden'" :size="11" />
                      <EyeOff v-else :size="11" />
                      {{ tag.status === 'hidden' ? '公开' : '隐藏' }}
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertCircle,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-vue-next'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { AdminTag, AdminTagStatus } from '@/api/types'
import { useAdminStore } from '@/stores/admin'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatCompact, formatNumber } from '@/utils/format'

const route = useRoute()
const adminStore = useAdminStore()
const toastStore = useToastStore()

const keyword = ref('')
const statusFilter = ref<'all' | AdminTagStatus>(readStatus(route.query.status))
const showCreate = ref(false)
const creatingBusy = ref(false)
const createError = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const editingSlug = ref<string | null>(null)
const editDraft = ref('')
const editError = ref('')

const createForm = reactive({
  name: '',
  slug: '',
  description: '',
})

const createErrors = reactive({
  name: '',
  slug: '',
  description: '',
})

const filteredTags = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return adminStore.tags.filter((tag) => {
    const statusMatch = statusFilter.value === 'all' || tag.status === statusFilter.value
    const haystack = `${tag.name} ${tag.slug} ${tag.description}`.toLowerCase()
    return statusMatch && (!query || haystack.includes(query))
  })
})

const hasFilters = computed(
  () => Boolean(keyword.value.trim()) || statusFilter.value !== 'all',
)

function readStatus(value: unknown): 'all' | AdminTagStatus {
  return value === 'active' || value === 'hidden' ? value : 'all'
}

function refresh(): void {
  void adminStore.loadTags(true)
}

function clearFilters(): void {
  keyword.value = ''
  statusFilter.value = 'all'
}

async function toggleCreateForm(): Promise<void> {
  showCreate.value = !showCreate.value
  if (!showCreate.value) {
    resetCreateForm()
    return
  }
  await nextTick()
  nameInput.value?.focus()
}

function closeCreateForm(): void {
  showCreate.value = false
  resetCreateForm()
}

function resetCreateForm(): void {
  createForm.name = ''
  createForm.slug = ''
  createForm.description = ''
  createErrors.name = ''
  createErrors.slug = ''
  createErrors.description = ''
  createError.value = ''
}

function validateCreate(): boolean {
  createErrors.name = ''
  createErrors.slug = ''
  createErrors.description = ''
  createError.value = ''

  const name = createForm.name.trim()
  const slug = createForm.slug.trim().toLowerCase()
  const description = createForm.description.trim()

  if (name.length < 2) {
    createErrors.name = '名称至少需要 2 个字符'
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    createErrors.slug = '只能包含小写字母, 数字和连字符'
  } else if (adminStore.tags.some((tag) => tag.slug === slug)) {
    createErrors.slug = '这个标签标识已被使用'
  }
  if (description.length < 6) {
    createErrors.description = '描述至少需要 6 个字符'
  }
  return !createErrors.name && !createErrors.slug && !createErrors.description
}

async function createTag(): Promise<void> {
  if (creatingBusy.value || !validateCreate()) {
    return
  }

  creatingBusy.value = true
  createError.value = ''
  try {
    const name = createForm.name.trim()
    await adminStore.createTag({
      name,
      slug: createForm.slug.trim().toLowerCase(),
      description: createForm.description.trim(),
    })
    keyword.value = name
    statusFilter.value = 'all'
    toastStore.success('标签已创建')
    closeCreateForm()
  } catch (cause) {
    createError.value = getErrorMessage(cause)
  } finally {
    creatingBusy.value = false
  }
}

function startEdit(tag: AdminTag): void {
  editingSlug.value = tag.slug
  editDraft.value = tag.description
  editError.value = ''
}

function cancelEdit(): void {
  editingSlug.value = null
  editDraft.value = ''
  editError.value = ''
}

async function saveDescription(tag: AdminTag): Promise<void> {
  const description = editDraft.value.trim()
  if (description.length < 6) {
    editError.value = '描述至少需要 6 个字符'
    return
  }
  if (description === tag.description) {
    cancelEdit()
    return
  }

  editError.value = ''
  try {
    await adminStore.updateTag(tag.slug, { description })
    toastStore.success('标签描述已更新')
    cancelEdit()
  } catch (cause) {
    editError.value = getErrorMessage(cause)
  }
}

async function toggleStatus(tag: AdminTag): Promise<void> {
  const next = tag.status === 'active' ? 'hidden' : 'active'
  try {
    await adminStore.updateTag(tag.slug, { status: next })
    if (editingSlug.value === tag.slug) {
      cancelEdit()
    }
    toastStore.success(next === 'hidden' ? '标签已隐藏' : '标签已公开')
  } catch (cause) {
    toastStore.error(getErrorMessage(cause))
  }
}

void adminStore.loadTags()
</script>

<style scoped>
.admin-table-panel {
  overflow: hidden;
}

.create-panel {
  margin-bottom: 12px;
}

.create-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.create-head h2 {
  margin: 0 0 2px;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}

.create-head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 10.5px;
}

.create-form {
  padding: 13px 14px;
}

.create-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.create-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.create-field-full {
  grid-column: 1 / -1;
}

.create-field label {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.field-error {
  color: var(--danger);
  font-size: 10px;
}

.field-hint {
  color: var(--text-faint);
  font-size: 9.5px;
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 12px;
}

.admin-error {
  margin-top: 10px;
}

.tag-table {
  min-width: 780px;
}

.tag-cell {
  min-width: 140px;
}

.tag-chip {
  display: inline-flex;
  max-width: 170px;
  overflow: hidden;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-slug {
  display: block;
  margin-top: 3px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.description-cell {
  width: 320px;
  max-width: 320px;
}

.tag-description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.edit-textarea {
  min-height: 54px;
  font-size: 11px;
}

.tag-numbers {
  white-space: nowrap;
}

.tag-numbers strong {
  display: block;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
}

.tag-numbers span {
  color: var(--text-faint);
  font-size: 9px;
}

.tag-loading {
  padding: 4px 0;
}

.tag-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.tag-skeleton-row:last-child {
  border-bottom: 0;
}

.skeleton-tag {
  width: 92px;
  height: 19px;
}

.skeleton-description {
  width: 220px;
  height: 10px;
}

.skeleton-counts {
  width: 90px;
  height: 8px;
}

.tag-error {
  border-bottom: 0;
}

@media (max-width: 720px) {
  .create-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .create-field-full {
    grid-column: auto;
  }

  .admin-filter-bar {
    row-gap: 6px;
  }

  .admin-search {
    max-width: none;
    flex-basis: 100%;
  }

  .admin-counter {
    margin-left: auto;
  }
}
</style>
