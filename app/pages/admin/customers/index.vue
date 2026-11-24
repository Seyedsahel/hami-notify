<script setup lang="ts">
import { faDigits, formatDate, normalizeDigits } from "~/utils/format";
definePageMeta({ layout: "admin" });
const store = useCustomersStore();
const q = useQueryFilter("q");
const sent = useQueryFilter("has_sent_sms", "true");
const page = usePageNumber();
const { reload } = useListLoader(
  () => ({
    q: normalizeDigits(q.value.trim()),
    has_sent_sms: sent.value === "" ? undefined : sent.value === "true",
    page: page.value,
    limit: 20,
  }),
  store.fetchPage,
);
const columns = [
  { key: "phone", label: "شماره مشتری" },
  { key: "sent_sms_count", label: "پیامک پذیرفته‌شده" },
  { key: "sms_count", label: "کل پیامک‌ها" },
  { key: "stock_request_count", label: "درخواست‌های موجودی" },
  { key: "last_activity_at", label: "آخرین فعالیت" },
];
</script>
<template>
  <AdminHeading
    title="مشتریان"
    description="تعداد پیامک‌های پذیرفته‌شده به معنی تحویل قطعی به مشتری نیست."
  />
  <div class="card">
    <div class="filters">
      <UiInput
        v-model="q"
        class="search-filter"
        label="جست‌وجوی شماره مشتری"
        type="search"
      /><UiSelect
        v-model="sent"
        label="سابقه ارسال"
        :options="[
          { value: 'true', label: 'دارای پیامک پذیرفته‌شده' },
          { value: 'false', label: 'بدون پیامک پذیرفته‌شده' },
          { value: '', label: 'همه مشتریان' },
        ]"
      />
    </div>
    <UiAsyncState
      :loading="store.loading"
      :error="store.error?.message"
      @retry="reload"
      ><UiTable
        class="customer-table"
        :rows="store.page?.items || []"
        :columns="columns"
        :row-key="(row) => row.phone"
        caption="فهرست مشتریان"
        ><template #phone="{ row }"
          ><NuxtLink
            class="text-link ltr customer-row-link"
            :to="`/admin/customers/${row.phone}`"
            >{{ faDigits(row.phone) }}</NuxtLink
          ></template
        ><template #sent_sms_count="{ row }">{{
          faDigits(row.sent_sms_count)
        }}</template
        ><template #sms_count="{ row }">{{ faDigits(row.sms_count) }}</template
        ><template #stock_request_count="{ row }">{{
          faDigits(row.stock_request_count)
        }}</template
        ><template #last_activity_at="{ row }">{{
          formatDate(row.last_activity_at)
        }}</template></UiTable
      ></UiAsyncState
    >
    <UiPagination
      :page="page"
      :has-more="store.page?.has_more || false"
      :disabled="store.loading"
      @change="page = $event"
    />
  </div>
</template>

<style scoped>
.customer-table :deep(tbody tr) {
  position: relative;
}
.customer-row-link::after {
  content: "";
  position: absolute;
  inset: 0;
}
.customer-table :deep(tbody tr:has(.customer-row-link):hover) {
  background: var(--selected);
}
.customer-table :deep(tbody tr:focus-within) {
  outline: 2px solid var(--forest);
  outline-offset: -2px;
}
</style>
