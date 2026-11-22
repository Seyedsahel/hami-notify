<script setup lang="ts">
defineProps<{ step: number; stock?: boolean }>();
</script>
<template>
  <ol class="steps" aria-label="مراحل درخواست">
    <li
      :class="{ current: step === 1 }"
      :aria-current="step === 1 ? 'step' : undefined"
    >
      <span>۱</span>{{ stock ? "انتخاب محصول" : "انتخاب آموزش" }}
    </li>
    <li
      :class="{ current: step === 2 }"
      :aria-current="step === 2 ? 'step' : undefined"
    >
      <span>۲</span>{{ stock ? "ثبت درخواست" : "شماره و ارسال" }}
    </li>
  </ol>
</template>
