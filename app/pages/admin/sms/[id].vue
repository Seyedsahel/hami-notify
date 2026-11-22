<script setup lang="ts">
import { faDigits, formatDate } from "~/utils/format";
import { smsKindLabels, smsStatusLabels } from "~/utils/labels";
import { getApiErrorMessage } from "~/utils/api-error";
definePageMeta({ layout: "admin" });
const route = useRoute();
const store = useSmsStore();
const toast = useToast();
const confirm = useConfirm();
const busy = ref(false);
const { reload } = useListLoader(
  () => String(route.params.id),
  store.fetchDetail,
  0,
);
async function act(action: "retry" | "refresh") {
  if (busy.value) return;
  busy.value = true;
  try {
    const id = String(route.params.id);
    if (action === "retry") {
      if (
        !(await confirm.ask(
          "ارسال این پیامک با همان اطلاعات و الگوی قبلی دوباره تلاش شود؟",
          "تلاش مجدد ارسال",
        ))
      )
        return;
      await store.retry(id);
      toast.success("درخواست تلاش مجدد ثبت شد.");
    } else {
      await store.refreshDelivery(id);
      toast.success("وضعیت تحویل به‌روزرسانی شد.");
    }
    await reload();
  } catch (cause) {
    toast.error(getApiErrorMessage(cause));
  } finally {
    busy.value = false;
  }
}
const columns = [
  { key: "number", label: "تلاش" },
  { key: "status", label: "نتیجه" },
  { key: "started_at", label: "شروع" },
  { key: "finished_at", label: "پایان" },
  { key: "error_code", label: "کد خطا" },
];
</script>
<template>
  <AdminHeading title="جزئیات پیامک"
    ><NuxtLink class="button button-secondary" to="/admin/sms"
      >گزارش پیامک‌ها</NuxtLink
    ></AdminHeading
  >
  <UiAsyncState
    :loading="store.detailLoading"
    :error="store.detailError?.message"
    @retry="reload"
  >
    <div v-if="store.detail" class="stack">
      <div class="card stack">
        <h2>{{ store.detail.message.title }}</h2>
        <dl class="detail-grid">
          <div>
            <dt>شماره مشتری</dt>
            <dd class="ltr">
              {{ faDigits(store.detail.message.masked_phone || "") }}
            </dd>
          </div>
          <div>
            <dt>نوع پیامک</dt>
            <dd>{{ smsKindLabels[store.detail.message.kind] }}</dd>
          </div>
          <div>
            <dt>وضعیت</dt>
            <dd><SmsStatus :status="store.detail.message.status" /></dd>
          </div>
          <div>
            <dt>زمان ثبت</dt>
            <dd>{{ formatDate(store.detail.message.created_at) }}</dd>
          </div>
          <div>
            <dt>آخرین تغییر</dt>
            <dd>{{ formatDate(store.detail.message.updated_at) }}</dd>
          </div>
          <div v-if="store.detail.message.error_code">
            <dt>کد خطا</dt>
            <dd class="ltr">{{ store.detail.message.error_code }}</dd>
          </div>
        </dl>
        <p v-if="store.detail.message.status === 'review'" class="error-panel">
          نتیجه این ارسال مشخص نیست و نیاز به بررسی دارد. برای جلوگیری از ارسال
          تکراری، تلاش مجدد خودکار در دسترس نیست.
        </p>
        <div class="actions">
          <UiButton
            v-if="store.detail.message.status === 'failed'"
            :loading="busy"
            @click="act('retry')"
            >تلاش مجدد ارسال</UiButton
          ><UiButton
            variant="secondary"
            :loading="busy"
            :disabled="!store.detail.message.provider_id"
            @click="act('refresh')"
            >بررسی وضعیت تحویل</UiButton
          ><UiButton variant="ghost" :disabled="busy" @click="reload"
            >تازه‌سازی اطلاعات</UiButton
          >
        </div>
      </div>
      <div class="card stack">
        <h2>تلاش‌های ارسال</h2>
        <UiTable
          :rows="store.detail.attempts || []"
          :columns="columns"
          :row-key="(row) => String(row.number)"
          caption="تلاش‌های ارسال پیامک"
          ><template #number="{ row }">{{ faDigits(row.number) }}</template
          ><template #status="{ row }">{{
            smsStatusLabels[row.status]
          }}</template
          ><template #started_at="{ row }">{{
            formatDate(row.started_at)
          }}</template
          ><template #finished_at="{ row }">{{
            formatDate(row.finished_at)
          }}</template></UiTable
        >
      </div>
    </div>
  </UiAsyncState>
</template>
