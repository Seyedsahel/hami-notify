<template>
  <a class="skip-link" href="#dashboard-main">رفتن به محتوای صفحه</a>
  <div class="dashboard">
    <AdminHeader />
    <main id="dashboard-main" class="dashboard-main">
      <SessionNotice /><slot />
    </main>
  </div>
</template>
