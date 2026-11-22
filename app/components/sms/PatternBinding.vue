<script setup lang="ts">
import type { SmsBinding, SmsPattern } from "~/types/api";
const binding = defineModel<SmsBinding | null>({ required: true });
const props = defineProps<{
  title: string;
  patterns: SmsPattern[];
  sources: string[];
  disabled?: boolean;
}>();
const code = computed({
  get: () => binding.value?.pattern_code || "",
  set: (value: string) => {
    const pattern = props.patterns.find((item) => item.pattern_code === value);
    binding.value = value
      ? {
          pattern_code: value,
          mapping: Object.fromEntries(
            (pattern?.variable || []).map((variable) => [
              variable.name,
              binding.value?.mapping[variable.name] || "",
            ]),
          ),
        }
      : null;
  },
});
const currentPattern = computed(() =>
  props.patterns.find((item) => item.pattern_code === code.value),
);
const variables = computed(
  () =>
    currentPattern.value?.variable?.map((item) => item.name) ||
    Object.keys(binding.value?.mapping || {}),
);
const patternOptions = computed(() => [
  { value: "", label: "بدون الگو؛ ارسال این نوع غیرفعال" },
  ...(code.value && !currentPattern.value
    ? [{ value: code.value, label: `الگوی فعلی: ${code.value}` }]
    : []),
  ...props.patterns.map((item) => ({
    value: item.pattern_code,
    label: `${item.title} (${item.pattern_code})`,
  })),
]);
function setMapping(name: string, value: string) {
  if (binding.value)
    binding.value = {
      ...binding.value,
      mapping: { ...binding.value.mapping, [name]: value },
    };
}
</script>
<template>
  <section class="card stack">
    <h2>{{ title }}</h2>
    <UiSelect
      v-model="code"
      label="الگوی پیامک"
      :options="patternOptions"
      :disabled="disabled"
    />
    <p v-if="currentPattern" class="muted small">
      {{ currentPattern.pattern_message }}
    </p>
    <div v-if="binding" class="stack">
      <UiSelect
        v-for="name in variables"
        :key="name"
        :model-value="binding.mapping[name] || ''"
        :label="`مقدار متغیر ${name}`"
        :options="[
          { value: '', label: 'انتخاب مقدار' },
          ...sources.map((source) => ({ value: source, label: source })),
        ]"
        :disabled="disabled"
        @update:model-value="setMapping(name, $event)"
      />
    </div>
    <p v-else class="muted small">
      برای فعال شدن ارسال این نوع پیامک، یک الگو انتخاب کنید.
    </p>
  </section>
</template>
