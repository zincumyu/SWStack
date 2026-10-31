import type { ProjectNeed, ProjectReviewStatus, ProjectStatus } from '@/api/types'

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; description: string }
> = {
  idea: { label: '构思中', description: '方向已确定, 正在验证需求与原型.' },
  building: { label: '开发中', description: '核心功能正在实现, 欢迎参与讨论.' },
  beta: { label: '内测中', description: '已有可用版本, 正在收集真实使用反馈.' },
  launched: { label: '已上线', description: '项目已公开使用, 持续维护与迭代.' },
  archived: { label: '已归档', description: '项目暂停维护, 保留代码与文档.' },
}

export const PROJECT_NEED_META: Record<
  ProjectNeed,
  { label: string; description: string }
> = {
  feedback: {
    label: '求反馈',
    description: '需要真实使用反馈, 问题复现或体验建议.',
  },
  teammates: {
    label: '找队友',
    description: '正在寻找愿意持续投入的开发者或设计伙伴.',
  },
}

export const PROJECT_REVIEW_META: Record<
  ProjectReviewStatus,
  { label: string; description: string }
> = {
  pending: {
    label: '待审核',
    description: '管理员审核通过后会出现在项目展示.',
  },
  approved: {
    label: '已上线',
    description: '项目已通过审核, 会按板块设置公开展示.',
  },
  rejected: {
    label: '需修改',
    description: '管理员退回了项目, 请按审核备注修改后重新提交.',
  },
}
