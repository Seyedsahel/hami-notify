<script setup lang="ts">
import type { Product, StockRequest, Category, Priority } from "~/types/api";
import { ApiError, getApiErrorMessage } from "~/utils/api-error";
import { normalizeSearch, faDigits } from "~/utils/format";
const products = useProductsStore();
const requests = useStockRequestsStore();
const options = useStockRequestOptionsStore();
const toast = useToast();
const q = ref("");
const page = ref(1);
const selectedId = ref("");
const selected = shallowRef<Product | null>(null);
const phone = ref("");
const category = ref("");
const priority = ref("normal");
const step = ref(1);
const busy = ref(false);
const error = shallowRef<ApiError | null>(null);
const result = shallowRef<StockRequest | null>(null);
watch(q, () => {
  page.value = 1;
  selectedId.value = "";
});
const { reload } = useListLoader(
  () => ({ q: normalizeSearch(q.value), page: page.value, limit: 10 }),
  products.fetchPage,
);
const items = computed(() =>
  (products.page?.items || []).map((item) => ({
    id: item.code,
    name: item.name,
    meta: `کد آریا: ${faDigits(item.code)}`,
  })),
);
async function loadOptions() {
  try {
    await options.fetchOptions();
  } catch {
    /* Shown beside the form. */
  }
}
onMounted(loadOptions);
function next() {
  selected.value =
    products.page?.items.find((item) => item.code === selectedId.value) ?? null;
  if (selected.value) step.value = 2;
}
function back() {
  if (busy.value) return;
  if (step.value === 2) {
    step.value = 1;
    result.value = null;
    error.value = null;
  } else void navigateTo("/");
}
function nextCustomer() {
  phone.value = "";
  priority.value = "normal";
  result.value = null;
  error.value = null;
}
async function submit() {
  if (!selected.value || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    result.value = await requests.register({
      product_code: selected.value.code,
      phone: phone.value,
      category: category.value as Category,
      priority: priority.value as Priority,
    });
    toast.success("درخواست موجودی ثبت شد.");
  } catch (cause) {
    error.value =
      cause instanceof ApiError
        ? cause
        : new ApiError("ثبت درخواست انجام نشد.", { kind: "network" });
    toast.error(getApiErrorMessage(cause));
  } finally {
    busy.value = false;
  }
}
const savedPriority = computed(
  () =>
    options.options?.priorities.find(
      (item) => item.value === result.value?.priority,
    )?.label || "",
);
const savedCategory = computed(
  () =>
    options.options?.categories.find(
      (item) => item.value === result.value?.category,
    )?.label || "",
);
useShortcuts((event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    back();
  }
});
</script>
<template>
  <CounterHeader title="اطلاع موجودی" :busy="busy" @back="back" />
  <div class="counter-body">
    <CounterSteps :step="step" stock />
    <CounterSelection
      v-if="step === 1"
      v-model:query="q"
      v-model:selected="selectedId"
      stock
      :items="items"
      :loading="products.loading"
      :error="products.error?.message"
      :page="page"
      :has-more="products.page?.has_more || false"
      @next="next"
      @retry="reload"
      @change-page="
        page = $event;
        selectedId = '';
      "
    />
    <CounterReceipt
      v-else-if="result"
      title="درخواست ثبت شد"
      note="اطلاعات نهایی درخواست در ادامه آمده است. ثبت مجدد یک شماره برای همین محصول، دسته‌بندی قبلی و بالاترین اولویت را حفظ می‌کند."
      :entries="[
        { label: 'محصول', value: selected?.name || '' },
        { label: 'شماره مشتری', value: result.phone },
        { label: 'دسته‌بندی', value: savedCategory },
        { label: 'اولویت', value: savedPriority },
      ]"
      @next="nextCustomer"
      @choose="
        nextCustomer();
        step = 1;
        selectedId = '';
      "
    />
    <template v-else-if="selected">
      <div class="selected-summary">
        <UiIcon name="package" />
        <div>
          <strong>{{ selected.name }}</strong><small
            >کد آریا: {{ faDigits(selected.code) }}</small
          >
        </div>
        <UiButton variant="ghost" :disabled="busy" @click="back"
          >تغییر</UiButton
        >
      </div>
      <div class="section-heading">
        <h2>مشتری را در صف ثبت کنید</h2>
        <p>دسته‌بندی و اولویت درخواست را مشخص کنید.</p>
      </div>
      <UiAsyncState
        :loading="options.loading"
        :error="options.error?.message"
        @retry="loadOptions"
      />
      <CounterCustomerForm
        v-model:phone="phone"
        v-model:category="category"
        v-model:priority="priority"
        stock
        :options="options.options"
        :busy="busy"
        :unavailable="!options.options || options.loading"
        :error="error?.message"
        :backend-field="error?.field"
        @submit="submit"
      />
    </template>
  </div>
</template>
