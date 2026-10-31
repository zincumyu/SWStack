<template>
  <div class="page-container project-editor-page">
    <div class="page-back">
      <RouterLink :to="{ name: 'my-projects' }">
        <ArrowLeft :size="13" />
        返回我的项目
      </RouterLink>
    </div>

    <header class="editor-head">
      <div>
        <div class="eyebrow">
          <span class="eyebrow-mark" aria-hidden="true" />
          PROJECT WORKSPACE
        </div>
        <h1>{{ isEdit ? '编辑项目' : '发布项目' }}</h1>
        <p>
          {{
            isEdit
              ? '修改会重新进入管理员审核. 审核通过前, 项目不会出现在公开项目展示.'
              : '填写真实可访问的项目资料. 提交后由管理员审核, 通过后才会公开.'
          }}
        </p>
      </div>
      <ProjectReviewBadge
        v-if="reviewState"
        :status="reviewState.reviewStatus"
      />
    </header>

    <div
      v-if="isEdit && myStore.editorLoading"
      class="panel editor-loading"
      aria-busy="true"
    >
      <div class="loading-grid">
        <div class="loading-block">
          <span class="skeleton loading-line short" />
          <span class="skeleton loading-input" />
          <span class="skeleton loading-input" />
        </div>
        <div class="loading-block">
          <span class="skeleton loading-line short" />
          <span class="skeleton loading-input tall" />
          <span class="skeleton loading-input" />
        </div>
      </div>
    </div>

    <div v-else-if="isEdit && myStore.editorError" class="panel page-state">
      <EmptyState title="加载项目失败" :description="myStore.editorError">
        <button class="btn btn-secondary btn-sm" type="button" @click="retryLoad">
          重试
        </button>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="isEdit && !reviewState && !submitting" class="panel page-state">
      <EmptyState title="没有找到这个项目" description="项目可能已被删除, 或你没有编辑权限.">
        <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'my-projects' }">
          返回我的项目
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else class="editor-layout">
      <form class="editor-form panel" novalidate @submit.prevent="submit">
        <div
          v-if="reviewState?.reviewStatus === 'rejected'"
          class="review-banner rejected"
          role="alert"
        >
          <AlertTriangle :size="15" aria-hidden="true" />
          <div>
            <strong>项目已被退回修改</strong>
            <p>{{ reviewState.reviewNote || '请根据本次审核意见修改后重新提交.' }}</p>
          </div>
        </div>
        <div
          v-else-if="reviewState?.reviewStatus === 'approved'"
          class="review-banner approved"
        >
          <Info :size="15" aria-hidden="true" />
          <div>
            <strong>项目当前已上线</strong>
            <p>保存修改后会重新进入审核, 审核通过前会暂时从公开项目展示下线.</p>
          </div>
        </div>
        <div
          v-else-if="reviewState?.reviewStatus === 'pending'"
          class="review-banner pending"
        >
          <Clock3 :size="15" aria-hidden="true" />
          <div>
            <strong>项目正在审核中</strong>
            <p>保存修改会更新审核内容. 请等待管理员处理后再次查看状态.</p>
          </div>
        </div>

        <section class="form-section" aria-labelledby="basic-title">
          <div class="section-head">
            <h2 id="basic-title">基本信息</h2>
            <span class="section-note">公开卡片与详情页会展示这些内容</span>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label" for="project-name">
                项目名称
                <span class="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                id="project-name"
                v-model="form.name"
                class="text-field"
                type="text"
                maxlength="60"
                placeholder="例如: CampusFlow"
                :aria-invalid="Boolean(errors.name)"
              />
              <div class="field-footer">
                <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
                <span v-else class="field-hint">2-60 个字符</span>
                <span class="field-counter">{{ form.name.length }}/60</span>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label" for="project-slug">
                项目地址标识
                <span class="required-mark" aria-hidden="true">*</span>
              </label>
              <div class="slug-field" :class="{ invalid: Boolean(errors.slug) }">
                <span aria-hidden="true">/projects/</span>
                <input
                  id="project-slug"
                  v-model="form.slug"
                  type="text"
                  maxlength="40"
                  placeholder="campus-flow"
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

          <div class="field-group">
            <label class="field-label" for="project-tagline">
              一句话简介
              <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="project-tagline"
              v-model="form.tagline"
              class="text-field"
              type="text"
              maxlength="140"
              placeholder="说明项目解决什么问题, 以及当前做到哪一步"
              :aria-invalid="Boolean(errors.tagline)"
            />
            <div class="field-footer">
              <span v-if="errors.tagline" class="field-error">{{ errors.tagline }}</span>
              <span v-else class="field-hint">8-140 个字符, 会显示在项目卡片上</span>
              <span class="field-counter">{{ form.tagline.length }}/140</span>
            </div>
          </div>

          <div class="image-section">
            <div class="image-section-title">
              <div>
                <span class="field-label">
                  项目封面
                  <span class="required-mark" aria-hidden="true">*</span>
                </span>
                <p class="field-hint">
                  会用在项目卡片和详情页首屏. 支持 JPG, PNG, WebP, 单张不超过 5MB.
                </p>
              </div>
              <span class="cover-limit">也可以把图片拖到预览区</span>
            </div>

            <div class="cover-editor">
              <div
                class="cover-preview"
                :class="{ broken: coverBroken, uploading: coverUploading }"
                @dragover.prevent
                @drop.prevent="handleCoverDrop"
              >
                <img
                  v-if="!coverBroken"
                  :src="coverPreview"
                  alt="项目封面预览"
                  @error="coverBroken = true"
                />
                <span v-else class="cover-fallback">
                  <ImageOff :size="18" />
                  图片无法预览
                </span>
                <span v-if="coverUploading" class="cover-uploading">
                  <Loader2 :size="16" class="spin" />
                  上传中...
                </span>
              </div>

              <div class="cover-field">
                <p class="cover-description">
                  建议上传真实界面截图. 也可以先使用占位封面, 之后在编辑页补充.
                </p>
                <div class="cover-actions">
                  <button
                    class="btn btn-secondary btn-sm"
                    type="button"
                    :disabled="coverUploading || submitting"
                    @click="pickCover"
                  >
                    <Upload :size="13" />
                    {{ coverUploading ? '上传中...' : '上传封面' }}
                  </button>
                  <button
                    v-if="form.coverImage !== DEFAULT_COVER"
                    class="btn btn-ghost btn-sm"
                    type="button"
                    :disabled="coverUploading || submitting"
                    @click="restoreDefaultCover"
                  >
                    使用占位封面
                  </button>
                </div>
                <p v-if="errors.coverImage" class="image-error" role="alert">
                  {{ errors.coverImage }}
                </p>
                <p v-else class="field-hint">未上传时会保留默认占位封面.</p>
                <input
                  ref="coverInput"
                  class="file-input"
                  type="file"
                  :accept="PROJECT_IMAGE_ACCEPT"
                  @change="handleCoverChange"
                />
              </div>
            </div>

            <div class="screenshot-block">
              <div class="screenshot-head">
                <div>
                  <span class="field-label">详情截图</span>
                  <p class="field-hint">
                    可选, 最多 4 张. 通过审核后会展示在项目详情的截图画廊.
                  </p>
                </div>
                <span class="field-counter">
                  {{ form.screenshots.length }}/{{ SCREENSHOT_LIMIT }}
                </span>
              </div>

              <div class="screenshot-grid">
                <div
                  v-for="(image, index) in form.screenshots"
                  :key="index"
                  class="screenshot-item"
                >
                  <img :src="image" :alt="`详情截图 ${index + 1}`" loading="lazy" />
                  <button
                    class="screenshot-remove"
                    type="button"
                    :aria-label="`移除第 ${index + 1} 张详情截图`"
                    :disabled="screenshotsUploading || submitting"
                    @click="removeScreenshot(index)"
                  >
                    <X :size="11" />
                  </button>
                </div>

                <button
                  v-if="form.screenshots.length < SCREENSHOT_LIMIT"
                  class="screenshot-add"
                  type="button"
                  :disabled="screenshotsUploading || submitting"
                  @click="pickScreenshots"
                  @dragover.prevent
                  @drop.prevent="handleScreenshotsDrop"
                >
                  <Loader2 v-if="screenshotsUploading" :size="17" class="spin" />
                  <ImagePlus v-else :size="17" />
                  <span>{{ screenshotsUploading ? '上传中...' : '添加详情截图' }}</span>
                  <small>
                    {{ SCREENSHOT_LIMIT - form.screenshots.length }} 个空位
                  </small>
                </button>
              </div>

              <input
                ref="screenshotsInput"
                class="file-input"
                type="file"
                :accept="PROJECT_IMAGE_ACCEPT"
                multiple
                @change="handleScreenshotsChange"
              />
              <p v-if="screenshotError" class="image-error" role="alert">
                {{ screenshotError }}
              </p>
            </div>
          </div>
        </section>

        <section class="form-section" aria-labelledby="status-title">
          <div class="section-head">
            <h2 id="status-title">项目状态与需求</h2>
            <span class="section-note">帮助访客判断是否适合参与</span>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label" for="project-status">
                当前进度
                <span class="required-mark" aria-hidden="true">*</span>
              </label>
              <select id="project-status" v-model="form.status" class="text-field select-field">
                <option
                  v-for="(meta, value) in PROJECT_STATUS_META"
                  :key="value"
                  :value="value"
                >
                  {{ meta.label }}
                </option>
              </select>
              <p class="field-hint status-hint">
                {{ PROJECT_STATUS_META[form.status].description }}
              </p>
            </div>

            <div class="field-group">
              <label class="field-label" for="project-team">团队名称</label>
              <input
                id="project-team"
                v-model="form.teamName"
                class="text-field"
                type="text"
                maxlength="30"
                placeholder="个人项目可留空"
                :aria-invalid="Boolean(errors.teamName)"
              />
              <div class="field-footer">
                <span v-if="errors.teamName" class="field-error">{{ errors.teamName }}</span>
                <span v-else class="field-hint">可选, 最多 30 个字符</span>
              </div>
            </div>
          </div>

          <div class="field-group">
            <span class="field-label">当前需求</span>
            <p class="field-hint">可多选, 会显示在卡片和详情页的招募区域.</p>
            <div class="need-options">
              <button
                class="need-option"
                :class="{ active: form.needs.includes('feedback') }"
                type="button"
                :aria-pressed="form.needs.includes('feedback')"
                @click="toggleNeed('feedback')"
              >
                <span class="need-icon">
                  <MessageSquareText :size="15" />
                </span>
                <span class="need-copy">
                  <strong>{{ PROJECT_NEED_META.feedback.label }}</strong>
                  <small>{{ PROJECT_NEED_META.feedback.description }}</small>
                </span>
                <Check v-if="form.needs.includes('feedback')" :size="14" class="need-check" />
              </button>
              <button
                class="need-option"
                :class="{ active: form.needs.includes('teammates') }"
                type="button"
                :aria-pressed="form.needs.includes('teammates')"
                @click="toggleNeed('teammates')"
              >
                <span class="need-icon">
                  <UsersRound :size="15" />
                </span>
                <span class="need-copy">
                  <strong>{{ PROJECT_NEED_META.teammates.label }}</strong>
                  <small>{{ PROJECT_NEED_META.teammates.description }}</small>
                </span>
                <Check v-if="form.needs.includes('teammates')" :size="14" class="need-check" />
              </button>
            </div>
          </div>
        </section>

        <section class="form-section" aria-labelledby="tech-title">
          <div class="section-head">
            <h2 id="tech-title">技术栈</h2>
            <span class="section-note">最多 8 项</span>
          </div>
          <div class="field-group">
            <label class="field-label" for="tech-input">
              使用的主要技术
              <span class="required-mark" aria-hidden="true">*</span>
            </label>
            <p class="field-hint">输入后按 Enter 或逗号添加, 例如 Vue 3, FastAPI.</p>
            <div class="tech-editor" :class="{ invalid: Boolean(errors.techStack) }">
              <span v-for="(tech, index) in form.techStack" :key="tech" class="tech-token">
                {{ tech }}
                <button
                  class="remove-tech"
                  type="button"
                  :aria-label="`移除技术 ${tech}`"
                  @click="removeTech(index)"
                >
                  <X :size="10" />
                </button>
              </span>
              <input
                id="tech-input"
                v-model="techInput"
                type="text"
                maxlength="24"
                placeholder="添加技术"
                :disabled="form.techStack.length >= 8"
                @keydown="handleTechKeydown"
                @blur="addTech(techInput)"
              />
            </div>
            <div class="field-footer">
              <span v-if="errors.techStack" class="field-error">{{ errors.techStack }}</span>
              <span v-else-if="techError" class="field-error">{{ techError }}</span>
              <span v-else class="field-hint">会显示在卡片和详情页</span>
              <span class="field-counter">{{ form.techStack.length }}/8</span>
            </div>
          </div>
        </section>

        <section class="form-section" aria-labelledby="readme-title">
          <div class="section-head">
            <h2 id="readme-title">README</h2>
            <span class="section-note">支持 Markdown</span>
          </div>
          <div class="field-group">
            <div class="label-row">
              <div>
                <label class="field-label" for="project-readme">
                  项目说明
                  <span class="required-mark" aria-hidden="true">*</span>
                </label>
                <p class="field-hint">
                  说明项目目标, 当前进度, 技术方案和运行方式. 不要包含密钥或未公开代码.
                </p>
              </div>
              <div class="editor-mode" role="tablist" aria-label="README 编辑模式">
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
                id="project-readme"
                v-model="form.readme"
                class="body-textarea"
                rows="16"
                placeholder="## 项目简介&#10;&#10;..."
                :aria-invalid="Boolean(errors.readme)"
              />
            </div>
            <div v-else class="body-preview">
              <MarkdownRenderer v-if="form.readme.trim()" :source="form.readme" />
              <p v-else class="preview-empty">还没有内容可以预览.</p>
            </div>

            <div class="field-footer">
              <span v-if="errors.readme" class="field-error">{{ errors.readme }}</span>
              <span v-else class="field-hint">至少 50 个字符</span>
              <span class="field-counter">{{ form.readme.length }}/12000</span>
            </div>
          </div>
        </section>

        <section class="form-section" aria-labelledby="links-title">
          <div class="section-head">
            <h2 id="links-title">项目链接</h2>
            <span class="section-note">可选</span>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label" for="project-github">
                <Github :size="13" aria-hidden="true" />
                GitHub 地址
              </label>
              <input
                id="project-github"
                v-model="form.githubUrl"
                class="text-field"
                type="url"
                maxlength="300"
                placeholder="https://github.com/..."
                :aria-invalid="Boolean(errors.githubUrl)"
              />
              <div class="field-footer">
                <span v-if="errors.githubUrl" class="field-error">{{ errors.githubUrl }}</span>
                <span v-else class="field-hint">填写完整地址</span>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label" for="project-demo">
                <ExternalLink :size="13" aria-hidden="true" />
                Demo 地址
              </label>
              <input
                id="project-demo"
                v-model="form.demoUrl"
                class="text-field"
                type="url"
                maxlength="300"
                placeholder="https://..."
                :aria-invalid="Boolean(errors.demoUrl)"
              />
              <div class="field-footer">
                <span v-if="errors.demoUrl" class="field-error">{{ errors.demoUrl }}</span>
                <span v-else class="field-hint">可访问的在线体验地址</span>
              </div>
            </div>
          </div>
        </section>

        <div v-if="submitError" class="submit-error" role="alert">
          <AlertCircle :size="15" />
          {{ submitError }}
        </div>

        <div class="form-actions">
          <RouterLink class="btn btn-ghost" :to="{ name: 'my-projects' }">取消</RouterLink>
          <button
            class="btn btn-primary submit-button"
            type="submit"
            :disabled="submitting || coverUploading || screenshotsUploading"
          >
            <Send :size="14" />
            {{
              submitting
                ? '提交中...'
                : coverUploading || screenshotsUploading
                  ? '等待图片上传...'
                  : isEdit
                    ? '保存并重新提交审核'
                    : '提交审核'
            }}
          </button>
        </div>
      </form>

      <aside class="editor-side">
        <section class="panel side-panel" aria-labelledby="review-flow-title">
          <div class="panel-header">
            <h2 id="review-flow-title" class="panel-title">
              <ClipboardCheck :size="14" aria-hidden="true" />
              审核流程
            </h2>
            <ProjectReviewBadge
              v-if="reviewState"
              :status="reviewState.reviewStatus"
            />
          </div>
          <ol class="review-steps">
            <li class="done">
              <span class="step-mark">1</span>
              <div>
                <strong>填写项目资料</strong>
                <p>项目名, 截图, 技术栈, README 与链接.</p>
              </div>
            </li>
            <li :class="{ done: Boolean(reviewState?.submittedAt) }">
              <span class="step-mark">2</span>
              <div>
                <strong>提交管理员审核</strong>
                <p>审核期间项目不会出现在公开展示中.</p>
              </div>
            </li>
            <li
              :class="{
                done: reviewState?.reviewStatus === 'approved',
                rejected: reviewState?.reviewStatus === 'rejected',
              }"
            >
              <span class="step-mark">3</span>
              <div>
                <strong>审核通过上线</strong>
                <p>通过后会按项目板块的开关状态公开展示.</p>
              </div>
            </li>
          </ol>

          <dl v-if="reviewState" class="review-dates">
            <div v-if="reviewState.submittedAt">
              <dt>提交时间</dt>
              <dd>{{ formatRelativeTime(reviewState.submittedAt) }}</dd>
            </div>
            <div v-if="reviewState.reviewedAt">
              <dt>审核时间</dt>
              <dd>{{ formatRelativeTime(reviewState.reviewedAt) }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel side-panel" aria-labelledby="tips-title">
          <div class="panel-header">
            <h2 id="tips-title" class="panel-title">
              <Lightbulb :size="14" aria-hidden="true" />
              提交建议
            </h2>
          </div>
          <ul class="tips-list">
            <li>截图使用真实界面, 不要放无关海报.</li>
            <li>README 写清当前进度和下一步计划.</li>
            <li>GitHub 与 Demo 尽量填写可访问地址.</li>
            <li>不要提交密钥, 个人信息或未公开课程代码.</li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Github,
  ImageOff,
  ImagePlus,
  Info,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Send,
  Upload,
  UsersRound,
  X,
} from 'lucide-vue-next'
import EmptyState from '@/components/common/EmptyState.vue'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer.vue'
import ProjectReviewBadge from '@/components/projects/ProjectReviewBadge.vue'
import type { ProjectDraftInput, ProjectNeed, ProjectStatus } from '@/api/types'
import { uploadApi } from '@/api/uploads'
import { useMyProjectsStore } from '@/stores/my-projects'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime } from '@/utils/format'
import {
  isProjectImageRef,
  PROJECT_IMAGE_ACCEPT,
  PROJECT_SCREENSHOT_LIMIT,
  validateProjectImageFile,
} from '@/utils/project-images'
import { PROJECT_NEED_META, PROJECT_STATUS_META } from '@/utils/project-meta'

const DEFAULT_COVER = '/projects/project-default.svg'
const SCREENSHOT_LIMIT = PROJECT_SCREENSHOT_LIMIT

interface ProjectFormState {
  name: string
  slug: string
  tagline: string
  coverImage: string
  screenshots: string[]
  techStack: string[]
  status: ProjectStatus
  needs: ProjectNeed[]
  teamName: string
  githubUrl: string
  demoUrl: string
  readme: string
}

const route = useRoute()
const router = useRouter()
const myStore = useMyProjectsStore()
const toastStore = useToastStore()

const isEdit = computed(() => route.name === 'project-edit')
const editId = computed(() => Number(route.params.id))
const reviewState = computed(() => (isEdit.value ? myStore.editor : null))

const form = reactive<ProjectFormState>({
  name: '',
  slug: '',
  tagline: '',
  coverImage: DEFAULT_COVER,
  screenshots: [],
  techStack: [],
  status: 'building',
  needs: [],
  teamName: '',
  githubUrl: '',
  demoUrl: '',
  readme: '',
})

const errors = reactive({
  name: '',
  slug: '',
  tagline: '',
  coverImage: '',
  techStack: '',
  teamName: '',
  readme: '',
  githubUrl: '',
  demoUrl: '',
})

const techInput = ref('')
const techError = ref('')
const mode = ref<'write' | 'preview'>('write')
const submitting = ref(false)
const submitError = ref('')
const coverBroken = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)
const screenshotsInput = ref<HTMLInputElement | null>(null)
const coverUploading = ref(false)
const screenshotsUploading = ref(false)
const screenshotError = ref('')
let formVersion = 0

const coverPreview = computed(() => form.coverImage.trim() || DEFAULT_COVER)

watch(coverPreview, () => {
  coverBroken.value = false
})

function resetForm(): void {
  formVersion += 1
  form.name = ''
  form.slug = ''
  form.tagline = ''
  form.coverImage = DEFAULT_COVER
  form.screenshots = []
  form.techStack = []
  form.status = 'building'
  form.needs = []
  form.teamName = ''
  form.githubUrl = ''
  form.demoUrl = ''
  form.readme = ''
  techInput.value = ''
  techError.value = ''
  mode.value = 'write'
  submitError.value = ''
  screenshotError.value = ''
  coverUploading.value = false
  screenshotsUploading.value = false
  coverBroken.value = false
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })
  if (coverInput.value) {
    coverInput.value.value = ''
  }
  if (screenshotsInput.value) {
    screenshotsInput.value.value = ''
  }
}

function hydrate(value: typeof myStore.editor): void {
  if (!value) {
    return
  }
  formVersion += 1
  form.name = value.name
  form.slug = value.slug
  form.tagline = value.tagline
  form.coverImage = value.coverImage || DEFAULT_COVER
  form.screenshots = [...value.screenshots]
  form.techStack = [...value.techStack]
  form.status = value.status
  form.needs = [...value.needs]
  form.teamName = value.teamName ?? ''
  form.githubUrl = value.githubUrl ?? ''
  form.demoUrl = value.demoUrl ?? ''
  form.readme = value.readme
  screenshotError.value = ''
  coverUploading.value = false
  screenshotsUploading.value = false
  coverBroken.value = false
}

async function loadEditor(): Promise<void> {
  if (!isEdit.value) {
    return
  }
  const id = editId.value
  if (!Number.isFinite(id) || id <= 0) {
    return
  }
  await myStore.loadEditor(id)
  hydrate(myStore.editor)
}

watch(
  () => [route.name, route.params.id] as const,
  () => {
    submitError.value = ''
    if (isEdit.value) {
      void loadEditor()
    } else {
      myStore.clearEditor()
      resetForm()
    }
  },
  { immediate: true },
)

function retryLoad(): void {
  void loadEditor()
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
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })
  techError.value = ''
  screenshotError.value = ''
  const name = form.name.trim()
  const slug = form.slug.trim().toLowerCase()
  const tagline = form.tagline.trim()
  const coverImage = form.coverImage.trim()
  const readme = form.readme.trim()
  const teamName = form.teamName.trim()
  const github = form.githubUrl.trim()
  const demo = form.demoUrl.trim()

  if (name.length < 2 || name.length > 60) {
    errors.name = '项目名称需要 2-60 个字符'
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 2 || slug.length > 40) {
    errors.slug = '项目地址标识只能包含小写字母, 数字和连字符'
  } else if (slug === 'board') {
    errors.slug = '这个项目地址标识不可用'
  }
  if (tagline.length < 8 || tagline.length > 140) {
    errors.tagline = '一句话简介需要 8-140 个字符'
  }
  if (!isProjectImageRef(coverImage)) {
    errors.coverImage = '请上传有效的项目封面'
  }
  if (form.screenshots.length > SCREENSHOT_LIMIT) {
    screenshotError.value = `详情截图最多 ${SCREENSHOT_LIMIT} 张`
  } else if (form.screenshots.some((image) => !isProjectImageRef(image))) {
    screenshotError.value = '详情截图包含无效图片, 请移除后重新上传'
  }
  if (form.techStack.length === 0) {
    errors.techStack = '请至少添加一项技术栈'
  }
  if (teamName.length > 30) {
    errors.teamName = '团队名称不能超过 30 个字符'
  }
  if (readme.length < 50 || readme.length > 12000) {
    errors.readme = 'README 需要 50-12000 个字符'
  }
  if (github && !isHttpUrl(github)) {
    errors.githubUrl = 'GitHub 地址需要以 http:// 或 https:// 开头'
  }
  if (demo && !isHttpUrl(demo)) {
    errors.demoUrl = 'Demo 地址需要以 http:// 或 https:// 开头'
  }

  return !Object.values(errors).some(Boolean) && !screenshotError.value
}

function toggleNeed(need: ProjectNeed): void {
  form.needs = form.needs.includes(need)
    ? form.needs.filter((item) => item !== need)
    : [...form.needs, need]
}

function addTech(raw: string): void {
  const value = raw.trim().replace(/\s+/g, ' ')
  if (!value) {
    return
  }
  if (value.length > 24) {
    techError.value = '每项技术不能超过 24 个字符'
    return
  }
  if (form.techStack.some((item) => item.toLowerCase() === value.toLowerCase())) {
    techInput.value = ''
    techError.value = ''
    return
  }
  if (form.techStack.length >= 8) {
    techError.value = '最多添加 8 项技术'
    return
  }
  form.techStack.push(value)
  techInput.value = ''
  techError.value = ''
  errors.techStack = ''
}

function removeTech(index: number): void {
  form.techStack.splice(index, 1)
  techError.value = ''
}

function handleTechKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTech(techInput.value)
    return
  }
  if (event.key === 'Backspace' && !techInput.value && form.techStack.length > 0) {
    form.techStack.pop()
  }
}

function pickCover(): void {
  if (coverUploading.value || submitting.value) {
    return
  }
  coverInput.value?.click()
}

function pickScreenshots(): void {
  if (screenshotsUploading.value || submitting.value) {
    return
  }
  screenshotsInput.value?.click()
}

async function uploadCoverFile(file: File): Promise<void> {
  if (coverUploading.value) {
    return
  }
  const fileError = validateProjectImageFile(file)
  if (fileError) {
    errors.coverImage = fileError
    return
  }
  const version = formVersion
  errors.coverImage = ''
  coverUploading.value = true
  try {
    const image = await uploadApi.image(file)
    if (version !== formVersion) {
      return
    }
    form.coverImage = image.url
    coverBroken.value = false
  } catch (cause) {
    if (version === formVersion) {
      errors.coverImage = getErrorMessage(cause)
    }
  } finally {
    if (version === formVersion) {
      coverUploading.value = false
    }
  }
}

function handleCoverChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    void uploadCoverFile(file)
  }
}

function handleCoverDrop(event: DragEvent): void {
  if (coverUploading.value || submitting.value) {
    return
  }
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    void uploadCoverFile(file)
  }
}

async function uploadScreenshots(files: File[]): Promise<void> {
  if (!files.length || screenshotsUploading.value) {
    return
  }
  const remaining = SCREENSHOT_LIMIT - form.screenshots.length
  if (remaining <= 0) {
    screenshotError.value = `详情截图最多 ${SCREENSHOT_LIMIT} 张`
    return
  }
  if (files.length > remaining) {
    screenshotError.value = `最多还能上传 ${remaining} 张详情截图`
    return
  }
  for (const file of files) {
    const fileError = validateProjectImageFile(file)
    if (fileError) {
      screenshotError.value = `${file.name}: ${fileError}`
      return
    }
  }

  const version = formVersion
  screenshotError.value = ''
  screenshotsUploading.value = true
  try {
    for (const file of files) {
      const image = await uploadApi.image(file)
      if (version !== formVersion) {
        return
      }
      if (
        form.screenshots.length < SCREENSHOT_LIMIT &&
        !form.screenshots.includes(image.url)
      ) {
        form.screenshots.push(image.url)
      }
    }
  } catch (cause) {
    if (version === formVersion) {
      screenshotError.value = getErrorMessage(cause)
    }
  } finally {
    if (version === formVersion) {
      screenshotsUploading.value = false
    }
  }
}

function handleScreenshotsChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  void uploadScreenshots(files)
}

function handleScreenshotsDrop(event: DragEvent): void {
  if (screenshotsUploading.value || submitting.value) {
    return
  }
  const files = Array.from(event.dataTransfer?.files ?? [])
  void uploadScreenshots(files)
}

function removeScreenshot(index: number): void {
  form.screenshots.splice(index, 1)
  screenshotError.value = ''
}

function restoreDefaultCover(): void {
  form.coverImage = DEFAULT_COVER
  errors.coverImage = ''
  coverBroken.value = false
}

function buildPayload(): ProjectDraftInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase(),
    tagline: form.tagline.trim(),
    coverImage: form.coverImage.trim(),
    screenshots: [...form.screenshots],
    techStack: [...form.techStack],
    status: form.status,
    needs: [...form.needs],
    teamName: form.teamName.trim() || undefined,
    githubUrl: form.githubUrl.trim() || undefined,
    demoUrl: form.demoUrl.trim() || undefined,
    readme: form.readme.trim(),
  }
}

async function submit(): Promise<void> {
  if (submitting.value) {
    return
  }
  submitError.value = ''
  if (coverUploading.value || screenshotsUploading.value) {
    submitError.value = '图片上传完成后再提交审核'
    return
  }
  if (!validate()) {
    return
  }
  if (isEdit.value && (!Number.isFinite(editId.value) || editId.value <= 0)) {
    submitError.value = '项目编号无效'
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await myStore.update(editId.value, buildPayload())
      toastStore.success('项目已重新提交审核')
    } else {
      await myStore.create(buildPayload())
      toastStore.success('项目已提交审核')
    }
    await router.push({ name: 'my-projects' })
  } catch (cause) {
    submitError.value = getErrorMessage(cause)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.project-editor-page {
  padding-top: 0;
}

.page-back {
  margin: 0 0 9px;
}

.page-back a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 11px;
}

.page-back a:hover {
  color: var(--link-hover);
}

.editor-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
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

.editor-head h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.editor-head p {
  max-width: 700px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 292px;
  gap: 14px;
  align-items: start;
}

.editor-form {
  overflow: hidden;
}

.review-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.review-banner > svg {
  flex: 0 0 auto;
  margin-top: 2px;
}

.review-banner div {
  min-width: 0;
}

.review-banner strong {
  display: block;
  margin-bottom: 2px;
  color: var(--text);
  font-size: 11.5px;
  font-weight: 600;
}

.review-banner p {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.6;
}

.review-banner.rejected {
  border-bottom-color: #e7c8c8;
  background: #fdf7f7;
  color: var(--danger);
}

.review-banner.rejected strong {
  color: var(--danger);
}

.review-banner.rejected p {
  color: var(--text-secondary);
}

.review-banner.approved {
  border-bottom-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.review-banner.pending {
  border-bottom-color: #ead9b8;
  background: #fdf8ed;
  color: #8a6521;
}

.form-section {
  border-bottom: 1px solid var(--border);
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 17px 9px;
}

.section-head h2 {
  margin: 0;
  color: var(--text);
  font-size: 13.5px;
  font-weight: 650;
}

.section-note {
  flex: 0 0 auto;
  color: var(--text-faint);
  font-size: 9.5px;
}

.form-section > .field-group,
.field-row {
  padding: 0 17px 14px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field-row .field-group {
  padding: 0;
}

.field-group {
  min-width: 0;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
}

.required-mark {
  color: var(--brand-hover);
}

.field-hint {
  margin: 0 0 7px;
  color: var(--text-muted);
  font-size: 10.5px;
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
  font-size: 12.5px;
}

.text-field:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.text-field::placeholder {
  color: var(--text-faint);
}

.select-field {
  cursor: pointer;
}

.field-footer {
  display: flex;
  min-height: 17px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.field-footer .field-hint {
  margin: 0;
}

.field-counter {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--text-faint);
  font-size: 9.5px;
}

.field-error {
  color: var(--danger);
  font-size: 10px;
}

.slug-field {
  display: flex;
  height: 36px;
  align-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
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
  font-size: 10.5px;
}

.slug-field input {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 9px 0 2px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12px;
}

.slug-field input::placeholder {
  color: var(--text-faint);
}

.image-section {
  padding: 2px 17px 16px;
}

.image-section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.image-section-title .field-label {
  margin-bottom: 2px;
}

.image-section-title .field-hint {
  max-width: 520px;
  margin: 0;
}

.cover-limit {
  flex: 0 0 auto;
  padding-top: 2px;
  color: var(--text-faint);
  font-size: 9.5px;
}

.cover-editor {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cover-preview {
  position: relative;
  display: flex;
  width: 196px;
  aspect-ratio: 16 / 10;
  flex: 0 0 196px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-faint);
}

.cover-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-preview.uploading img {
  opacity: 0.45;
}

.cover-uploading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-secondary);
  font-size: 10.5px;
}

.cover-fallback {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
}

.cover-field {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding-top: 2px;
}

.cover-description {
  margin: 0 0 9px;
  color: var(--text-muted);
  font-size: 10.5px;
  line-height: 1.6;
}

.cover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 8px;
}

.cover-field .field-hint {
  margin: 0;
}

.file-input {
  display: none;
}

.image-error {
  margin: 4px 0 0;
  color: var(--danger);
  font-size: 10px;
  line-height: 1.55;
}

.screenshot-block {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.screenshot-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.screenshot-head .field-label {
  margin-bottom: 2px;
}

.screenshot-head .field-hint {
  margin: 0;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.screenshot-item {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
}

.screenshot-item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screenshot-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  background: rgba(32, 33, 36, 0.68);
  color: #ffffff;
}

.screenshot-remove:hover:not(:disabled) {
  border-color: var(--danger);
  background: var(--danger);
}

.screenshot-remove:disabled {
  opacity: 0.5;
}

.screenshot-add {
  display: flex;
  min-height: 0;
  aspect-ratio: 16 / 10;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px;
  border: 1px dashed var(--border-strong);
  border-radius: 3px;
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.screenshot-add:hover:not(:disabled) {
  border-color: var(--brand);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.screenshot-add span {
  font-size: 10px;
  font-weight: 600;
}

.screenshot-add small {
  color: var(--text-faint);
  font-size: 9px;
}

.screenshot-add:disabled {
  opacity: 0.65;
}

.spin {
  animation: editor-spin 0.8s linear infinite;
}

@keyframes editor-spin {
  to {
    transform: rotate(360deg);
  }
}

.status-hint {
  margin: 5px 0 0;
  min-height: 17px;
}

.need-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.need-option {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  text-align: left;
}

.need-option:hover {
  border-color: var(--border-strong);
  background: var(--surface-subtle);
}

.need-option.active {
  border-color: var(--brand-border);
  background: var(--brand-soft);
}

.need-icon {
  display: inline-flex;
  width: 27px;
  height: 27px;
  flex: 0 0 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
}

.need-option.active .need-icon {
  border-color: var(--brand-border);
  color: var(--brand-hover);
}

.need-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.need-copy strong {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.need-copy small {
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.need-check {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--brand-hover);
}

.tech-editor {
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

.tech-editor:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.tech-editor.invalid {
  border-color: var(--danger);
}

.tech-token {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 22px;
  padding: 2px 4px 2px 7px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 10.5px;
}

.remove-tech {
  display: inline-flex;
  padding: 2px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
}

.remove-tech:hover {
  color: var(--danger);
}

.tech-editor input {
  min-width: 110px;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 11.5px;
}

.tech-editor input::placeholder {
  color: var(--text-faint);
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
  min-height: 300px;
  padding: 11px 12px;
  resize: vertical;
  border: 0;
  border-radius: 3px;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.7;
}

.body-textarea::placeholder {
  color: var(--text-faint);
}

.body-preview {
  min-height: 300px;
  padding: 15px;
}

.preview-empty {
  margin: 0;
  color: var(--text-faint);
  font-size: 12px;
}

.submit-error {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 13px 17px 0;
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
  padding: 13px 17px;
  background: var(--surface-subtle);
}

.submit-button {
  min-width: 160px;
}

.editor-side {
  position: sticky;
  top: calc(var(--header-height) + 20px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-panel {
  overflow: hidden;
}

.review-steps {
  display: flex;
  margin: 0;
  padding: 11px 12px 12px;
  flex-direction: column;
  gap: 9px;
  list-style: none;
}

.review-steps li {
  display: flex;
  gap: 8px;
}

.step-mark {
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
}

.review-steps li.done .step-mark {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.review-steps li.rejected .step-mark {
  border-color: #e7c8c8;
  background: #fdf4f4;
  color: var(--danger);
}

.review-steps strong {
  display: block;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.review-steps p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.55;
}

.review-dates {
  margin: 0;
  padding: 3px 12px 7px;
  border-top: 1px solid var(--border);
}

.review-dates > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 5px 0;
}

.review-dates dt {
  color: var(--text-faint);
  font-size: 9.5px;
}

.review-dates dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 9.5px;
}

.tips-list {
  margin: 0;
  padding: 9px 12px 12px 26px;
  color: var(--text-muted);
  font-size: 10px;
  line-height: 1.65;
}

.tips-list li {
  margin-bottom: 4px;
}

.tips-list li:last-child {
  margin-bottom: 0;
}

.editor-loading {
  padding: 16px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.loading-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loading-line {
  width: 100%;
  height: 10px;
}

.loading-line.short {
  width: 32%;
}

.loading-input {
  width: 100%;
  height: 36px;
}

.loading-input.tall {
  height: 120px;
}

.page-state {
  overflow: hidden;
}

@media (max-width: 1040px) {
  .editor-layout {
    grid-template-columns: minmax(0, 1fr) 260px;
  }

  .cover-preview {
    width: 168px;
    flex-basis: 168px;
  }
}

@media (max-width: 900px) {
  .editor-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .editor-side {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .editor-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .editor-head h1 {
    font-size: 23px;
  }

  .field-row,
  .need-options,
  .loading-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .section-head,
  .form-section > .field-group,
  .field-row,
  .image-section {
    padding-left: 13px;
    padding-right: 13px;
  }

  .section-note,
  .cover-limit {
    display: none;
  }

  .cover-editor {
    flex-direction: column;
  }

  .cover-preview {
    width: 100%;
    flex-basis: auto;
  }

  .screenshot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-actions {
    padding-left: 13px;
    padding-right: 13px;
  }

  .editor-side {
    grid-template-columns: minmax(0, 1fr);
  }

  .label-row {
    flex-direction: column;
    gap: 7px;
  }

  .editor-mode {
    align-self: flex-end;
  }

  .body-textarea {
    min-height: 240px;
  }

  .submit-button {
    min-width: 0;
  }
}
</style>
