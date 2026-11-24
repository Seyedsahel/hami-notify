<script setup lang="ts">
import type { AriaOutcome } from "~/types/api";
import { outcomeLabels } from "~/utils/labels";
import { faDigits, formatDate } from "~/utils/format";
definePageMeta({ layout: "admin" });
const store = useAriaStore();
const q = useQueryFilter("q");
const outcome = useQueryFilter("outcome");
const page = usePageNumber();
const { reload } = useListLoader(
  () => ({
    q: q.value.trim(),
    outcome: (outcome.value as AriaOutcome) || undefined,
    page: page.value,
    limit: 20,
  }),
  store.fetchPage,
);
const outcomes = [
  { value: "", label: "همه نتایج" },
  ...Object.entries(outcomeLabels).map(([value, label]) => ({ value, label })),
];
const columns = [
  { key: "request_id", label: "شناسه درخواست" },
  { key: "outcome", label: "نتیجه پردازش" },
  { key: "item_count", label: "تعداد اقلام" },
  { key: "received_at", label: "زمان دریافت" },
  { key: "actions", label: "رسید" },
];
</script>
<template>
  <AdminHeading
    title="گزارش آریا"
    description="رسید دریافت و پردازش موجودی ارسال‌شده از آریا"
    ><UiButton variant="secondary" :loading="store.loading" @click="reload"
      >تازه‌سازی</UiButton
    ></AdminHeading
  >
  <div class="card">
    <div class="filters">
      <UiInput
        v-model="q"
        class="search-filter"
        label="شناسه درخواست"
        type="search"
        maxlength="26"
      /><UiSelect v-model="outcome" label="نتیجه پردازش" :options="outcomes" />
    </div>
    <UiAsyncState
      :loading="store.loading"
      :error="store.error?.message"
      @retry="reload"
      ><UiTable
        :rows="store.page?.items || []"
        :columns="columns"
        :row-key="(row) => row.request_id"
        caption="رسیدهای دریافت موجودی آریا"
        ><template #request_id="{ row }"
          ><span class="ltr small">{{ row.request_id }}</span></template
        ><template #outcome="{ row }"
          ><span
            class="badge"
            :class="
              row.outcome === 'success' ? 'badge-success' : 'badge-danger'
            "
            >{{ outcomeLabels[row.outcome] }}</span
          ></template
        ><template #item_count="{ row }">{{
          faDigits(row.item_count)
        }}</template
        ><template #received_at="{ row }">{{
          formatDate(row.received_at)
        }}</template
        ><template #actions="{ row }"
          ><NuxtLink class="button button-secondary" :to="`/admin/arya/${row.request_id}`"
            >مشاهده رسید</NuxtLink
          ></template
        ></UiTable
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
