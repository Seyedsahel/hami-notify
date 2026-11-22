<script setup lang="ts">
import type { StockRequestOptions } from "~/types/api";
import { normalizePhone, isValidPhone } from "~/utils/format";
const phone = defineModel<string>("phone", { required: true });
const category = defineModel<string>("category", { default: "" });
const priority = defineModel<string>("priority", { default: "normal" });
const props = defineProps<{
  stock?: boolean;
  options?: StockRequestOptions | null;
  busy?: boolean;
  unavailable?: boolean;
  error?: string;
  backendField?: string;
}>();
const emit = defineEmits<{ submit: [] }>();
const localError = ref("");
const phoneInput = ref<{ focus: () => void }>();
const group = useId();
function submit() {
  if (props.busy || props.unavailable) return;
  phone.value = normalizePhone(phone.value);
  localError.value = "";
  if (!isValidPhone(phone.value)) {
    localError.value = "شماره موبایل را به‌صورت ۱۱ رقمی و با ۰۹ وارد کنید.";
    phoneInput.value?.focus();
    return;
  }
  if (
    props.stock &&
    (!props.options?.categories.some((item) => item.value === category.value) ||
      !props.options.priorities.some((item) => item.value === priority.value))
  ) {
    localError.value = "دسته‌بندی و اولویت درخواست را انتخاب کنید.";
    return;
  }
  emit("submit");
}
onMounted(() => phoneInput.value?.focus());
</script>
<template>
  <form class="counter-form" novalidate @submit.prevent="submit">
    <UiInput
      ref="phoneInput"
      v-model="phone"
      input-class="phone-input"
      label="شماره موبایل مشتری"
      type="tel"
      inputmode="tel"
      dir="ltr"
      autocomplete="off"
      placeholder="09xxxxxxxxx"
      hint="شماره ۱۱ رقمی با شروع ۰۹"
      :disabled="busy"
      :error="localError || (backendField === 'phone' ? error : '')"
    />
    <template v-if="stock">
      <UiSelect
        v-model="category"
        label="دسته‌بندی درخواست"
        :disabled="busy || unavailable"
        :options="[
          { value: '', label: 'انتخاب دسته‌بندی' },
          ...(options?.categories || []),
        ]"
      />
      <fieldset class="radio-field" :disabled="busy || unavailable">
        <legend>اولویت اطلاع‌رسانی</legend>
        <label
          v-for="option in options?.priorities || []"
          :key="option.value"
          class="result-row"
          :class="{ selected: priority === option.value }"
          ><input
            v-model="priority"
            type="radio"
            :name="group"
            :value="option.value"
          /><span
            ><strong>{{ option.label }}</strong></span
          ></label
        >
      </fieldset>
    </template>
    <p
      v-if="error && backendField !== 'phone'"
      class="error-panel"
      role="alert"
    >
      {{ error }}
    </p>
    <UiButton
      type="submit"
      class="full-button"
      :loading="busy"
      :disabled="unavailable"
      >{{ stock ? "ثبت درخواست موجودی" : "ارسال لینک آموزش" }}</UiButton
    >
  </form>
</template>
