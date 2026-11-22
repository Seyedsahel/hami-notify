<script setup lang="ts">
import { outcomeLabels } from "~/utils/labels";
import { faDigits, formatDate } from "~/utils/format";
definePageMeta({ layout: "admin" });
const route = useRoute();
const store = useAriaStore();
const { reload } = useListLoader(
  () => String(route.params.requestId),
  store.fetchDetail,
  0,
);
</script>
<template>
  <AdminHeading title="رسید دریافت موجودی"
    ><NuxtLink class="button button-secondary" to="/admin/arya"
      >گزارش آریا</NuxtLink
    ></AdminHeading
  >
  <UiAsyncState
    :loading="store.detailLoading"
    :error="store.detailError?.message"
    @retry="reload"
    ><div v-if="store.detail" class="card">
      <dl class="detail-grid">
        <div>
          <dt>شناسه درخواست</dt>
          <dd class="ltr">{{ store.detail.request_id }}</dd>
        </div>
        <div>
          <dt>نتیجه پردازش</dt>
          <dd>{{ outcomeLabels[store.detail.outcome] }}</dd>
        </div>
        <div>
          <dt>تعداد اقلام</dt>
          <dd>{{ faDigits(store.detail.item_count) }}</dd>
        </div>
        <div>
          <dt>زمان پردازش</dt>
          <dd>{{ faDigits(store.detail.duration_ms) }} میلی‌ثانیه</dd>
        </div>
        <div>
          <dt>زمان دریافت</dt>
          <dd>{{ formatDate(store.detail.received_at) }}</dd>
        </div>
      </dl>
    </div></UiAsyncState
  >
</template>
