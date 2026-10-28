import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemeName = 'light' | 'dark'

const STORAGE_KEY = 'swstack-theme'
const supportedThemes: ThemeName[] = ['light']

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeName>('light')
  const canToggle = computed(() => supportedThemes.length > 1)

  function applyTheme(next: ThemeName): boolean {
    if (!supportedThemes.includes(next)) {
      return false
    }
    theme.value = next
    document.body.dataset.theme = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      return true
    }
    return true
  }

  function init(): void {
    let saved: string | null = null
    try {
      saved = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      saved = null
    }
    const preferred: ThemeName = saved === 'dark' ? 'dark' : 'light'
    if (!applyTheme(preferred)) {
      applyTheme('light')
    }
  }

  function toggleTheme(): boolean {
    const next: ThemeName = theme.value === 'light' ? 'dark' : 'light'
    return applyTheme(next)
  }

  return {
    theme,
    canToggle,
    init,
    applyTheme,
    toggleTheme,
  }
})
