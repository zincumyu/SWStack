import type { ColumnLevel, ColumnStatus } from '@/api/types'

export const COLUMN_LEVELS: Array<{
  value: ColumnLevel
  label: string
  description: string
}> = [
  {
    value: 'beginner',
    label: '入门',
    description: '从基础概念和第一个可运行练习开始.',
  },
  {
    value: 'intermediate',
    label: '进阶',
    description: '适合已经完成过小型项目, 想补齐工程实践的同学.',
  },
  {
    value: 'advanced',
    label: '深入',
    description: '关注底层机制, 性能与复杂系统的取舍.',
  },
]

export const COLUMN_LEVEL_META: Record<ColumnLevel, { label: string }> = {
  beginner: { label: '入门' },
  intermediate: { label: '进阶' },
  advanced: { label: '深入' },
}

export const COLUMN_STATUS_META: Record<ColumnStatus, { label: string }> = {
  draft: { label: '草稿' },
  published: { label: '已发布' },
}
