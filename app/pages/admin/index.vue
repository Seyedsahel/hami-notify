<script setup lang="ts">
import Heading from '~/components/admin/Heading.vue';

definePageMeta({ layout: "admin" });
</script>
<template>
  <Heading 
  title="مدیریت سامانه"
    description="پیگیری درخواست‌ها و مدیریت خدمات مشتریان"
  />
  <div class="dashboard-cards">
    <NuxtLink to="/admin/stock-queue" class="dashboard-card"
      ><UiIcon name="queue" :size="30" />
      <div>
        <h2>صف اطلاع موجودی</h2>
        <p>بررسی محصولات و انتخاب دریافت‌کنندگان پیامک</p>
      </div></NuxtLink
    >
    <NuxtLink to="/admin/sms" class="dashboard-card"
      ><UiIcon name="sms" :size="30" />
      <div>
        <h2>گزارش پیامک‌ها</h2>
        <p>وضعیت ارسال، تحویل و تلاش‌های مجدد</p>
      </div></NuxtLink
    >
    <NuxtLink to="/admin/arya" class="dashboard-card"
      ><UiIcon name="database" :size="30" />
      <div>
        <h2>گزارش آریا</h2>
        <p>رسید دریافت موجودی و نتیجه پردازش درخواست‌ها</p>
      </div></NuxtLink
    >
    <NuxtLink to="/admin/customers" class="dashboard-card"
      ><UiIcon name="users" :size="30" />
      <div>
        <h2>مشتریان</h2>
        <p>سابقه پیامک‌ها و درخواست‌های موجودی هر مشتری</p>
      </div></NuxtLink
    >
    <NuxtLink to="/admin/education" class="dashboard-card"
      ><UiIcon name="education" :size="30" />
      <div>
        <h2>آموزش‌ها</h2>
        <p>جست‌وجوی آموزش‌ها و مشاهده در سایت فروشگاه</p>
      </div></NuxtLink
    >
    <NuxtLink to="/admin/sms-settings" class="dashboard-card"
      ><UiIcon name="settings" :size="30" />
      <div>
        <h2>تنظیمات پیامک</h2>
        <p>تنظیم الگوها و اطلاعات موردنیاز پیامک‌رسان</p>
      </div></NuxtLink
    >
  </div>
</template>
