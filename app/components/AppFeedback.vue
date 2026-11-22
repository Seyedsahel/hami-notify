<script setup lang="ts">
const toast = useToast();
const confirm = useConfirm();
</script>
<template>
  <div class="toasts" aria-label="پیام‌های سامانه">
    <div
      v-for="item in toast.messages.value"
      :key="item.id"
      class="toast"
      :class="item.kind"
      :role="item.kind === 'error' ? 'alert' : 'status'"
    >
      <p>{{ item.message }}</p>
      <button
        class="icon-button"
        aria-label="بستن پیام"
        @click="toast.dismiss(item.id)"
      >
        <UiIcon name="close" :size="18" />
      </button>
    </div>
  </div>
  <UiModal
    :open="!!confirm.prompt.value"
    :title="confirm.prompt.value?.title || 'تأیید عملیات'"
    @close="confirm.answer(false)"
  >
    <p>{{ confirm.prompt.value?.message }}</p>
    <div class="actions">
      <UiButton @click="confirm.answer(true)">{{
        confirm.prompt.value?.action
      }}</UiButton><UiButton variant="secondary" @click="confirm.answer(false)"
        >انصراف</UiButton
      >
    </div>
  </UiModal>
</template>
