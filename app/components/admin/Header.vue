<script setup lang="ts">
const isDevelopment = import.meta.dev;
const links = [
  {
    to: "/admin/stock-queue",
    name: "صف اطلاع موجودی",
    icon: "package" as const,
  },
  { to: "/admin/sms", name: "گزارش پیامک‌ها", icon: "chat" as const },
  { to: "/admin/customers", name: "مشتریان", icon: "users" as const },
  { to: "/admin/education", name: "آموزش‌ها", icon: "education" as const },
  { to: "/admin/arya", name: "همگام‌سازی آریا", icon: "sync" as const },
  {
    to: "/admin/sms-settings",
    name: "تنظیمات پیامک",
    icon: "settings" as const,
  },
];
</script>

<template>
  <header class="dashboard-header">
    <div class="dashboard-topbar">
      <NuxtLink class="dashboard-brand" to="/admin">
        <AppLogo />
        <div>
          <strong>همیار داروخانه</strong>
          <p>مدیریت خدمات مشتریان</p>
        </div>
      </NuxtLink>
      <div class="dashboard-header-actions">
        <NuxtLink class="dashboard-counter-link" to="/">
          <span>بازگشت به پیشخوان</span>
          <UiIcon name="back" :size="20" />
        </NuxtLink>
      </div>
    </div>
    <nav class="dashboard-nav" aria-label="مدیریت سامانه">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        active-class="is-active"
      >
        <UiIcon :name="link.icon" :size="24" />
        <span>{{ link.name }}</span>
      </NuxtLink>
    </nav>
  </header>
</template>
