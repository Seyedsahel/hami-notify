<script setup lang="ts">
defineProps<{ error: { statusCode?: number; message?: string } }>();
</script>
<template>
  <main class="counter-stage">
    <section class="counter-panel">
      <CounterHeader />
      <div class="counter-body">
        <h1>
          {{ error.statusCode === 404 ? "صفحه پیدا نشد" : "صفحه باز نشد" }}
        </h1>
        <p class="muted">دوباره تلاش کنید یا به پیشخوان برگردید.</p>
        <UiButton @click="clearError({ redirect: '/' })"
          >بازگشت به پیشخوان</UiButton
        >
      </div>
    </section>
  </main>
</template>
