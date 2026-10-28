import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function dismiss(id: number): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function show(message: string, tone: ToastTone = 'info'): void {
    const id = ++nextId
    items.value.push({ id, message, tone })
    window.setTimeout(() => dismiss(id), 3200)
  }

  return {
    items,
    show,
    dismiss,
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    info: (message: string) => show(message, 'info'),
  }
})
