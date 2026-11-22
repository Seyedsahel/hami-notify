<script setup lang="ts">
import { faDigits, formatDate } from "~/utils/format";
import { categoryLabels, priorityLabels, smsKindLabels } from "~/utils/labels";
definePageMeta({ layout: "admin" });
const route = useRoute();
const store = useCustomersStore();
const phone = computed(() => String(route.params.phone));
const stockPageQuery = useQueryFilter("stock_page", "1");
const smsPageQuery = useQueryFilter("sms_page", "1");
const stockPage = computed(() =>
  Math.max(1, Number.parseInt(stockPageQuery.value, 10) || 1),
);
const smsPage = computed(() =>
  Math.max(1, Number.parseInt(smsPageQuery.value, 10) || 1),
);
const { reload } = useListLoader(
  () => ({
    phone: phone.value,
    query: { stock_page: stockPage.value, sms_page: smsPage.value, limit: 20 },
  }),
  store.fetchDetail,
);
const stockColumns = [
  { key: "product_name", label: "محصول" },
  { key: "product_code", label: "کد آریا" },
  { key: "category", label: "دسته‌بندی" },
  { key: "priority", label: "اولویت" },
  { key: "status", label: "وضعیت" },
  { key: "created_at", label: "زمان ثبت" },
];
const smsColumns = [
  { key: "title", label: "عنوان" },
  { key: "kind", label: "نوع" },
  { key: "status", label: "وضعیت" },
  { key: "created_at", label: "زمان ثبت" },
  { key: "actions", label: "جزئیات" },
];
</script>
<template>
  <AdminHeading :title="`پرونده مشتری ${faDigits(phone)}`"
    ><NuxtLink class="button button-secondary" to="/admin/customers"
      >فهرست مشتریان</NuxtLink
    ></AdminHeading
  >
  <UiAsyncState
    :loading="store.detailLoading"
    :error="store.detailError?.message"
    @retry="reload"
    ><div v-if="store.detail" class="stack">
      <div class="card">
        <dl class="detail-grid">
          <div>
            <dt>شماره مشتری</dt>
            <dd class="ltr">{{ faDigits(store.detail.customer.phone) }}</dd>
          </div>
          <div>
            <dt>آخرین فعالیت</dt>
            <dd>{{ formatDate(store.detail.customer.last_activity_at) }}</dd>
          </div>
          <div>
            <dt>پیامک‌های پذیرفته‌شده</dt>
            <dd>{{ faDigits(store.detail.customer.sent_sms_count) }}</dd>
          </div>
        </dl>
      </div>
      <div class="card stack">
        <h2>درخواست‌های موجودی</h2>
        <UiTable
          :rows="store.detail.stock_requests.items || []"
          :columns="stockColumns"
          :row-key="(row) => row.id"
          caption="درخواست‌های موجودی مشتری"
          ><template #product_code="{ row }"
            ><span class="ltr">{{ faDigits(row.product_code) }}</span></template
          ><template #category="{ row }">{{
            categoryLabels[row.category]
          }}</template
          ><template #priority="{ row }">{{
            priorityLabels[row.priority]
          }}</template
          ><template #status="{ row }"
            ><span class="badge">{{
              row.status === "sent"
                ? "اطلاع‌رسانی‌شده"
                : row.status === "ready"
                  ? "آماده اطلاع‌رسانی"
                  : "در انتظار موجودی"
            }}</span></template
          ><template #created_at="{ row }">{{
            formatDate(row.created_at)
          }}</template></UiTable
        ><UiPagination
          :page="stockPage"
          :has-more="store.detail.stock_requests.has_more"
          @change="stockPageQuery = String($event)"
        />
      </div>
      <div class="card stack">
        <h2>سابقه پیامک‌ها</h2>
        <UiTable
          :rows="store.detail.sms.items || []"
          :columns="smsColumns"
          :row-key="(row) => row.id"
          caption="سابقه پیامک‌های مشتری"
          ><template #kind="{ row }">{{ smsKindLabels[row.kind] }}</template
          ><template #status="{ row }"
            ><SmsStatus :status="row.status" /></template
          ><template #created_at="{ row }">{{
            formatDate(row.created_at)
          }}</template
          ><template #actions="{ row }"
            ><NuxtLink class="text-link" :to="`/admin/sms/${row.id}`"
              >مشاهده پیامک</NuxtLink
            ></template
          ></UiTable
        ><UiPagination
          :page="smsPage"
          :has-more="store.detail.sms.has_more"
          @change="smsPageQuery = String($event)"
        />
      </div></div
  ></UiAsyncState>
</template>
