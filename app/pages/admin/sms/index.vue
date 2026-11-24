<script setup lang="ts">
import type { SmsKind, SmsStatus } from "~/types/api";
import { smsStatusLabels, smsKindLabels } from "~/utils/labels";
import { normalizeSearch, faDigits, formatDate } from "~/utils/format";
definePageMeta({ layout: "admin" });
const store = useSmsStore();
const q = useQueryFilter("q");
const kind = useQueryFilter("kind");
const status = useQueryFilter("status");
const page = usePageNumber();
const { reload } = useListLoader(
  () => ({
    q: normalizeSearch(q.value),
    kind: (kind.value as SmsKind) || undefined,
    status: (status.value as SmsStatus) || undefined,
    page: page.value,
    limit: 20,
  }),
  store.fetchPage,
);
const statusOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  ...Object.entries(smsStatusLabels).map(([value, label]) => ({
    value,
    label,
  })),
];
const columns = [
  { key: "title", label: "عنوان" },
  { key: "masked_phone", label: "شماره مشتری" },
  { key: "kind", label: "نوع پیامک" },
  { key: "status", label: "وضعیت" },
  { key: "created_at", label: "زمان ثبت" },
  { key: "actions", label: "جزئیات" },
];
</script>
<template>
  <AdminHeading
    title="گزارش پیامک‌ها"
    description="پذیرش توسط پیامک‌رسان با تحویل به مشتری متفاوت است."
    ><UiButton variant="secondary" :loading="store.loading" @click="reload"
      >تازه‌سازی</UiButton
    ></AdminHeading
  >
  <div class="card">
    <div class="filters">
      <UiInput
        v-model="q"
        class="search-filter"
        label="جست‌وجو"
        type="search"
        placeholder="عنوان، شماره یا کد آموزش"
      /><UiSelect
        v-model="kind"
        label="نوع پیامک"
        :options="[
          { value: '', label: 'همه انواع' },
          { value: 'education', label: 'آموزش' },
          { value: 'stock', label: 'اطلاع موجودی' },
        ]"
      /><UiSelect v-model="status" label="وضعیت" :options="statusOptions" />
    </div>
    <UiAsyncState
      :loading="store.loading"
      :error="store.error?.message"
      @retry="reload"
    >
      <UiTable
        :rows="store.page?.items || []"
        :columns="columns"
        :row-key="(row) => row.id"
        caption="گزارش پیامک‌ها"
      >
        <template #masked_phone="{ row }"
          ><span class="ltr">{{
            faDigits(row.masked_phone || "")
          }}</span></template
        ><template #kind="{ row }">{{ smsKindLabels[row.kind] }}</template
        ><template #status="{ row }"
          ><SmsStatus :status="row.status" /></template
        ><template #created_at="{ row }">{{
          formatDate(row.created_at)
        }}</template
        ><template #actions="{ row }"
          ><NuxtLink class="button button-secondary" :to="`/admin/sms/${row.id}`"
            >مشاهده جزئیات</NuxtLink
          ></template
        >
      </UiTable>
    </UiAsyncState>
    <UiPagination
      :page="page"
      :has-more="store.page?.has_more || false"
      :disabled="store.loading"
      @change="page = $event"
    />
  </div>
</template>
