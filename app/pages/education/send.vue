<script setup lang="ts">
import type { EducationSummary, SmsMessage } from "~/types/api";
import { ApiError, getApiErrorMessage } from "~/utils/api-error";
import { normalizeSearch } from "~/utils/format";
import { smsStatusLabels } from "~/utils/labels";
const education = useEducationStore();
const sms = useSmsStore();
const toast = useToast();
const confirm = useConfirm();
const q = ref("");
const page = ref(1);
const selectedId = ref("");
const selected = shallowRef<EducationSummary | null>(null);
const phone = ref("");
const step = ref(1);
const busy = ref(false);
const error = shallowRef<ApiError | null>(null);
const result = shallowRef<SmsMessage | null>(null);
const resultTone = computed(() =>
  !result.value || ["queued", "sending"].includes(result.value.status)
    ? "pending"
    : ["failed", "undelivered", "review"].includes(result.value.status)
      ? "danger"
      : "success",
);
let confirmation: { signature: string; key: string } | undefined;
watch(q, () => {
  page.value = 1;
  selectedId.value = "";
});
const { reload } = useListLoader(
  () => ({ q: normalizeSearch(q.value), page: page.value, limit: 10 }),
  education.fetchPage,
);
const items = computed(() =>
  (education.page?.items || []).map((item) => ({
    id: item.slug,
    name: item.title,
    meta: item.summary || item.slug,
  })),
);
function next() {
  selected.value =
    education.page?.items.find((item) => item.slug === selectedId.value) ??
    null;
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
  result.value = null;
  error.value = null;
  confirmation = undefined;
}
async function submit() {
  if (!selected.value || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    if (
      !(await confirm.ask(
        `لینک «${selected.value.title}» برای شماره ${phone.value} ارسال شود؟`,
        "ارسال لینک",
      ))
    )
      return;
    const signature = `${selected.value.slug}:${phone.value}`;
    if (confirmation?.signature !== signature)
      confirmation = { signature, key: crypto.randomUUID() };
    result.value = await sms.sendEducation(
      { slug: selected.value.slug, phone: phone.value },
      confirmation.key,
    );
    toast.success("درخواست ارسال لینک ثبت شد.");
  } catch (cause) {
    error.value =
      cause instanceof ApiError
        ? cause
        : new ApiError("ارسال درخواست انجام نشد.", { kind: "network" });
    toast.error(getApiErrorMessage(cause));
  } finally {
    busy.value = false;
  }
}
useShortcuts((event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    back();
  }
});
</script>
<template>
  <CounterHeader title="آموزش" :busy="busy" @back="back" />
  <div class="counter-body">
    <CounterSteps :step="step" />
    <CounterSelection
      v-if="step === 1"
      v-model:query="q"
      v-model:selected="selectedId"
      :items="items"
      :loading="education.loading"
      :error="education.error?.message"
      :page="page"
      :has-more="education.page?.has_more || false"
      @next="next"
      @retry="reload"
      @change-page="
        page = $event;
        selectedId = '';
      "
    />
    <CounterReceipt
      v-else-if="result"
      title="درخواست ارسال ثبت شد"
      :tone="resultTone"
      note="وضعیت فعلی ارسال در ادامه آمده است. جزئیات و نتیجه تحویل را در گزارش پیامک‌ها دنبال کنید."
      :entries="[
        { label: 'آموزش', value: selected?.title || '' },
        { label: 'شماره مشتری', value: phone },
        { label: 'وضعیت ارسال', value: smsStatusLabels[result.status] },
      ]"
      @next="nextCustomer"
      @choose="
        nextCustomer();
        step = 1;
        selectedId = '';
      "
      ><NuxtLink class="button button-secondary" :to="`/admin/sms/${result.id}`"
        >جزئیات ارسال و تحویل</NuxtLink
      ></CounterReceipt
    >
    <template v-else-if="selected">
      <div class="selected-summary">
        <UiIcon name="education" />
        <div>
          <strong>{{ selected.title }}</strong>
        </div>
        <UiButton variant="ghost" :disabled="busy" @click="back"
          >تغییر</UiButton
        >
      </div>
      <div class="section-heading">
        <h2>لینک را برای چه شماره‌ای بفرستیم؟</h2>
        <p>لینک آموزش با پیامک برای مشتری ارسال می‌شود.</p>
      </div>
      <CounterCustomerForm
        v-model:phone="phone"
        :busy="busy"
        :error="error?.message"
        :backend-field="error?.field"
        @submit="submit"
      />
    </template>
  </div>
</template>
