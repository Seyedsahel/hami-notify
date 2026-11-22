<script setup lang="ts">
useShortcuts((event, editing) => {
  if (editing || event.ctrlKey || event.metaKey || event.altKey) return;
  if (["1", "۱"].includes(event.key)) void navigateTo("/education/send");
  if (["2", "۲"].includes(event.key)) void navigateTo("/stock/register");
});
</script>
<template>
  <CounterHeader />
  <div class="counter-body">
    <div class="welcome">
      <p class="muted small">یک خدمت کوچک، یک همراهی ماندگار</p>
      <h1>چطور کمک کنیم؟</h1>
      <div class="gold-rule" />
    </div>
    <div class="home-actions">
      <NuxtLink class="home-action" to="/education/send"
        ><UiIcon name="education" :size="38" />
        <div>
          <strong>آموزش</strong>
          <p>ارسال لینک آموزش برای مشتری</p>
        </div>
        <UiIcon name="left" :size="18"
      /></NuxtLink>
      <NuxtLink class="home-action" to="/stock/register"
        ><UiIcon name="package" :size="38" />
        <div>
          <strong>اطلاع موجودی</strong>
          <p>ثبت شماره برای خبر موجود شدن</p>
        </div>
        <UiIcon name="left" :size="18"
      /></NuxtLink>
    </div>
    <div class="counter-footer">
      <NuxtLink class="management-link" to="/admin"
        ><UiIcon name="external" />مدیریت سامانه</NuxtLink
      >
      <p class="muted small">انتخاب سریع با کلیدهای ۱ و ۲</p>
    </div>
  </div>
</template>
