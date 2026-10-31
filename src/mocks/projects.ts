import type {
  AdminProject,
  AdminProjectDetail,
  AdminProjectVisibility,
  MyProject,
  ProjectDetail,
  ProjectDraftInput,
  ProjectEditData,
  ProjectMember,
  ProjectNeed,
  ProjectReviewStatus,
  ProjectStatus,
  ProjectSummary,
  ProjectUpdate,
  UserSummary,
} from '@/api/types'
import { users } from './data'

interface MemberSeed {
  handle: string
  role: string
}

interface UpdateSeed {
  title: string
  body: string
  daysAgo: number
  author: string
}

export interface ProjectSeed {
  id: number
  slug: string
  name: string
  tagline: string
  coverImage: string
  screenshots?: string[]
  techStack: string[]
  status: ProjectStatus
  needs: ProjectNeed[]
  ownerHandle: string
  teamName?: string
  githubUrl?: string
  demoUrl?: string
  readme: string
  isFeatured: boolean
  createdDaysAgo: number
  members: MemberSeed[]
  updates: UpdateSeed[]
}

const now = Date.now()

function daysAgo(days: number): string {
  return new Date(now - days * 86_400_000).toISOString()
}

function userByHandle(handle: string): UserSummary {
  return users.find((user) => user.handle === handle) ?? users[0]
}

export const projectSeeds: ProjectSeed[] = [
  {
    id: 1,
    slug: 'campus-flow',
    name: 'CampusFlow',
    tagline: '把课程项目拆成可追踪的任务, 让小组不用再靠群聊确认进度.',
    coverImage: '/projects/campus-flow.svg',
    techStack: ['Vue 3', 'TypeScript', 'FastAPI', 'PostgreSQL'],
    status: 'building',
    needs: ['feedback', 'teammates'],
    ownerHandle: 'suhe',
    teamName: '青禾工作室',
    githubUrl: 'https://github.com/zincumyu/campus-flow',
    demoUrl: 'https://example.com/campus-flow',
    isFeatured: true,
    createdDaysAgo: 86,
    members: [
      { handle: 'suhe', role: '项目发起人 / 全栈' },
      { handle: 'hejia', role: '后端与数据库' },
      { handle: 'tanyue', role: '交互与视觉' },
      { handle: 'shenyan', role: '数据导入' },
    ],
    updates: [
      {
        title: '完成看板拖拽与筛选',
        body: '任务卡片现在可以跨列拖拽, 支持按负责人和截止时间筛选. 移动端暂时保留列表视图.',
        daysAgo: 2,
        author: 'suhe',
      },
      {
        title: '接入课程空间权限',
        body: '课程空间分为公开和邀请两种模式. 邀请模式需要课程创建者生成一次性链接.',
        daysAgo: 9,
        author: 'hejia',
      },
      {
        title: '第一轮内测反馈',
        body: '收集了 18 份反馈, 主要问题集中在任务重复创建和通知频率. 下一版会先处理去重.',
        daysAgo: 21,
        author: 'suhe',
      },
    ],
    readme: `## 项目简介

CampusFlow 是面向课程小组的项目协作看板. 它把课程项目拆成阶段, 任务和交付物, 让成员知道下一步该做什么.

## 当前进度

- 课程空间与成员邀请已完成
- 任务看板支持拖拽, 筛选和到期提醒
- 正在接入教务课程表导入

## 技术栈

Vue 3 与 TypeScript 构建前端, FastAPI 提供接口, PostgreSQL 存储课程空间与任务数据.

## 本地运行

~~~bash
git clone https://github.com/zincumyu/campus-flow.git
cd campus-flow
npm install
npm run dev
~~~

后端接口约定见 docs/api.md. 本地开发默认使用 Mock 数据.

## 招募

希望找到一位熟悉 PostgreSQL 索引与查询优化的同学, 一起完善课程数据导入. 也欢迎课程助教试用后反馈真实使用场景.`,
  },
  {
    id: 2,
    slug: 'lab-note',
    name: 'LabNote',
    tagline: '面向实验室的轻量实验记录工具, 让参数, 结果和复现步骤待在一起.',
    coverImage: '/projects/lab-note.svg',
    techStack: ['React', 'TypeScript', 'Python', 'SQLite'],
    status: 'beta',
    needs: ['feedback'],
    ownerHandle: 'guyan',
    teamName: '数字媒体实验室',
    githubUrl: 'https://github.com/zincumyu/lab-note',
    demoUrl: 'https://example.com/lab-note',
    isFeatured: false,
    createdDaysAgo: 142,
    members: [
      { handle: 'guyan', role: '项目发起人 / 前端' },
      { handle: 'chenmo', role: '数据模型' },
      { handle: 'xuzhou', role: '编辑器与导出' },
    ],
    updates: [
      {
        title: '实验模板导入完成',
        body: '支持从 YAML 导入实验参数模板. 导入时会校验字段类型, 并保留原始文件快照.',
        daysAgo: 5,
        author: 'guyan',
      },
      {
        title: '修复长文档定位问题',
        body: '目录跳转改为基于块 ID, 不再依赖标题文本. 中文标题重复时也能准确定位.',
        daysAgo: 13,
        author: 'xuzhou',
      },
      {
        title: '新增环境快照',
        body: '每条实验记录可以附一组环境变量和依赖版本, 方便换机器后复现.',
        daysAgo: 27,
        author: 'chenmo',
      },
    ],
    readme: `## 项目简介

LabNote 帮实验室成员把实验目的, 参数, 结果和复现环境记录在同一份文档里. 它刻意保持轻量, 不替代完整的实验管理平台.

## 核心能力

- Markdown 实验记录与目录定位
- YAML 参数模板导入
- 环境变量与依赖版本快照
- 单文件导出与静态归档

## 本地运行

~~~bash
git clone https://github.com/zincumyu/lab-note.git
cd lab-note
npm install
npm run dev
~~~

数据默认写入浏览器 IndexedDB, 也可以在设置中切换到本地服务模式.

## 需要反馈

我们想了解真实实验中哪些信息最容易被遗漏. 如果你正在做需要反复调参的实验, 欢迎试用并提交一次完整记录.`,
  },
  {
    id: 3,
    slug: 'path-finder',
    name: 'PathFinder',
    tagline: '把零散的课程, 项目和技能整理成一条可以执行的学习路线.',
    coverImage: '/projects/path-finder.svg',
    techStack: ['Vue 3', 'TypeScript', 'SQLite', 'D3'],
    status: 'launched',
    needs: ['feedback'],
    ownerHandle: 'linyi',
    teamName: '自学路线组',
    githubUrl: 'https://github.com/zincumyu/path-finder',
    demoUrl: 'https://example.com/path-finder',
    isFeatured: false,
    createdDaysAgo: 210,
    members: [
      { handle: 'linyi', role: '维护者 / 数据' },
      { handle: 'zhaoqing', role: '课程内容' },
      { handle: 'zhouqi', role: '前端体验' },
    ],
    updates: [
      {
        title: '上线 2026 春季课程路线',
        body: '补充了数据结构, 操作系统和分布式系统三条路线, 并标注了先修关系.',
        daysAgo: 7,
        author: 'linyi',
      },
      {
        title: '新增学习进度导出',
        body: '可以把已完成的节点导出为 Markdown, 方便贴进个人笔记或周报.',
        daysAgo: 18,
        author: 'zhouqi',
      },
      {
        title: '补充 12 门课程节点',
        body: '根据培养方案更新了课程名称和学分, 旧链接会自动跳转到新节点.',
        daysAgo: 34,
        author: 'zhaoqing',
      },
    ],
    readme: `## 项目简介

PathFinder 是一张可以逐步完成的学习路线图. 它把课程, 开源项目和练习节点连接起来, 让你知道每个阶段应该补什么.

## 使用方式

1. 选择一条路线, 例如后端开发或系统方向
2. 标记已完成的节点
3. 根据节点建议补充练习或项目
4. 导出进度, 放进自己的学习记录

## 技术说明

路线数据以 YAML 维护, 前端使用 Vue 3 渲染图结构. 节点关系在构建时校验, 避免出现循环依赖.

~~~bash
git clone https://github.com/zincumyu/path-finder.git
cd path-finder
npm install
npm run dev
~~~

## 反馈

欢迎指出路线中的先修关系错误, 或补充你上过且值得推荐的课程. 请在 Issue 中附上课程名称和开课学期.`,
  },
  {
    id: 4,
    slug: 'green-loop',
    name: 'GreenLoop',
    tagline: '校园二手与回收地图, 让闲置物品更快找到下一位使用者.',
    coverImage: '/projects/green-loop.svg',
    techStack: ['Vue 3', 'FastAPI', 'PostgreSQL', 'MapLibre'],
    status: 'building',
    needs: ['teammates'],
    ownerHandle: 'jiangran',
    teamName: '绿色校园',
    githubUrl: 'https://github.com/zincumyu/green-loop',
    demoUrl: 'https://example.com/green-loop',
    isFeatured: true,
    createdDaysAgo: 58,
    members: [
      { handle: 'jiangran', role: '项目发起人 / 运维' },
      { handle: 'tanyue', role: '交互设计' },
      { handle: 'shenyan', role: '数据与回收点' },
      { handle: 'suhe', role: '前端开发' },
    ],
    updates: [
      {
        title: '回收点地图上线',
        body: '首批录入了 24 个校内回收点, 支持按物品类型筛选. 地图样式仍在调整.',
        daysAgo: 3,
        author: 'jiangran',
      },
      {
        title: '接入校园统一登录',
        body: '使用学校账号完成身份校验, 发布闲置时不再需要单独注册.',
        daysAgo: 11,
        author: 'jiangran',
      },
      {
        title: '完成第一轮用户访谈',
        body: '访谈了 9 位同学, 最关心的问题是物品状态可信度和线下交付安全.',
        daysAgo: 24,
        author: 'tanyue',
      },
    ],
    readme: `## 项目简介

GreenLoop 把校园闲置交易和回收点信息放在同一张地图上. 目标不是做更大的二手平台, 而是缩短物品在校园内的流转距离.

## 当前范围

- 校园回收点与开放时间
- 闲置物品发布与状态标记
- 按楼栋和物品类型筛选
- 线下交付地点建议

## 技术栈

前端使用 Vue 3 与 MapLibre, 后端使用 FastAPI 和 PostgreSQL. 地图底图使用校内自托管瓦片.

## 本地运行

~~~bash
git clone https://github.com/zincumyu/green-loop.git
cd green-loop
npm install
npm run dev
~~~

需要复制 .env.example 并填写本地数据库连接.

## 找队友

正在寻找一位愿意持续参与的后端同学, 负责交易状态机和消息通知. 也欢迎熟悉无障碍设计的同学一起改地图交互.`,
  },
  {
    id: 5,
    slug: 'interview-mate',
    name: 'InterviewMate',
    tagline: '用真实题库和计时模拟面试, 帮第一次找实习的同学开口练习.',
    coverImage: '/projects/interview-mate.svg',
    techStack: ['React', 'TypeScript', 'Node.js', 'Redis'],
    status: 'beta',
    needs: ['feedback', 'teammates'],
    ownerHandle: 'zhaoqing',
    teamName: '求职互助组',
    githubUrl: 'https://github.com/zincumyu/interview-mate',
    demoUrl: 'https://example.com/interview-mate',
    isFeatured: false,
    createdDaysAgo: 97,
    members: [
      { handle: 'zhaoqing', role: '项目发起人 / 题库' },
      { handle: 'guyan', role: '前端与录音' },
      { handle: 'luxing', role: '前端工程' },
      { handle: 'zhouqi', role: '题库审核' },
    ],
    updates: [
      {
        title: '题库支持标签筛选',
        body: '可以按语言, 岗位和难度组合筛选, 练习记录会保留最近一次答题时间.',
        daysAgo: 4,
        author: 'zhaoqing',
      },
      {
        title: '新增语音回答计时',
        body: '回答阶段加入倒计时和录音回放, 录音只保存在本地浏览器.',
        daysAgo: 15,
        author: 'guyan',
      },
      {
        title: '完成 20 人内测',
        body: '内测反馈显示, 多数同学更需要追问模拟而不是单题练习. 下一版会增加追问模式.',
        daysAgo: 29,
        author: 'luxing',
      },
    ],
    readme: `## 项目简介

InterviewMate 是一个面向校园求职者的模拟面试练习工具. 题库来自社区成员整理的真实面试记录, 每道题都可以单独练习或组成一轮完整面试.

## 功能

- 按岗位, 语言和难度筛选题目
- 单题计时与语音回答
- 回答记录本地保存
- 面试结束后生成复盘清单

## 本地运行

~~~bash
git clone https://github.com/zincumyu/interview-mate.git
cd interview-mate
npm install
npm run dev
~~~

语音功能需要浏览器麦克风权限. 不上传录音, 不保存原始音频.

## 招募与反馈

希望找到一位熟悉 Node.js 和 Redis 的同学, 一起设计多人模拟面试的房间状态. 也欢迎刚结束实习面试的同学提供题目和追问记录.`,
  },
  {
    id: 6,
    slug: 'swstack-mobile',
    name: 'SWStack Mobile',
    tagline: '把校园问答装进口袋, 在通勤和课间快速处理未读讨论.',
    coverImage: '/projects/swstack-mobile.svg',
    techStack: ['Vue 3', 'TypeScript', 'Capacitor', 'FastAPI'],
    status: 'idea',
    needs: ['teammates'],
    ownerHandle: 'luxing',
    teamName: 'SWStack 核心组',
    githubUrl: 'https://github.com/zincumyu/swstack-mobile',
    demoUrl: 'https://example.com/swstack-mobile',
    isFeatured: false,
    createdDaysAgo: 19,
    members: [
      { handle: 'luxing', role: '项目发起人 / 前端' },
      { handle: 'zhouqi', role: '移动端体验' },
      { handle: 'xuzhou', role: '客户端架构' },
      { handle: 'chenmo', role: '接口适配' },
    ],
    updates: [
      {
        title: '确定移动端信息架构',
        body: '首版只保留问题流, 通知, 收藏和个人页. 发帖与回答放在第二阶段.',
        daysAgo: 6,
        author: 'luxing',
      },
      {
        title: '完成问答列表原型',
        body: '列表采用紧凑卡片, 优先展示标题, 标签和最后活动时间. 详情页保留代码横向滚动.',
        daysAgo: 12,
        author: 'zhouqi',
      },
      {
        title: '招募第一位后端伙伴',
        body: '现有接口可以复用 Web 端, 但推送和离线缓存需要单独设计.',
        daysAgo: 18,
        author: 'luxing',
      },
    ],
    readme: `## 项目简介

SWStack Mobile 是 SWStack 的移动客户端. 目标不是完整复刻网页, 而是把高频动作做得更快: 看未读, 收藏问题, 快速回复.

## 首版范围

- 问题流与标签筛选
- 未读通知
- 收藏与稍后阅读
- 代码块横向滚动与复制

## 技术方案

使用 Vue 3 和 Capacitor 打包, 复用 Web 端类型定义和 API 契约. 离线缓存只保存最近浏览的问题摘要.

## 本地运行

~~~bash
git clone https://github.com/zincumyu/swstack-mobile.git
cd swstack-mobile
npm install
npm run dev
~~~

## 找队友

希望找到一位熟悉推送服务和移动端缓存策略的伙伴. 如果你用过 Capacitor 或类似方案, 欢迎在 Issue 中分享经验.`,
  },
]

const visibility = new Map<number, AdminProjectVisibility>()
const reviewStatusById = new Map<number, ProjectReviewStatus>()
const reviewNoteById = new Map<number, string>()
const submittedAtById = new Map<number, string>()
const reviewedAtById = new Map<number, string>()
const editedAtById = new Map<number, string>()
let boardEnabled = true

export function getProjectBoardEnabled(): boolean {
  return boardEnabled
}

export function setProjectBoardEnabled(enabled: boolean): void {
  boardEnabled = enabled
}

export function getProjectVisibility(id: number): AdminProjectVisibility {
  return visibility.get(id) ?? 'published'
}

export function setProjectVisibility(id: number, next: AdminProjectVisibility): void {
  visibility.set(id, next)
}

export function getProjectReviewStatus(id: number): ProjectReviewStatus {
  return reviewStatusById.get(id) ?? 'approved'
}

export function getProjectReviewNote(id: number): string | undefined {
  return reviewNoteById.get(id)
}

export function getProjectSubmittedAt(id: number): string | undefined {
  return submittedAtById.get(id)
}

export function getProjectReviewedAt(id: number): string | undefined {
  return reviewedAtById.get(id)
}

export function isProjectPublic(seed: ProjectSeed): boolean {
  return (
    getProjectVisibility(seed.id) === 'published' &&
    getProjectReviewStatus(seed.id) === 'approved'
  )
}

export function markProjectSubmitted(id: number, at = new Date().toISOString()): void {
  reviewStatusById.set(id, 'pending')
  reviewNoteById.delete(id)
  reviewedAtById.delete(id)
  submittedAtById.set(id, at)
  editedAtById.set(id, at)
}

export function setProjectReview(
  id: number,
  status: 'approved' | 'rejected',
  note?: string,
  at = new Date().toISOString(),
): void {
  reviewStatusById.set(id, status)
  if (note) {
    reviewNoteById.set(id, note)
  } else {
    reviewNoteById.delete(id)
  }
  reviewedAtById.set(id, at)
}

export function getProjectStats(): {
  projectCount: number
  hiddenProjectCount: number
  pendingProjectCount: number
  projectBoardEnabled: boolean
} {
  return {
    projectCount: projectSeeds.length,
    hiddenProjectCount: projectSeeds.filter(
      (seed) => getProjectVisibility(seed.id) === 'hidden',
    ).length,
    pendingProjectCount: projectSeeds.filter(
      (seed) => getProjectReviewStatus(seed.id) === 'pending',
    ).length,
    projectBoardEnabled: boardEnabled,
  }
}

function updateTimestamp(seed: ProjectSeed): string {
  const latest = seed.updates.reduce(
    (current, update) => Math.max(current, now - update.daysAgo * 86_400_000),
    0,
  )
  const editedAt = editedAtById.get(seed.id)
  const editedTime = editedAt ? new Date(editedAt).getTime() : 0
  const latestTime = Math.max(latest, editedTime)
  return latestTime > 0 ? new Date(latestTime).toISOString() : daysAgo(seed.createdDaysAgo)
}

function toMembers(seed: ProjectSeed): ProjectMember[] {
  return seed.members.map((member) => ({
    user: userByHandle(member.handle),
    role: member.role,
    isOwner: member.handle === seed.ownerHandle,
  }))
}

function toUpdates(seed: ProjectSeed): ProjectUpdate[] {
  return [...seed.updates]
    .sort((a, b) => a.daysAgo - b.daysAgo)
    .map((update, index) => ({
      id: seed.id * 100 + index + 1,
      title: update.title,
      body: update.body,
      createdAt: daysAgo(update.daysAgo),
      author: userByHandle(update.author),
    }))
}

export function toProjectSummary(seed: ProjectSeed): ProjectSummary {
  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    tagline: seed.tagline,
    coverImage: seed.coverImage,
    techStack: seed.techStack,
    status: seed.status,
    needs: seed.needs,
    owner: userByHandle(seed.ownerHandle),
    teamName: seed.teamName,
    memberCount: seed.members.length,
    updateCount: seed.updates.length,
    lastUpdatedAt: updateTimestamp(seed),
    isFeatured: seed.isFeatured,
    githubUrl: seed.githubUrl,
    demoUrl: seed.demoUrl,
  }
}

export function toProjectDetail(seed: ProjectSeed): ProjectDetail {
  return {
    ...toProjectSummary(seed),
    readme: seed.readme,
    screenshots: [...(seed.screenshots ?? [])],
    members: toMembers(seed),
    updates: toUpdates(seed),
    createdAt: daysAgo(seed.createdDaysAgo),
  }
}

export function toAdminProject(seed: ProjectSeed): AdminProject {
  return {
    ...toProjectSummary(seed),
    visibility: getProjectVisibility(seed.id),
    reviewStatus: getProjectReviewStatus(seed.id),
    reviewNote: getProjectReviewNote(seed.id),
    submittedAt: getProjectSubmittedAt(seed.id),
    reviewedAt: getProjectReviewedAt(seed.id),
    createdAt: daysAgo(seed.createdDaysAgo),
    updatedAt: updateTimestamp(seed),
  }
}

export function toAdminProjectDetail(seed: ProjectSeed): AdminProjectDetail {
  return {
    ...toProjectDetail(seed),
    visibility: getProjectVisibility(seed.id),
    reviewStatus: getProjectReviewStatus(seed.id),
    reviewNote: getProjectReviewNote(seed.id),
    submittedAt: getProjectSubmittedAt(seed.id),
    reviewedAt: getProjectReviewedAt(seed.id),
    updatedAt: updateTimestamp(seed),
  }
}

export function toMyProject(seed: ProjectSeed): MyProject {
  return {
    ...toProjectSummary(seed),
    visibility: getProjectVisibility(seed.id),
    reviewStatus: getProjectReviewStatus(seed.id),
    reviewNote: getProjectReviewNote(seed.id),
    submittedAt: getProjectSubmittedAt(seed.id),
    reviewedAt: getProjectReviewedAt(seed.id),
    createdAt: daysAgo(seed.createdDaysAgo),
    updatedAt: updateTimestamp(seed),
  }
}

export function toProjectEditData(seed: ProjectSeed): ProjectEditData {
  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    tagline: seed.tagline,
    coverImage: seed.coverImage,
    screenshots: [...(seed.screenshots ?? [])],
    techStack: [...seed.techStack],
    status: seed.status,
    needs: [...seed.needs],
    teamName: seed.teamName,
    githubUrl: seed.githubUrl,
    demoUrl: seed.demoUrl,
    readme: seed.readme,
    reviewStatus: getProjectReviewStatus(seed.id),
    reviewNote: getProjectReviewNote(seed.id),
    submittedAt: getProjectSubmittedAt(seed.id),
    reviewedAt: getProjectReviewedAt(seed.id),
    visibility: getProjectVisibility(seed.id),
    createdAt: daysAgo(seed.createdDaysAgo),
    updatedAt: updateTimestamp(seed),
  }
}

export function createProjectSeed(
  input: ProjectDraftInput,
  ownerHandle: string,
): ProjectSeed {
  const id = Math.max(0, ...projectSeeds.map((item) => item.id)) + 1
  const seed: ProjectSeed = {
    id,
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    coverImage: input.coverImage,
    screenshots: [...input.screenshots],
    techStack: [...input.techStack],
    status: input.status,
    needs: [...input.needs],
    ownerHandle,
    teamName: input.teamName,
    githubUrl: input.githubUrl,
    demoUrl: input.demoUrl,
    readme: input.readme,
    isFeatured: false,
    createdDaysAgo: 0,
    members: [{ handle: ownerHandle, role: '项目发起人 / 维护者' }],
    updates: [],
  }
  projectSeeds.push(seed)
  markProjectSubmitted(id)
  return seed
}

export function applyProjectInput(seed: ProjectSeed, input: ProjectDraftInput): void {
  seed.name = input.name
  seed.slug = input.slug
  seed.tagline = input.tagline
  seed.coverImage = input.coverImage
  seed.screenshots = [...input.screenshots]
  seed.techStack = [...input.techStack]
  seed.status = input.status
  seed.needs = [...input.needs]
  seed.teamName = input.teamName
  seed.githubUrl = input.githubUrl
  seed.demoUrl = input.demoUrl
  seed.readme = input.readme
  markProjectSubmitted(seed.id)
}
