<script setup lang="ts">
defineProps<{ title?: string; busy?: boolean }>();
defineEmits<{ back: [] }>();
</script>
<template>
  <header class="counter-header" :class="{ 'home-header': !title }">
    <template v-if="!title"
      ><UiIcon name="pharmacy" :size="40" />
      <div>
        <strong>همیار داروخانه</strong>
        <p>پیشخوان خدمات مشتریان</p>
      </div></template
    >
    <template v-else
      ><h1>{{ title }}</h1>
      <button
        class="icon-button"
        :disabled="busy"
        aria-label="بازگشت"
        @click="$emit('back')"
      >
        <UiIcon name="right" /></button
    ></template>
  </header>
</template>
