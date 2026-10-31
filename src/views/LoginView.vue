<template>
  <div class="page-container login-page">
    <div class="login-layout">
      <section class="login-story" aria-labelledby="login-story-title">
        <div class="story-eyebrow">
          <span class="story-mark" aria-hidden="true" />
          CAMPUS DEVELOPER NETWORK
        </div>
        <h1 id="login-story-title">把问题问清楚,<br />把答案留下来.</h1>
        <p class="story-intro">
          SWStack 连接正在写代码的校园开发者. 从一段报错开始, 找到可复现的步骤, 可验证的答案, 和愿意继续讨论的人.
        </p>

        <div class="story-stats" aria-label="社区数据">
          <div class="story-stat">
            <strong>{{ formatCompact(communityStore.stats?.questionCount ?? 0) }}</strong>
            <span>个问题</span>
          </div>
          <div class="story-stat">
            <strong>{{ formatCompact(communityStore.stats?.answerCount ?? 0) }}</strong>
            <span>个回答</span>
          </div>
          <div class="story-stat">
            <strong>{{ formatCompact(communityStore.stats?.developerCount ?? 0) }}</strong>
            <span>位开发者</span>
          </div>
        </div>

        <ol class="story-points">
          <li>
            <span class="point-index">01</span>
            <div>
              <strong>先搜索, 再提问</strong>
              <p>很多问题已经有人遇到. 先读现有讨论, 再补充新的上下文.</p>
            </div>
          </li>
          <li>
            <span class="point-index">02</span>
            <div>
              <strong>让问题可以被复现</strong>
              <p>写清环境, 报错和尝试过的方案. 好问题本身就是一半答案.</p>
            </div>
          </li>
          <li>
            <span class="point-index">03</span>
            <div>
              <strong>回答也留下推理过程</strong>
              <p>不只贴最终代码. 说明为什么这样改, 以及边界在哪里.</p>
            </div>
          </li>
        </ol>

        <p class="story-note">校内邀请制社区. 账号由学院或社区管理员分配.</p>
      </section>

      <section class="login-panel panel" aria-labelledby="login-title">
        <header class="login-head">
          <div class="login-eyebrow">SIGN IN</div>
          <h2 id="login-title">登录 SWStack</h2>
          <p>继续参与问题讨论, 管理社区内容.</p>
        </header>

        <form class="login-form" novalidate @submit.prevent="submit">
          <div class="login-field">
            <label for="login-email">邮箱</label>
            <div class="login-input" :class="{ invalid: Boolean(errors.email) }">
              <Mail :size="15" aria-hidden="true" />
              <input
                id="login-email"
                v-model="email"
                type="email"
                autocomplete="username"
                placeholder="name@swstack.dev"
                :aria-invalid="Boolean(errors.email)"
                aria-describedby="email-error"
              />
            </div>
            <span v-if="errors.email" id="email-error" class="field-error">{{ errors.email }}</span>
          </div>

          <div class="login-field">
            <label for="login-password">密码</label>
            <div class="login-input" :class="{ invalid: Boolean(errors.password) }">
              <LockKeyhole :size="15" aria-hidden="true" />
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="输入登录密码"
                :aria-invalid="Boolean(errors.password)"
                aria-describedby="password-error"
              />
              <button
                class="password-toggle"
                type="button"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="15" />
                <Eye v-else :size="15" />
              </button>
            </div>
            <span v-if="errors.password" id="password-error" class="field-error">
              {{ errors.password }}
            </span>
          </div>

          <div class="login-options">
            <label class="remember-option">
              <input v-model="remember" type="checkbox" />
              <span>保持登录</span>
            </label>
            <span class="secure-note">
              <ShieldCheck :size="13" aria-hidden="true" />
              校内账号
            </span>
          </div>

          <div v-if="formError" class="login-error" role="alert">
            <AlertCircle :size="15" />
            {{ formError }}
          </div>

          <button class="btn btn-primary login-submit" type="submit" :disabled="submitting">
            <span>{{ submitting ? '登录中...' : '登录' }}</span>
            <ArrowRight v-if="!submitting" :size="15" />
          </button>
        </form>

        <div class="demo-divider"><span>演示账号</span></div>

        <div class="demo-accounts">
          <button
            v-for="account in demoAccounts"
            :key="account.email"
            class="demo-account"
            type="button"
            @click="fillDemo(account.email, account.password)"
          >
            <span class="demo-avatar" :class="{ admin: account.role === 'admin' }">
              <ShieldCheck v-if="account.role === 'admin'" :size="14" />
              <UserRound v-else :size="14" />
            </span>
            <span class="demo-copy">
              <strong>{{ account.label }}</strong>
              <span>{{ account.email }} / {{ account.password }}</span>
            </span>
            <span class="demo-fill">填入</span>
          </button>
        </div>

        <p class="login-footnote">
          当前为演示环境, 数据仅保存在浏览器中.
          <RouterLink class="login-guide-link" to="/welcome">查看新手指南</RouterLink>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import { useCommunityStore } from '@/stores/community'
import { useSessionStore } from '@/stores/session'
import { useToastStore } from '@/stores/toast'
import { getErrorMessage } from '@/utils/errors'
import { formatCompact } from '@/utils/format'

type DemoRole = 'admin' | 'member'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const communityStore = useCommunityStore()
const toastStore = useToastStore()

const email = ref('')
const password = ref('')
const remember = ref(true)
const showPassword = ref(false)
const submitting = ref(false)
const formError = ref('')
const errors = reactive({
  email: '',
  password: '',
})

const demoAccounts: Array<{
  label: string
  email: string
  password: string
  role: DemoRole
}> = [
  {
    label: '管理员',
    email: 'admin@swstack.dev',
    password: 'admin123',
    role: 'admin',
  },
  {
    label: '学生账号',
    email: 'student@swstack.dev',
    password: 'student123',
    role: 'member',
  },
]

function fillDemo(nextEmail: string, nextPassword: string): void {
  email.value = nextEmail
  password.value = nextPassword
  errors.email = ''
  errors.password = ''
  formError.value = ''
}

function validate(): boolean {
  errors.email = ''
  errors.password = ''
  const trimmed = email.value.trim()
  if (!trimmed) {
    errors.email = '请输入邮箱'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    errors.email = '邮箱格式不正确'
  }
  if (!password.value) {
    errors.password = '请输入密码'
  } else if (password.value.length < 6) {
    errors.password = '密码至少需要 6 个字符'
  }
  return !errors.email && !errors.password
}

function redirectTarget(): string {
  const raw = route.query.redirect
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw
  }
  return sessionStore.isAdmin ? '/admin' : '/'
}

async function submit(): Promise<void> {
  if (submitting.value || !validate()) {
    return
  }

  submitting.value = true
  formError.value = ''
  try {
    const user = await sessionStore.login({
      email: email.value.trim(),
      password: password.value,
      remember: remember.value,
    })
    toastStore.success(`欢迎回来, ${user.name}`)
    await router.replace(redirectTarget())
  } catch (cause) {
    formError.value = getErrorMessage(cause)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  padding-top: 14px;
  padding-bottom: 10px;
}

.login-layout {
  display: grid;
  max-width: 1040px;
  margin: 0 auto;
  grid-template-columns: minmax(0, 1fr) 388px;
  gap: 34px;
  align-items: stretch;
}

.login-story {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 18px 10px 18px 0;
}

.story-eyebrow,
.login-eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.1em;
}

.story-mark {
  width: 5px;
  height: 5px;
  background: var(--brand);
}

.login-story h1 {
  margin: 15px 0 12px;
  color: var(--text);
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -1.1px;
  line-height: 1.22;
}

.story-intro {
  max-width: 480px;
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.75;
}

.story-stats {
  display: flex;
  margin: 24px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.story-stat {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  padding: 12px 16px;
}

.story-stat + .story-stat {
  border-left: 1px solid var(--border);
}

.story-stat strong {
  color: var(--text);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.4px;
  line-height: 1.2;
}

.story-stat span {
  color: var(--text-faint);
  font-size: 10.5px;
}

.story-points {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 13px;
  list-style: none;
}

.story-points li {
  display: flex;
  gap: 13px;
}

.point-index {
  width: 22px;
  flex: 0 0 22px;
  padding-top: 1px;
  color: var(--brand-hover);
  font-family: var(--font-mono);
  font-size: 10px;
}

.story-points strong {
  display: block;
  margin-bottom: 2px;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 600;
}

.story-points p {
  margin: 0;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.65;
}

.story-note {
  margin: auto 0 0;
  padding-top: 22px;
  color: var(--text-faint);
  font-size: 10.5px;
}

.login-panel {
  overflow: hidden;
  align-self: start;
}

.login-head {
  padding: 22px 22px 16px;
}

.login-head h2 {
  margin: 9px 0 4px;
  color: var(--text);
  font-size: 23px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.login-head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.login-form {
  display: flex;
  padding: 0 22px 19px;
  flex-direction: column;
  gap: 14px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.login-field label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.login-input {
  display: flex;
  height: 37px;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-faint);
}

.login-input:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.login-input.invalid {
  border-color: var(--danger);
}

.login-input input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
}

.login-input input::placeholder {
  color: var(--text-faint);
}

.password-toggle {
  display: inline-flex;
  padding: 2px;
  border: 0;
  background: transparent;
  color: var(--text-faint);
}

.password-toggle:hover {
  color: var(--text-secondary);
}

.field-error {
  color: var(--danger);
  font-size: 10.5px;
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: -2px;
}

.remember-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 11.5px;
}

.remember-option input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: var(--brand);
}

.secure-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-faint);
  font-size: 10px;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 9px;
  border: 1px solid #e5c1c1;
  border-radius: 3px;
  background: #fff7f7;
  color: var(--danger);
  font-size: 11px;
}

.login-submit {
  width: 100%;
  height: 37px;
  justify-content: center;
  gap: 6px;
  margin-top: 2px;
}

.demo-divider {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 22px;
  color: var(--text-faint);
  font-size: 10px;
}

.demo-divider::before,
.demo-divider::after {
  height: 1px;
  flex: 1;
  background: var(--border);
  content: '';
}

.demo-accounts {
  display: flex;
  padding: 11px 22px 0;
  flex-direction: column;
  gap: 6px;
}

.demo-account {
  display: flex;
  min-height: 43px;
  align-items: center;
  gap: 9px;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  text-align: left;
}

.demo-account:hover {
  border-color: var(--border-strong);
  background: var(--surface-muted);
}

.demo-avatar {
  display: inline-flex;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  color: var(--text-muted);
}

.demo-avatar.admin {
  border-color: var(--brand-border);
  background: var(--brand-soft);
  color: var(--brand-hover);
}

.demo-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.demo-copy strong {
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 600;
}

.demo-copy span {
  overflow: hidden;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-fill {
  flex: 0 0 auto;
  color: var(--link);
  font-size: 10.5px;
}

.login-footnote {
  margin: 12px 22px 18px;
  color: var(--text-faint);
  font-size: 10px;
  line-height: 1.55;
  text-align: center;
}

.login-guide-link {
  margin-left: 3px;
  font-size: inherit;
}

@media (max-width: 920px) {
  .login-layout {
    max-width: 460px;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
  }

  .login-panel {
    order: 1;
  }

  .login-story {
    order: 2;
    padding: 4px 2px 8px;
  }

  .login-story h1 {
    margin-top: 12px;
    font-size: 27px;
  }

  .story-stats {
    margin: 17px 0;
  }

  .story-note {
    padding-top: 16px;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding-top: 0;
  }

  .login-layout {
    gap: 0;
  }

  .login-story {
    display: none;
  }

  .login-head,
  .login-form {
    padding-left: 16px;
    padding-right: 16px;
  }

  .login-head {
    padding-top: 18px;
  }

  .demo-divider {
    padding: 0 16px;
  }

  .demo-accounts {
    padding-left: 16px;
    padding-right: 16px;
  }

  .login-footnote {
    margin-left: 16px;
    margin-right: 16px;
  }
}
</style>
