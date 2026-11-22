<script setup lang="ts">
import type { Category, QueueStatus } from "~/types/api";
import { faDigits, normalizeSearch } from "~/utils/format";
definePageMeta({ layout: "admin" });
const store = useStockQueueStore();
const options = useStockRequestOptionsStore();
const q = useQueryFilter("q");
const category = useQueryFilter("category");
const status = useQueryFilter("status", "ready");
const page = usePageNumber();
const { reload } = useListLoader(
  () => ({
    q: normalizeSearch(q.value),
    category: (category.value as Category) || undefined,
    status: status.value as QueueStatus | "all",
    page: page.value,
    limit: 20,
  }),
  store.fetchPage,
);
onMounted(() => {
  void options.fetchOptions().catch(() => {});
});
const columns = [
  { key: "name", label: "محصول" },
  { key: "code", label: "کد آریا" },
  { key: "quantity", label: "موجودی" },
  { key: "ready_count", label: "آماده اطلاع‌رسانی" },
  { key: "waiting_count", label: "در انتظار موجودی" },
  { key: "actions", label: "بررسی صف" },
];
</script>
<template>
  <AdminHeading
    title="صف اطلاع موجودی"
    description="وضعیت صف براساس موجودی فعلی آریا نمایش داده می‌شود."
    ><UiButton variant="secondary" :loading="store.loading" @click="reload"
      >تازه‌سازی</UiButton
    ></AdminHeading
  >
  <div class="card">
    <div class="filters">
      <UiInput
        v-model="q"
        class="search-filter"
        label="جست‌وجوی محصول"
        type="search"
        placeholder="نام یا کد آریا"
      /><UiSelect
        v-model="category"
        label="دسته‌بندی درخواست"
        :options="[
          { value: '', label: 'همه دسته‌بندی‌ها' },
          ...(options.options?.categories || []),
        ]"
      /><UiSelect
        v-model="status"
        label="وضعیت"
        :options="[
          { value: 'ready', label: 'آماده اطلاع‌رسانی' },
          { value: 'waiting', label: 'در انتظار موجودی' },
          { value: 'all', label: 'همه محصولات' },
        ]"
      />
    </div>
    <p v-if="options.error" class="error-panel">
      دریافت دسته‌بندی‌ها انجام نشد.
      <button
        class="text-link"
        @click="options.fetchOptions(true).catch(() => {})"
      >
        تلاش مجدد
      </button>
    </p>
    <UiAsyncState
      :loading="store.loading"
      :error="store.error?.message"
      @retry="reload"
    >
      <UiTable
        :rows="store.page?.items || []"
        :columns="columns"
        :row-key="(row) => row.code"
        caption="محصولات صف اطلاع موجودی"
      >
        <template #code="{ row }"
          ><span class="ltr">{{ faDigits(row.code) }}</span></template
        >
        <template #quantity="{ row }">{{ faDigits(row.quantity) }}</template>
        <template #ready_count="{ row }">{{
          faDigits(row.ready_count)
        }}</template>
        <template #waiting_count="{ row }">{{
          faDigits(row.waiting_count)
        }}</template>
        <template #actions="{ row }"
          ><NuxtLink
            class="text-link"
            :to="`/admin/stock-queue/${encodeURIComponent(row.code)}`"
            >بررسی درخواست‌ها</NuxtLink
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
