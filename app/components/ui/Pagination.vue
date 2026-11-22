<script setup lang="ts">
import { faDigits } from "~/utils/format";
defineProps<{ page: number; hasMore: boolean; disabled?: boolean }>();
defineEmits<{ change: [page: number] }>();
</script>
<template>
  <nav class="pagination" aria-label="صفحه‌بندی">
    <UiButton
      variant="secondary"
      :disabled="page <= 1 || disabled"
      @click="$emit('change', page - 1)"
      >قبلی</UiButton
    >
    <span class="muted small">صفحه {{ faDigits(page) }}</span>
    <UiButton
      variant="secondary"
      :disabled="!hasMore || disabled"
      @click="$emit('change', page + 1)"
      >بعدی</UiButton
    >
  </nav>
</template>
