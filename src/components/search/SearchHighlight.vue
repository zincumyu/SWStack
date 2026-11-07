<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <mark v-if="part.match" class="search-mark">{{ part.text }}</mark>
      <span v-else>{{ part.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    keyword?: string
  }>(),
  { keyword: '' },
)

interface TextPart {
  text: string
  match: boolean
}

const parts = computed<TextPart[]>(() => {
  const keyword = props.keyword.trim()
  if (!keyword || !props.text) {
    return [{ text: props.text, match: false }]
  }
  const source = props.text
  const lowerSource = source.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const result: TextPart[] = []
  let cursor = 0
  let index = lowerSource.indexOf(lowerKeyword)

  while (index !== -1) {
    if (index > cursor) {
      result.push({ text: source.slice(cursor, index), match: false })
    }
    result.push({ text: source.slice(index, index + keyword.length), match: true })
    cursor = index + keyword.length
    index = lowerSource.indexOf(lowerKeyword, cursor)
  }

  if (cursor < source.length) {
    result.push({ text: source.slice(cursor), match: false })
  }
  return result
})
</script>

<style scoped>
.search-mark {
  padding: 0 1px;
  border-radius: 1px;
  background: #ffedcf;
  color: inherit;
}
</style>
