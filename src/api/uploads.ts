import { request } from './http'
import type { UploadedImage } from './types'

export const uploadApi = {
  image(file: File) {
    const data = new FormData()
    data.append('file', file)
    return request<UploadedImage>({
      url: '/uploads/images',
      method: 'POST',
      data,
    })
  },
}
