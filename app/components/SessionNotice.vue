<script setup lang="ts">
const session = useSessionStore();
</script>
<template>
  <p
    v-if="!session.configured || session.rejected"
    class="access-notice"
    role="alert"
  >
    دسترسی به سامانه برقرار نیست. با مسئول سامانه تماس بگیرید.
  </p>
</template>
