import { request } from './http'
import type {
  NotificationItem,
  NotificationQuery,
  NotificationReadAllResult,
  NotificationUnreadCount,
  PageResult,
} from './types'

export const notificationApi = {
  list(query: NotificationQuery) {
    return request<PageResult<NotificationItem>>({
      url: '/notifications',
      params: { ...query },
    })
  },

  unreadCount() {
    return request<NotificationUnreadCount>({ url: '/notifications/unread-count' })
  },

  markRead(id: number, read = true) {
    return request<NotificationItem>({
      url: `/notifications/${id}`,
      method: 'PATCH',
      data: { read },
    })
  },

  markAllRead() {
    return request<NotificationReadAllResult>({
      url: '/notifications/read-all',
      method: 'POST',
    })
  },
}
