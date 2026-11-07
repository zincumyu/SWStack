<template>
  <div class="page-container my-column-editor-page">
    <ColumnEditorForm mode="mine" :column-id="columnId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ColumnEditorForm from '@/components/columns/ColumnEditorForm.vue'

const route = useRoute()

const columnId = computed(() =>
  route.name === 'my-column-edit' ? Number(route.params.id) : null,
)
</script>

<style scoped>
.my-column-editor-page {
  padding-top: 0;
}
</style>
