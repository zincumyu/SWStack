<template>
  <div ref="root" class="search-box" :class="variant">
    <form class="search-control" role="search" @submit.prevent="submit">
      <Search :size="15" class="search-icon" aria-hidden="true" />
      <input
        ref="input"
        :value="draft"
        type="search"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="panelVisible"
        :aria-controls="listboxId"
        :aria-activedescendant="activeOptionId || undefined"
        autocomplete="off"
        maxlength="80"
        @input="handleInput"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />
      <button
        v-if="draft"
        class="input-clear"
        type="button"
        aria-label="清除关键词"
        @click="clearQuery"
      >
        <X :size="13" />
      </button>
      <kbd v-if="showShortcut && !draft" aria-hidden="true">/</kbd>
      <button v-if="showSubmit" class="btn btn-primary submit-button" type="submit">搜索</button>
    </form>

    <div
      v-if="panelVisible"
      :id="listboxId"
      class="suggestion-panel"
      role="listbox"
      aria-label="搜索建议"
    >
      <section
        v-for="section in sections"
        :key="section.key"
        class="suggestion-section"
        :aria-label="section.title"
      >
        <header class="section-head">
          <span>{{ section.title }}</span>
          <button
            v-if="section.showClear"
            class="section-action"
            type="button"
            @mousedown.prevent
            @click.stop="historyStore.clear()"
          >
            清除
          </button>
        </header>

        <button
          v-for="option in section.items"
          :id="optionId(option)"
          :key="option.key"
          class="suggestion-option"
          :class="{ active: isActive(option) }"
          type="button"
          role="option"
          :aria-selected="isActive(option)"
          @mouseenter="activeIndex = optionIndex(option)"
          @mousedown.prevent
          @click="chooseOption(option)"
        >
          <span class="option-icon" :class="option.kind" aria-hidden="true">
            <component :is="kindIcon(option.kind)" :size="13" />
          </span>
          <span class="option-copy">
            <span class="option-label">
              <SearchHighlight :text="option.label" :keyword="query" />
            </span>
            <span v-if="option.description" class="option-description">
              {{ option.description }}
            </span>
          </span>
          <ArrowUpRight :size="12" class="option-arrow" aria-hidden="true" />
        </button>
      </section>

      <div v-if="suggestionLoading" class="suggestion-state">
        <Loader2 :size="13" class="spinning" aria-hidden="true" />
        正在查找搜索建议
      </div>

      <div v-else-if="suggestionError" class="suggestion-state error">
        {{ suggestionError }}
      </div>

      <div v-else-if="query && suggestions.length === 0" class="suggestion-state">
        没有匹配的搜索建议, 按回车搜索全部结果.
      </div>

      <div v-if="assistStore.trendingLoading && !query" class="suggestion-state">
        <Loader2 :size="13" class="spinning" aria-hidden="true" />
        正在加载热门搜索
      </div>

      <div v-else-if="assistStore.trendingError && !query" class="suggestion-state error">
        {{ assistStore.trendingError }}
      </div>

      <button v-if="query" class="search-all" type="button" @mousedown.prevent @click="submit">
        <Search :size="13" aria-hidden="true" />
        <span>搜索 "{{ query }}" 的全部结果</span>
        <kbd>Enter</kbd>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  FolderGit2,
  Hash,
  Loader2,
  MessageSquareText,
  Search,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-vue-next'
import type { SearchSuggestionItem } from '@/api/types'
import SearchHighlight from '@/components/search/SearchHighlight.vue'
import { searchApi } from '@/api/search'
import { useSearchAssistStore } from '@/stores/search-assist'
import { useSearchHistoryStore } from '@/stores/search-history'
import { getErrorMessage } from '@/utils/errors'
import { formatCompact } from '@/utils/format'

type OptionKind = SearchSuggestionItem['kind'] | 'recent' | 'trending'

interface SearchOption {
  key: string
  kind: OptionKind
  label: string
  description: string
  target?: string
  term?: string
}

interface SuggestionSection {
  key: string
  title: string
  items: SearchOption[]
  showClear?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    variant?: 'header' | 'page'
    placeholder?: string
    ariaLabel?: string
    showSubmit?: boolean
    showShortcut?: boolean
  }>(),
  {
    variant: 'page',
    placeholder: '输入关键词',
    ariaLabel: '全站搜索关键词',
    showSubmit: true,
    showShortcut: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [keyword: string]
}>()

const router = useRouter()
const assistStore = useSearchAssistStore()
const historyStore = useSearchHistoryStore()
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const draft = ref(props.modelValue)
const activeIndex = ref(-1)
const isOpen = ref(false)
const suggestions = ref<SearchSuggestionItem[]>([])
const suggestionLoading = ref(false)
const suggestionError = ref<string | null>(null)
const listboxId = `search-box-suggestions-${useId()}`

let debounceTimer: number | null = null
let suggestionSequence = 0

const query = computed(() => draft.value.trim())
const panelVisible = computed(() => {
  if (!isOpen.value) {
    return false
  }
  return Boolean(
    query.value ||
    historyStore.recent.length ||
    assistStore.trending.length ||
    suggestions.value.length ||
    suggestionLoading.value ||
    suggestionError.value ||
    assistStore.trendingLoading ||
    assistStore.trendingError,
  )
})

const sections = computed<SuggestionSection[]>(() => {
  if (query.value) {
    if (suggestions.value.length === 0) {
      return []
    }
    return [
      {
        key: 'suggestions',
        title: '搜索建议',
        items: suggestions.value.map((item) => ({
          key: `suggestion:${item.kind}:${item.target}`,
          kind: item.kind,
          label: item.label,
          description: item.description,
          target: item.target,
        })),
      },
    ]
  }

  const output: SuggestionSection[] = []
  if (historyStore.recent.length > 0) {
    output.push({
      key: 'recent',
      title: '最近搜索',
      showClear: true,
      items: historyStore.recent.map((term) => ({
        key: `recent:${term}`,
        kind: 'recent',
        label: term,
        description: '再次搜索',
        term,
      })),
    })
  }
  if (assistStore.trending.length > 0) {
    output.push({
      key: 'trending',
      title: '热门搜索',
      items: assistStore.trending.map((item) => ({
        key: `trending:${item.keyword}`,
        kind: 'trending',
        label: item.keyword,
        description: `本周 ${formatCompact(item.count)} 次讨论`,
        term: item.keyword,
      })),
    })
  }
  return output
})

const flatOptions = computed(() => sections.value.flatMap((section) => section.items))
const activeOptionId = computed(() => {
  const option = flatOptions.value[activeIndex.value]
  return option ? optionId(option) : ''
})

watch(
  () => props.modelValue,
  (value) => {
    if (value === draft.value) {
      return
    }
    draft.value = value
    activeIndex.value = -1
    suggestionSequence += 1
    suggestions.value = []
    suggestionError.value = null
    suggestionLoading.value = false
  },
  { immediate: true },
)

watch(flatOptions, (options) => {
  if (activeIndex.value >= options.length) {
    activeIndex.value = options.length - 1
  }
})

function handleInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  draft.value = value
  emit('update:modelValue', value)
  isOpen.value = true
  activeIndex.value = -1
  scheduleSuggestions(value)
}

function handleFocus(): void {
  isOpen.value = true
  activeIndex.value = -1
  if (!query.value) {
    void assistStore.loadTrending()
    return
  }
  if (suggestions.value.length === 0) {
    scheduleSuggestions(query.value)
  }
}

function scheduleSuggestions(value: string): void {
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer)
    debounceTimer = null
  }
  suggestionSequence += 1
  const sequence = suggestionSequence
  const keyword = value.trim()
  suggestionError.value = null

  if (!keyword) {
    suggestionLoading.value = false
    suggestions.value = []
    void assistStore.loadTrending()
    return
  }

  suggestionLoading.value = true
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null
    void searchApi
      .suggest(keyword, 8)
      .then((result) => {
        if (sequence !== suggestionSequence) {
          return
        }
        suggestions.value = result.items
      })
      .catch((cause) => {
        if (sequence === suggestionSequence) {
          suggestions.value = []
          suggestionError.value = getErrorMessage(cause)
        }
      })
      .finally(() => {
        if (sequence === suggestionSequence) {
          suggestionLoading.value = false
        }
      })
  }, 220)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    isOpen.value = false
    input.value?.blur()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    isOpen.value = true
    const count = flatOptions.value.length
    if (count === 0) {
      return
    }
    activeIndex.value = (activeIndex.value + 1) % count
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    isOpen.value = true
    const count = flatOptions.value.length
    if (count === 0) {
      return
    }
    activeIndex.value = activeIndex.value <= 0 ? count - 1 : activeIndex.value - 1
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    const option = flatOptions.value[activeIndex.value]
    if (option) {
      chooseOption(option)
      return
    }
    submit()
    return
  }
  if (event.key === 'Tab') {
    isOpen.value = false
  }
}

function submit(): void {
  const keyword = query.value
  if (keyword) {
    historyStore.remember(keyword)
  }
  closePanel()
  emit('submit', keyword)
}

function chooseOption(option: SearchOption): void {
  if (option.target) {
    if (query.value) {
      historyStore.remember(query.value)
    }
    closePanel()
    void router.push(option.target)
    return
  }
  runSearch(option.term ?? option.label)
}

function runSearch(term: string): void {
  draft.value = term
  emit('update:modelValue', term)
  historyStore.remember(term)
  closePanel()
  emit('submit', term)
}

function clearQuery(): void {
  draft.value = ''
  emit('update:modelValue', '')
  suggestionSequence += 1
  suggestions.value = []
  suggestionError.value = null
  suggestionLoading.value = false
  activeIndex.value = -1
  isOpen.value = true
  void assistStore.loadTrending()
  input.value?.focus()
}

function closePanel(): void {
  isOpen.value = false
  activeIndex.value = -1
  input.value?.blur()
}

function optionIndex(option: SearchOption): number {
  return flatOptions.value.findIndex((item) => item.key === option.key)
}

function optionId(option: SearchOption): string {
  return `${listboxId}-option-${optionIndex(option)}`
}

function isActive(option: SearchOption): boolean {
  return activeIndex.value === optionIndex(option)
}

function kindIcon(kind: OptionKind): Component {
  const icons: Record<OptionKind, Component> = {
    question: MessageSquareText,
    project: FolderGit2,
    column: BookOpen,
    tag: Hash,
    user: UserRound,
    recent: Clock3,
    trending: TrendingUp,
  }
  return icons[kind]
}

function focus(): void {
  input.value?.focus()
}

function blur(): void {
  input.value?.blur()
}

function handlePointerDown(event: PointerEvent): void {
  const target = event.target as Node | null
  if (target && root.value && !root.value.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer)
  }
})

defineExpose({ focus, blur })
</script>

<style scoped>
.search-box {
  position: relative;
  width: 100%;
}

.search-box.header {
  max-width: 340px;
  min-width: 160px;
  flex: 1 1 auto;
}

.search-control {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
}

.search-box.header .search-control {
  height: 34px;
  padding: 0 9px;
}

.search-box.page .search-control {
  height: 36px;
  max-width: 392px;
  padding-left: 10px;
}

.search-box.page {
  flex: 0 1 392px;
}

.search-control:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}

.search-icon {
  flex: 0 0 auto;
  color: var(--text-muted);
}

.search-control input {
  width: 100%;
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
}

.search-control input::placeholder {
  color: var(--text-faint);
}

.search-control input::-webkit-search-cancel-button {
  display: none;
}

.input-clear {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 2px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--text-faint);
}

.input-clear:hover {
  background: var(--surface-muted);
  color: var(--text-muted);
}

.search-control kbd,
.search-all kbd {
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface-subtle);
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1;
}

.submit-button {
  height: 100%;
  padding: 0 15px;
  border-radius: 0 2px 2px 0;
  font-size: 12.5px;
}

.suggestion-panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  left: 0;
  z-index: 70;
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(18, 24, 30, 0.14);
}

.suggestion-section + .suggestion-section {
  border-top: 1px solid var(--border);
}

.section-head {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 10px;
  background: var(--surface-subtle);
  color: var(--text-faint);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.section-action {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 9.5px;
}

.section-action:hover {
  color: var(--link-hover);
}

.suggestion-option {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  padding: 5px 9px;
  border: 0;
  border-top: 1px solid #f1f2f3;
  border-radius: 0;
  background: var(--surface);
  color: var(--text-secondary);
  text-align: left;
}

.section-head + .suggestion-option {
  border-top: 0;
}

.suggestion-option.active,
.suggestion-option:hover {
  background: var(--surface-subtle);
}

.option-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: var(--surface);
  color: var(--text-muted);
}

.option-icon.question {
  border-color: #ccd9e4;
  background: #f2f7fb;
  color: #4d6f8b;
}

.option-icon.project {
  border-color: #c5d9d0;
  background: #f1f8f4;
  color: #3d6f59;
}

.option-icon.column {
  border-color: #ead9c8;
  background: #fbf6f1;
  color: #85613f;
}

.option-icon.tag {
  border-color: #ccdce7;
  background: var(--tag-bg);
  color: var(--tag-text);
}

.option-icon.user {
  border-color: #d7d0df;
  background: #f7f3fa;
  color: #675b76;
}

.option-icon.recent,
.option-icon.trending {
  color: var(--brand-hover);
}

.option-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.option-label {
  overflow: hidden;
  color: var(--text);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-description {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 9.5px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-arrow {
  flex: 0 0 auto;
  color: var(--text-faint);
}

.suggestion-state {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  border-top: 1px solid #f1f2f3;
  color: var(--text-muted);
  font-size: 10.5px;
}

.suggestion-state.error {
  color: var(--danger);
}

.spinning {
  animation: search-suggestion-spin 0.9s linear infinite;
}

@keyframes search-suggestion-spin {
  to {
    transform: rotate(360deg);
  }
}

.search-all {
  display: flex;
  width: 100%;
  min-height: 35px;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border: 0;
  border-top: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 10.5px;
  text-align: left;
}

.search-all:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.search-all span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-all kbd {
  height: 16px;
  background: var(--surface);
}

@media (max-width: 1020px) {
  .search-box.header {
    max-width: 280px;
  }
}

@media (max-width: 820px) {
  .search-box.header {
    max-width: none;
  }

  .search-box.page {
    max-width: none;
    flex-basis: auto;
  }
}

@media (max-width: 640px) {
  .search-box.header {
    order: 5;
    flex-basis: 100%;
  }

  .search-box.header .search-control {
    height: 34px;
  }

  .search-box.page .search-control {
    height: 34px;
  }

  .search-control kbd {
    display: none;
  }

  .suggestion-panel {
    max-height: 320px;
  }

  .suggestion-option {
    min-height: 40px;
  }
}
</style>
