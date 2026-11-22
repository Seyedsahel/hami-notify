<script setup lang="ts">
import type { SmsStatus } from "~/types/api";
import { smsStatusLabels } from "~/utils/labels";
defineProps<{ status: SmsStatus }>();
</script>
<template>
  <span
    class="badge"
    :class="
      ['delivered', 'accepted'].includes(status)
        ? 'badge-success'
        : ['failed', 'undelivered', 'review'].includes(status)
          ? 'badge-danger'
          : 'badge-pending'
    "
    >{{ smsStatusLabels[status] || status }}</span
  >
</template>
