<script setup lang="ts">
import { onBeforeRouteLeave } from "vue-router";
import type { SmsSettings, SmsBinding } from "~/types/api";
import { getApiErrorMessage } from "~/utils/api-error";
import { normalizeDigits } from "~/utils/format";
definePageMeta({ layout: "admin" });
const store = useSmsSettingsStore();
const patterns = useSmsPatternsStore();
const toast = useToast();
const confirm = useConfirm();
const draft = ref<SmsSettings | null>(null);
const retryText = ref("3");
const baseline = ref("");
const formError = ref("");
const busy = ref(false);
const q = ref("");
const patternPage = ref(1);
const dirty = computed(
  () =>
    !!draft.value &&
    JSON.stringify({ settings: draft.value, retries: retryText.value }) !==
      baseline.value,
);
watch(q, () => {
  patternPage.value = 1;
});
const { reload: reloadPatterns } = useListLoader(
  () => ({ q: q.value.trim(), page: patternPage.value, limit: 20 }),
  patterns.fetchPage,
);
const availablePatterns = computed(() => Object.values(patterns.byCode));
function cloneSettings(settings: SmsSettings): SmsSettings {
  return {
    ...settings,
    education: settings.education
      ? { ...settings.education, mapping: { ...settings.education.mapping } }
      : null,
    stock: settings.stock
      ? { ...settings.stock, mapping: { ...settings.stock.mapping } }
      : null,
  };
}
function setDraft(settings: SmsSettings) {
  draft.value = cloneSettings(settings);
  retryText.value = String(settings.max_retries);
  baseline.value = JSON.stringify({
    settings: draft.value,
    retries: retryText.value,
  });
  formError.value = "";
}
async function reload() {
  if (
    dirty.value &&
    !(await confirm.ask(
      "تغییرات ذخیره‌نشده کنار گذاشته شوند؟",
      "کنار گذاشتن تغییرات",
    ))
  )
    return;
  try {
    const loaded = await store.fetchSettings();
    if (loaded) setDraft(loaded.settings);
  } catch {
    /* The resource error is displayed below. */
  }
}
function validBinding(
  binding: SmsBinding | null,
  sources: string[],
  required: string,
) {
  if (!binding) return true;
  const values = Object.values(binding.mapping);
  const knownPattern = patterns.byCode[binding.pattern_code];
  const exactVariables =
    !knownPattern ||
    (knownPattern.variable.length === Object.keys(binding.mapping).length &&
      knownPattern.variable.every(
        (variable) => variable.name in binding.mapping,
      ));
  return (
    !!binding.pattern_code &&
    exactVariables &&
    values.includes(required) &&
    values.every((value) => sources.includes(value))
  );
}
async function save() {
  if (!draft.value || busy.value || !store.data) return;
  const retries = Number(normalizeDigits(retryText.value));
  formError.value = "";
  if (
    !retryText.value.trim() ||
    !Number.isInteger(retries) ||
    retries < 0 ||
    retries > 5
  ) {
    formError.value = "تعداد تلاش مجدد باید عددی بین ۰ و ۵ باشد.";
    return;
  }
  if (draft.value.enabled && !draft.value.sender.trim()) {
    formError.value = "شماره فرستنده را وارد کنید.";
    return;
  }
  if (
    !validBinding(
      draft.value.education,
      store.data.education_sources,
      "education_url",
    ) ||
    !validBinding(draft.value.stock, store.data.stock_sources, "product_name")
  ) {
    formError.value =
      "مقادیر همه متغیرهای الگو را مشخص کنید. الگوی آموزش باید لینک آموزش و الگوی موجودی باید نام محصول را داشته باشد.";
    return;
  }
  busy.value = true;
  try {
    if (
      !(await confirm.ask(
        "تنظیمات جدید برای ارسال‌های بعدی ذخیره شود؟",
        "ذخیره تنظیمات",
      ))
    )
      return;
    const saved = await store.save({
      ...cloneSettings(draft.value),
      sender: normalizeDigits(draft.value.sender.trim()),
      max_retries: retries,
    });
    setDraft(saved);
    toast.success("تنظیمات پیامک ذخیره شد.");
  } catch (cause) {
    formError.value = getApiErrorMessage(cause);
    toast.error(formError.value);
  } finally {
    busy.value = false;
  }
}
onMounted(reload);
onBeforeRouteLeave(
  async () =>
    !dirty.value ||
    (await confirm.ask(
      "تغییرات تنظیمات هنوز ذخیره نشده است. از صفحه خارج شوید؟",
      "خروج از صفحه",
    )),
);
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = "";
  }
}
onMounted(() => window.addEventListener("beforeunload", beforeUnload));
onUnmounted(() => window.removeEventListener("beforeunload", beforeUnload));
</script>
<template>
  <AdminHeading
    title="تنظیمات پیامک"
    description="تغییرات فقط برای درخواست‌های ارسال بعدی اعمال می‌شوند."
  />
  <UiAsyncState
    :loading="store.loading"
    :error="store.error?.message"
    @retry="reload"
  >
    <form
      v-if="draft && store.data"
      class="stack settings-form"
      novalidate
      @submit.prevent="save"
    >
      <div class="card stack">
        <h2>تنظیمات عمومی</h2>
        <p v-if="!store.data.provider_configured" class="error-panel">
          اتصال پیامک‌رسان هنوز پیکربندی نشده است. برای فعال شدن ارسال با مسئول
          سامانه هماهنگ کنید.
        </p>
        <label class="checkbox-label"
          ><input
            v-model="draft.enabled"
            type="checkbox"
            :disabled="busy"
          />فعال بودن ارسال پیامک</label
        >
        <div class="settings-grid">
          <UiInput
            v-model="draft.sender"
            label="شماره فرستنده"
            dir="ltr"
            :disabled="busy"
          /><UiInput
            v-model="retryText"
            label="حداکثر تلاش مجدد"
            type="number"
            min="0"
            max="5"
            step="1"
            :disabled="busy"
            hint="بین ۰ تا ۵ تلاش مجدد"
          />
        </div>
      </div>
      <div class="card stack">
        <h2>جست‌وجوی الگوهای تأییدشده</h2>
        <UiInput
          v-model="q"
          label="عنوان الگو"
          type="search"
          :disabled="busy"
        /><UiAsyncState
          :loading="patterns.loading"
          :error="patterns.error?.message"
          @retry="reloadPatterns"
          ><p class="muted small">
            الگوهای دریافت‌شده در انتخابگرهای پایین در دسترس هستند.
          </p></UiAsyncState
        ><UiPagination
          :page="patternPage"
          :has-more="patterns.page?.has_more || false"
          :disabled="patterns.loading || busy"
          @change="patternPage = $event"
        />
      </div>
      <SmsPatternBinding
        v-model="draft.education"
        title="پیامک آموزش"
        :patterns="availablePatterns"
        :sources="store.data.education_sources || []"
        :disabled="busy"
      />
      <SmsPatternBinding
        v-model="draft.stock"
        title="پیامک اطلاع موجودی"
        :patterns="availablePatterns"
        :sources="store.data.stock_sources || []"
        :disabled="busy"
      />
      <p v-if="formError" class="error-panel" role="alert">{{ formError }}</p>
      <div class="actions">
        <UiButton type="submit" :loading="busy" :disabled="!dirty"
          >ذخیره تنظیمات</UiButton
        ><UiButton
          variant="secondary"
          :disabled="busy || !dirty"
          @click="store.data && setDraft(store.data.settings)"
          >بازنشانی فرم</UiButton
        ><span v-if="dirty" class="muted small">تغییرات ذخیره نشده است.</span>
      </div>
    </form>
  </UiAsyncState>
</template>
