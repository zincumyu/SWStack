export const PROJECT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
export const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PROJECT_SCREENSHOT_LIMIT = 4

const PROJECT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_DATA_URL_LENGTH = 8_000_000

export function validateProjectImageFile(file: File): string | null {
  if (!PROJECT_IMAGE_TYPES.includes(file.type)) {
    return '仅支持 JPG, PNG 或 WebP 图片'
  }
  if (file.size <= 0) {
    return '图片文件为空, 请重新选择'
  }
  if (file.size > PROJECT_IMAGE_MAX_BYTES) {
    return '图片不能超过 5MB'
  }
  return null
}

export function isProjectImageRef(value: string): boolean {
  const source = value.trim()
  if (!source) {
    return false
  }
  if (/^\/projects\/[a-z0-9-]+\.svg$/.test(source)) {
    return true
  }
  if (/^\/uploads\/[a-z0-9/_-]+$/i.test(source)) {
    return true
  }
  if (source.toLowerCase().startsWith('data:image/')) {
    return (
      /^data:image\/(?:png|jpeg|webp);base64,/i.test(source) &&
      source.length <= MAX_DATA_URL_LENGTH
    )
  }
  if (source.length > 300) {
    return false
  }
  try {
    const url = new URL(source)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
