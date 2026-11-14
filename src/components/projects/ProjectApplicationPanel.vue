<template>
  <section class="panel application-panel" aria-labelledby="application-title">
    <div class="panel-header">
      <h2 id="application-title" class="panel-title">
        <UserPlus :size="14" aria-hidden="true" />
        组队申请
      </h2>
      <span v-if="viewerApplication" class="panel-note">{{
        STATUS_META[viewerApplication.status].label
      }}</span>
      <span v-else-if="isOwner" class="panel-note">你是项目负责人</span>
    </div>

    <div class="application-body">
      <div v-if="isOwner" class="application-state">
        <p class="state-line">
          负责人可以在这里查看申请, 接受后申请人会加入成员列表. 处理结果会通知申请人.
        </p>
        <RouterLink
          class="btn btn-primary btn-sm state-action"
          :to="{ name: 'my-project-applications', params: { id: project.id } }"
        >
          <ClipboardCheck :size="12" />
          管理组队申请
        </RouterLink>
      </div>

      <div
        v-else-if="viewerApplication?.status === 'accepted' || isMember"
        class="application-state"
      >
        <p class="state-line joined">
          <CheckCircle2 :size="13" aria-hidden="true" />
          已加入项目
        </p>
        <p class="state-hint">你已经是这个项目的成员, 可以在工作台参与项目维护.</p>
      </div>

      <div v-else-if="viewerApplication?.status === 'pending'" class="application-state">
        <p class="state-line pending">
          <Clock3 :size="13" aria-hidden="true" />
          申请审核中
        </p>
        <p class="state-hint">
          你在 {{ formatRelativeTime(viewerApplication.createdAt) }} 提交了申请, 想参与
          {{ viewerApplication.focus }}. 负责人处理后会通知你.
        </p>
        <dl class="state-meta">
          <div>
            <dt>相关技能</dt>
            <dd>
              <span v-for="skill in viewerApplication.skills" :key="skill" class="skill-chip">
                {{ skill }}
              </span>
            </dd>
          </div>
          <div>
            <dt>自我介绍</dt>
            <dd class="state-message">{{ viewerApplication.message }}</dd>
          </div>
        </dl>
      </div>

      <div v-else-if="viewerApplication?.status === 'rejected'" class="application-state rejected">
        <p class="state-line rejected">
          <XCircle :size="13" aria-hidden="true" />
          申请未通过
        </p>
        <p class="state-hint">
          {{ formatRelativeTime(viewerApplication.updatedAt) }} 处理, 想参与的模块:
          {{ viewerApplication.focus }}.
        </p>
        <p v-if="viewerApplication.reviewNote" class="review-note">
          <strong>负责人原因</strong>
          {{ viewerApplication.reviewNote }}
        </p>
      </div>

      <div v-else-if="!needsTeammates" class="application-state">
        <p class="state-line">这个项目当前不招募队友.</p>
        <a
          v-if="contactUrl"
          class="btn btn-secondary btn-sm state-action"
          :href="contactUrl"
          target="_blank"
          rel="noreferrer noopener"
        >
          在 GitHub 参与讨论
          <ExternalLink :size="12" />
        </a>
      </div>

      <form
        v-else
        class="application-form"
        novalidate
        :aria-busy="submitting"
        @submit.prevent="submit"
      >
        <p class="form-guide">填写想参与的模块和可投入时间, 负责人会在工作台处理你的申请.</p>

        <div class="form-field">
          <label class="field-label" for="application-focus">
            想参与的模块
            <span class="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="application-focus"
            v-model="form.focus"
            class="text-field"
            type="text"
            maxlength="40"
            placeholder="例如: 后端接口与消息通知"
            :aria-invalid="Boolean(errors.focus)"
            aria-describedby="application-focus-help"
          />
          <div id="application-focus-help" class="field-footer">
            <span v-if="errors.focus" class="field-error">{{ errors.focus }}</span>
            <span v-else class="field-hint">2-40 个字符</span>
            <span class="field-counter">{{ form.focus.length }}/40</span>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label" for="application-skill">相关技能</label>
          <div class="skill-editor">
            <div v-if="form.skills.length" class="skill-list">
              <span v-for="(skill, index) in form.skills" :key="skill" class="skill-chip removable">
                {{ skill }}
                <button
                  class="skill-remove"
                  type="button"
                  :aria-label="`删除技能 ${skill}`"
                  @click="removeSkill(index)"
                >
                  <X :size="10" />
                </button>
              </span>
            </div>
            <div class="skill-input-row">
              <input
                id="application-skill"
                v-model="skillDraft"
                class="text-field"
                type="text"
                maxlength="24"
                placeholder="输入技能后按回车添加"
                :aria-invalid="Boolean(errors.skills)"
                aria-describedby="application-skill-help"
                @keydown.enter.prevent="addSkill"
              />
              <button class="btn btn-secondary btn-sm" type="button" @click="addSkill">添加</button>
            </div>
          </div>
          <div id="application-skill-help" class="field-footer">
            <span v-if="errors.skills" class="field-error">{{ errors.skills }}</span>
            <span v-else class="field-hint">1-8 项, 每项 2-24 个字符, 支持添加和删除</span>
            <span class="field-counter">{{ form.skills.length }}/8</span>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label" for="application-message">
            自我介绍与可投入时间
            <span class="required-mark" aria-hidden="true">*</span>
          </label>
          <textarea
            id="application-message"
            v-model="form.message"
            class="text-area"
            rows="6"
            maxlength="1000"
            placeholder="介绍你的相关经历, 每周可投入的时间, 以及希望达成的目标."
            :aria-invalid="Boolean(errors.message)"
            aria-describedby="application-message-help"
          />
          <div id="application-message-help" class="field-footer">
            <span v-if="errors.message" class="field-error">{{ errors.message }}</span>
            <span v-else class="field-hint">20-1000 个字符</span>
            <span class="field-counter">{{ form.message.length }}/1000</span>
          </div>
        </div>

        <p v-if="formError" class="form-error" role="alert">
          <AlertCircle :size="12" aria-hidden="true" />
          {{ formError }}
        </p>

        <div class="form-actions">
          <button class="btn btn-primary btn-sm" type="submit" :disabled="submitting">
            <Send :size="12" />
            {{ submitting ? '正在提交...' : '提交组队申请' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Send,
  UserPlus,
  X,
  XCircle,
} from 'lucide-vue-next'
import { projectApi } from '@/api/projects'
import type {
  ProjectApplication,
  ProjectApplicationInput,
  ProjectApplicationStatus,
  ProjectDetail,
} from '@/api/types'
import { useNotificationStore } from '@/stores/notifications'
import { useProjectStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatRelativeTime } from '@/utils/format'

const props = defineProps<{
  project: ProjectDetail
}>()

const projectStore = useProjectStore()
const sessionStore = useSessionStore()
const toastStore = useToastStore()
const notificationStore = useNotificationStore()

const STATUS_META: Record<ProjectApplicationStatus, { label: string }> = {
  pending: { label: '审核中' },
  accepted: { label: '已通过' },
  rejected: { label: '未通过' },
}

const submitting = ref(false)
const skillDraft = ref('')
const formError = ref('')
const errors = reactive({ focus: '', skills: '', message: '' })
const form = reactive<ProjectApplicationInput>({ skills: [], focus: '', message: '' })

const submittedApplication = ref<ProjectApplication | null>(null)
const viewerApplication = computed<ProjectApplication | null>(
  () => submittedApplication.value ?? props.project.viewerApplication ?? null,
)
const needsTeammates = computed(() => props.project.needs.includes('teammates'))
const viewerHandle = computed(() => sessionStore.user?.handle ?? null)
const isOwner = computed(() => viewerHandle.value === props.project.owner.handle)
const isMember = computed(() =>
  props.project.members.some((member) => member.user.handle === viewerHandle.value),
)
const contactUrl = computed(() => props.project.githubUrl ?? '')

watch(
  () => props.project.id,
  () => {
    submittedApplication.value = null
    form.focus = ''
    form.skills = []
    form.message = ''
    skillDraft.value = ''
    formError.value = ''
    errors.focus = ''
    errors.skills = ''
    errors.message = ''
  },
)

function addSkill(): void {
  const value = skillDraft.value.trim()
  if (!value) {
    return
  }
  if (value.length < 2 || value.length > 24) {
    errors.skills = '每项技能需要 2-24 个字符'
    return
  }
  if (form.skills.length >= 8) {
    errors.skills = '最多添加 8 项技能'
    return
  }
  if (form.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
    errors.skills = '这项技能已经添加'
    return
  }
  form.skills.push(value)
  skillDraft.value = ''
  errors.skills = ''
}

function removeSkill(index: number): void {
  form.skills.splice(index, 1)
  errors.skills = ''
}

function validate(): boolean {
  errors.focus = ''
  errors.skills = ''
  errors.message = ''
  formError.value = ''

  const focus = form.focus.trim()
  const message = form.message.trim()

  if (focus.length < 2 || focus.length > 40) {
    errors.focus = '想参与的模块需要 2-40 个字符'
  }
  if (form.skills.length < 1) {
    errors.skills = '请至少添加一项相关技能'
  }
  if (message.length < 20 || message.length > 1000) {
    errors.message = '自我介绍需要 20-1000 个字符'
  }

  return !errors.focus && !errors.skills && !errors.message
}

async function submit(): Promise<void> {
  if (submitting.value) {
    return
  }
  if (skillDraft.value.trim()) {
    addSkill()
    if (errors.skills) {
      return
    }
  }
  if (!validate()) {
    return
  }

  submitting.value = true
  formError.value = ''
  try {
    const created = await projectApi.apply(props.project.id, {
      focus: form.focus.trim(),
      skills: [...form.skills],
      message: form.message.trim(),
    })
    submittedApplication.value = created
    if (projectStore.current?.id === created.projectId) {
      projectStore.current = {
        ...projectStore.current,
        viewerApplication: created,
      }
    }
    form.focus = ''
    form.skills = []
    form.message = ''
    toastStore.success('组队申请已提交, 等待负责人处理')
    void notificationStore.refreshUnread()
  } catch (cause) {
    formError.value = getErrorMessage(cause)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.application-panel {
  overflow: hidden;
}

.application-body {
  padding: 11px 12px 12px;
}

.application-state {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.state-line {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.55;
}

.state-line.joined {
  color: var(--accepted);
}

.state-line.pending {
  color: var(--brand-hover);
}

.state-line.rejected {
  color: var(--danger);
}

.state-hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.6;
}

.state-action {
  width: 100%;
  margin-top: 3px;
}

.state-meta {
  display: flex;
  margin: 2px 0 0;
  flex-direction: column;
  gap: 7px;
}

.state-meta dt {
  margin-bottom: 2px;
  color: var(--text-faint);
  font-size: 9px;
}

.state-meta dd {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 10px;
  line-height: 1.6;
}

.state-message {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.review-note {
  margin: 2px 0 0;
  padding: 6px 8px;
  border: 1px solid #e7c8c8;
  border-radius: 2px;
  background: #fdf7f7;
  color: var(--text-secondary);
  font-size: 9.5px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.review-note strong {
  display: block;
  margin-bottom: 1px;
  color: var(--danger);
  font-weight: 600;
}

.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-size: 9px;
  line-height: 1.5;
}

.skill-chip.removable {
  padding-right: 2px;
}

.skill-remove {
  display: inline-flex;
  width: 14px;
  height: 14px;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--text-faint);
  cursor: pointer;
}

.skill-remove:hover {
  color: var(--danger);
}

.application-form {
  display: flex;
  flex-direction: column;
}

.form-guide {
  margin: 0 0 10px;
  color: var(--text-muted);
  font-size: 9.5px;
  line-height: 1.6;
}

.form-field + .form-field {
  margin-top: 10px;
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

.text-field,
.text-area {
  display: block;
  width: 100%;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  outline: 0;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 10.5px;
  line-height: 1.6;
}

.text-field {
  min-height: 30px;
  padding: 5px 7px;
}

.text-area {
  min-height: 116px;
  padding: 7px;
  resize: vertical;
}

.text-field:focus,
.text-area:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.text-field::placeholder,
.text-area::placeholder {
  color: var(--text-faint);
}

.text-field[aria-invalid='true'],
.text-area[aria-invalid='true'] {
  border-color: var(--danger);
}

.skill-editor {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-input-row {
  display: flex;
  gap: 5px;
}

.skill-input-row .text-field {
  min-width: 0;
  flex: 1;
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

.field-counter {
  flex: 0 0 auto;
  font-family: var(--font-mono);
}

.form-error {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 9px 0 0;
  padding: 6px 8px;
  border: 1px solid #e5c1c1;
  border-radius: 2px;
  background: #fff7f7;
  color: var(--danger);
  font-size: 9.5px;
  line-height: 1.5;
}

.form-actions {
  display: flex;
  gap: 6px;
  margin-top: 11px;
}

.form-actions .btn {
  width: 100%;
  justify-content: center;
}

@media (max-width: 900px) {
  .application-body {
    padding: 12px 13px 13px;
  }

  .text-area {
    min-height: 104px;
  }
}
</style>
