import { describe, expect, it } from 'vitest'
import {
  isProjectImageRef,
  PROJECT_IMAGE_MAX_BYTES,
  validateProjectImageFile,
} from '@/utils/project-images'

function fileOf(type: string, size: number): File {
  const file = new File(['x'], 'cover.png', { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateProjectImageFile', () => {
  it('accepts a supported image within the size limit', () => {
    expect(validateProjectImageFile(fileOf('image/png', 1024))).toBeNull()
    expect(validateProjectImageFile(fileOf('image/webp', PROJECT_IMAGE_MAX_BYTES))).toBeNull()
  })

  it('rejects unsupported types', () => {
    expect(validateProjectImageFile(fileOf('image/gif', 1024))).toBe('仅支持 JPG, PNG 或 WebP 图片')
  })

  it('rejects empty and oversized files', () => {
    expect(validateProjectImageFile(fileOf('image/png', 0))).toBe('图片文件为空, 请重新选择')
    expect(validateProjectImageFile(fileOf('image/png', PROJECT_IMAGE_MAX_BYTES + 1))).toBe(
      '图片不能超过 5MB',
    )
  })
})

describe('isProjectImageRef', () => {
  it('accepts bundled and uploaded paths', () => {
    expect(isProjectImageRef('/projects/project-default.svg')).toBe(true)
    expect(isProjectImageRef('/uploads/covers/abc')).toBe(true)
  })

  it('accepts inline data URLs for allowed image types', () => {
    expect(isProjectImageRef('data:image/png;base64,AAAA')).toBe(true)
    expect(isProjectImageRef('data:image/gif;base64,AAAA')).toBe(false)
  })

  it('accepts http(s) URLs and rejects other protocols or garbage', () => {
    expect(isProjectImageRef('https://cdn.example.com/a.png')).toBe(true)
    expect(isProjectImageRef('http://cdn.example.com/a.png')).toBe(true)
    expect(isProjectImageRef('javascript:alert(1)')).toBe(false)
    expect(isProjectImageRef('not a url')).toBe(false)
  })
})
