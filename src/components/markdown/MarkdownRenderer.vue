<template>
  <div ref="root" class="markdown-body" v-html="html" @click="handleClick" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DOMPurify from 'dompurify'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  source: string
}>()

const root = ref<HTMLElement | null>(null)

const html = computed(() =>
  DOMPurify.sanitize(renderMarkdown(props.source), {
    ADD_TAGS: ['button'],
    ADD_ATTR: ['target', 'rel', 'type'],
  }),
)

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const area = document.createElement('textarea')
  area.value = text
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  document.body.removeChild(area)
}

async function handleClick(event: MouseEvent): Promise<void> {
  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('.code-copy')
  if (!button) {
    return
  }

  const block = button.closest('.code-block')
  const code = block?.querySelector('code')
  if (!code) {
    return
  }

  try {
    await copyText(code.innerText)
    button.textContent = '已复制'
    window.setTimeout(() => {
      button.textContent = '复制'
    }, 1600)
  } catch {
    button.textContent = '复制失败'
    window.setTimeout(() => {
      button.textContent = '复制'
    }, 1600)
  }
}
</script>
