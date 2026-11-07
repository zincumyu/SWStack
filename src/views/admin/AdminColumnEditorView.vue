<template>
  <ColumnEditorForm mode="admin" :column-id="columnId" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ColumnEditorForm from '@/components/columns/ColumnEditorForm.vue'

const route = useRoute()

const columnId = computed(() =>
  route.name === 'admin-column-edit' ? Number(route.params.id) : null,
)
</script>
