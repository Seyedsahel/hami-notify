<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "primary", type: "button" },
);
</script>
<template>
  <button
    :type="type"
    class="button"
    :class="`button-${variant}`"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <UiIcon v-if="loading" name="loading" class="spin" /><slot />
  </button>
</template>
