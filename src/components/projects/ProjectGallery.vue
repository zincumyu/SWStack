<template>
  <div v-if="images.length" class="project-gallery">
    <div class="gallery-grid">
      <button
        v-for="(image, index) in images"
        :key="index"
        class="gallery-thumb"
        type="button"
        :aria-label="`放大第 ${index + 1} 张${label}`"
        @click="open(index)"
      >
        <img :src="image" :alt="`${label} ${index + 1}`" loading="lazy" />
        <span class="thumb-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="thumb-zoom" aria-hidden="true">
          <ZoomIn :size="12" />
        </span>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="activeIndex !== null"
        ref="dialogRoot"
        class="gallery-lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="`${label}预览`"
        @click.self="close"
      >
        <div class="lightbox-bar">
          <span class="lightbox-count">
            {{ activeIndex + 1 }} / {{ images.length }}
          </span>
          <span class="lightbox-title">{{ label }}</span>
          <button
            ref="closeButton"
            class="lightbox-close"
            type="button"
            aria-label="关闭截图预览"
            @click="close"
          >
            <X :size="15" />
          </button>
        </div>

        <div class="lightbox-body" @click.self="close">
          <button
            v-if="images.length > 1"
            class="lightbox-nav prev"
            type="button"
            aria-label="上一张截图"
            @click.stop="step(-1)"
          >
            <ChevronLeft :size="20" />
          </button>

          <img
            class="lightbox-image"
            :src="images[activeIndex]"
            :alt="`${label} ${activeIndex + 1}`"
            @click.stop
          />

          <button
            v-if="images.length > 1"
            class="lightbox-nav next"
            type="button"
            aria-label="下一张截图"
            @click.stop="step(1)"
          >
            <ChevronRight :size="20" />
          </button>
        </div>

        <p class="lightbox-hint">方向键切换, Esc 关闭</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    images: string[]
    label?: string
  }>(),
  { label: '项目截图' },
)

const activeIndex = ref<number | null>(null)
const dialogRoot = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const isOpen = computed(() => activeIndex.value !== null)
let lastFocused: HTMLElement | null = null
let previousOverflow = ''

function open(index: number): void {
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  activeIndex.value = index
}

function close(): void {
  activeIndex.value = null
}

function step(delta: number): void {
  if (activeIndex.value === null) {
    return
  }
  const total = props.images.length
  activeIndex.value = (activeIndex.value + delta + total) % total
}

function handleKeydown(event: KeyboardEvent): void {
  if (!isOpen.value) {
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
    return
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
    return
  }
  if (event.key === 'Tab') {
    const buttons = dialogRoot.value?.querySelectorAll<HTMLButtonElement>(
      'button:not(:disabled)',
    )
    if (!buttons?.length) {
      return
    }
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(isOpen, (open) => {
  if (open) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    void nextTick(() => closeButton.value?.focus())
    return
  }
  document.body.style.overflow = previousOverflow
  lastFocused?.focus()
  lastFocused = null
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (isOpen.value) {
    document.body.style.overflow = previousOverflow
  }
})
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.gallery-thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface-subtle);
  cursor: zoom-in;
}

.gallery-thumb:hover {
  border-color: var(--border-strong);
}

.gallery-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.18s ease;
}

.gallery-thumb:hover img {
  transform: scale(1.015);
}

.thumb-index {
  position: absolute;
  bottom: 5px;
  left: 5px;
  padding: 0 4px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 2px;
  background: rgba(32, 33, 36, 0.66);
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 8px;
  line-height: 1.6;
}

.thumb-zoom {
  position: absolute;
  top: 5px;
  right: 5px;
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 2px;
  background: rgba(32, 33, 36, 0.66);
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.gallery-thumb:hover .thumb-zoom,
.gallery-thumb:focus-visible .thumb-zoom {
  opacity: 1;
}

.gallery-lightbox {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  padding: 0 20px;
  flex-direction: column;
  align-items: center;
  background: rgba(20, 21, 23, 0.94);
  outline: 0;
}

.lightbox-bar {
  display: flex;
  width: 100%;
  max-width: 1040px;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.86);
}

.lightbox-count {
  font-family: var(--font-mono);
  font-size: 10px;
}

.lightbox-title {
  min-width: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.56);
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lightbox-close {
  display: inline-flex;
  width: 28px;
  height: 28px;
  margin-left: auto;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.lightbox-close:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.12);
}

.lightbox-body {
  display: flex;
  width: 100%;
  max-width: 1040px;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.lightbox-image {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 120px);
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 2px;
  background: #151618;
}

.lightbox-nav {
  display: inline-flex;
  width: 32px;
  height: 48px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.lightbox-nav:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.12);
}

.lightbox-hint {
  flex: 0 0 38px;
  margin: 0;
  padding-top: 10px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 9.5px;
}

@media (max-width: 640px) {
  .gallery-lightbox {
    padding: 0 10px;
  }

  .lightbox-bar {
    height: 42px;
    flex-basis: 42px;
  }

  .lightbox-hint {
    display: none;
  }

  .lightbox-body {
    position: relative;
    gap: 0;
    padding-bottom: 10px;
  }

  .lightbox-image {
    max-height: calc(100vh - 62px);
  }

  .lightbox-nav {
    position: absolute;
    top: 50%;
    width: 28px;
    height: 42px;
    transform: translateY(-50%);
    background: rgba(20, 21, 23, 0.68);
  }

  .lightbox-nav.prev {
    left: 4px;
  }

  .lightbox-nav.next {
    right: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gallery-thumb img,
  .thumb-zoom {
    transition: none;
  }
}
</style>
