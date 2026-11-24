<script setup lang="ts">
import type { Category, Priority, QueueStatus } from "~/types/api";
import { faDigits, formatDate, normalizeDigits } from "~/utils/format";
import { categoryLabels, priorityLabels } from "~/utils/labels";
import { getApiErrorMessage } from "~/utils/api-error";
definePageMeta({ layout: "admin" });
const route = useRoute();
const code = computed(() => String(route.params.code));
const requests = useStockRequestsStore();
const queue = useStockQueueStore();
const sms = useSmsStore();
const options = useStockRequestOptionsStore();
const toast = useToast();
const confirm = useConfirm();
const phone = useQueryFilter("phone");
const category = useQueryFilter("category");
const priority = useQueryFilter("priority");
const status = useQueryFilter("status", "all");
const page = usePageNumber();
const selected = ref<string[]>([]);
const busy = ref(false);
const title = computed(
  () =>
    queue.page?.items.find((item) => item.code === code.value)?.name ||
    `کد آریا ${faDigits(code.value)}`,
);
const query = () => ({
  product_code: code.value,
  phone: normalizeDigits(phone.value),
  category: (category.value as Category) || undefined,
  priority: (priority.value as Priority) || undefined,
  status: status.value as QueueStatus | "all",
  page: page.value,
  limit: 20,
});
const { reload } = useListLoader(query, requests.fetchPage);
watch([code, phone, category, priority, status], () => {
  selected.value = [];
});
onMounted(() => {
  void options.fetchOptions().catch(() => {});
});
function selectPage() {
  const ids =
    requests.page?.items
      .filter((item) => item.status === "ready")
      .map((item) => item.id) || [];
  selected.value = [...new Set([...selected.value, ...ids])].slice(0, 100);
}
async function send() {
  if (busy.value || !selected.value.length) return;
  busy.value = true;
  const productCode = code.value;
  const requestIds = [...selected.value];
  try {
    if (
      !(await confirm.ask(
        `برای ${faDigits(selected.value.length)} درخواست محصول «${title.value}» پیامک اطلاع موجودی ثبت شود؟`,
        "ثبت ارسال پیامک",
      ))
    )
      return;
    const messages = await sms.sendStock({
      product_code: productCode,
      request_ids: requestIds,
    });
    selected.value = [];
    toast.success(`${faDigits(messages.length)} درخواست ارسال پیامک ثبت شد.`);
    await reload();
  } catch (cause) {
    toast.error(getApiErrorMessage(cause));
    selected.value = [];
    await reload();
  } finally {
    busy.value = false;
  }
}
const columns = [
  { key: "select", label: "انتخاب" },
  { key: "phone", label: "شماره مشتری" },
  { key: "category", label: "دسته‌بندی" },
  { key: "priority", label: "اولویت" },
  { key: "status", label: "وضعیت" },
  { key: "created_at", label: "زمان ثبت" },
];
</script>
<template>
  <AdminHeading
    :title="title"
    description="درخواست‌ها با اولویت بالاتر و سپس زمان ثبت قدیمی‌تر مرتب شده‌اند."
    ><NuxtLink class="button button-secondary" to="/admin/stock-queue"
      >فهرست محصولات</NuxtLink
    ></AdminHeading
  >
  <div class="card stack">
    <p class="muted small">
      موجودی مثبت همه درخواست‌های فعال را آماده می‌کند. حداکثر ۱۰۰ درخواست همین
      محصول را انتخاب کنید؛ انتخاب‌ها بین صفحات حفظ می‌شوند.
    </p>
    <div class="filters">
      <UiInput
        v-model="phone"
        label="شماره مشتری"
        type="search"
        :disabled="busy"
      /><UiSelect
        v-model="category"
        label="دسته‌بندی"
        :disabled="busy"
        :options="[
          { value: '', label: 'همه دسته‌بندی‌ها' },
          ...(options.options?.categories || []),
        ]"
      /><UiSelect
        v-model="priority"
        label="اولویت"
        :disabled="busy"
        :options="[
          { value: '', label: 'همه اولویت‌ها' },
          ...(options.options?.priorities || []),
        ]"
      /><UiSelect
        v-model="status"
        label="وضعیت"
        :disabled="busy"
        :options="[
          { value: 'all', label: 'همه درخواست‌ها' },
          { value: 'ready', label: 'آماده اطلاع‌رسانی' },
          { value: 'waiting', label: 'در انتظار موجودی' },
        ]"
      />
    </div>
    <div class="selection-bar">
      <span>{{ faDigits(selected.length) }} درخواست انتخاب شده</span>
      <div class="actions">
        <UiButton
          variant="secondary"
          :disabled="busy || requests.loading || !!requests.error"
          @click="selectPage"
          >انتخاب آماده‌های این صفحه</UiButton
        ><UiButton
          variant="ghost"
          :disabled="busy || !selected.length"
          @click="selected = []"
          >پاک کردن انتخاب‌ها</UiButton
        ><UiButton
          :disabled="!selected.length || requests.loading || !!requests.error"
          :loading="busy"
          @click="send"
          >ارسال اطلاع موجودی</UiButton
        >
      </div>
    </div>
    <UiAsyncState
      :loading="requests.loading"
      :error="requests.error?.message"
      @retry="reload"
    >
      <UiTable
        :rows="requests.page?.items || []"
        :columns="columns"
        :row-key="(row) => row.id"
        caption="درخواست‌های موجودی محصول"
      >
        <template #select="{ row }"
          ><input
            v-model="selected"
            type="checkbox"
            :value="row.id"
            :aria-label="`انتخاب درخواست ${row.phone}`"
            :disabled="
              busy ||
              row.status !== 'ready' ||
              (selected.length >= 100 && !selected.includes(row.id))
            "
        /></template>
        <template #phone="{ row }"
          ><NuxtLink
            class="text-link ltr"
            :to="`/admin/customers/${row.phone}`"
            >{{ faDigits(row.phone) }}</NuxtLink
          ></template
        >
        <template #category="{ row }">
          <span
            class="badge"
            :class="{
              'badge-pink': row.category === 'cosmetics',
              'badge-green': row.category === 'medicines',
              'badge-blue': row.category === 'supplements',
            }"
            >{{ categoryLabels[row.category] }}</span
          >
        </template>
        <template #priority="{ row }">
          <span
            class="badge"
            :class="{
              'badge-red': row.priority === 'urgent',
              'badge-orange': row.priority === 'high',
              'badge-yellow': row.priority === 'normal',
            }"
            >{{ priorityLabels[row.priority] }}</span
          >
        </template>
        <template #status="{ row }"
          ><span
            class="badge"
            :class="row.status === 'ready' ? 'badge-success' : 'badge-pending'"
            >{{
              row.status === "ready" ? "آماده اطلاع‌رسانی" : "در انتظار موجودی"
            }}</span
          ></template
        >
        <template #created_at="{ row }">{{
          formatDate(row.created_at)
        }}</template>
      </UiTable>
    </UiAsyncState>
    <UiPagination
      :page="page"
      :has-more="requests.page?.has_more || false"
      :disabled="requests.loading || busy"
      @change="page = $event"
    />
  </div>
</template>
