<script setup lang="ts">
defineProps<{
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
}>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <div v-if="loading" class="async-state" role="status">
    <UiIcon name="loading" class="spin" /><span>در حال دریافت اطلاعات…</span>
  </div>
  <div v-else-if="error" class="async-state error-state" role="alert">
    <UiIcon name="warning" />
    <p>{{ error }}</p>
    <UiButton variant="secondary" @click="$emit('retry')">تلاش مجدد</UiButton>
  </div>
  <div v-else-if="empty" class="async-state">
    <UiIcon name="search" :size="32" />
    <p>{{ emptyText || "موردی پیدا نشد." }}</p>
  </div>
  <slot v-else />
</template>
