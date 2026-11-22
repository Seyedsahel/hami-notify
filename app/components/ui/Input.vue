<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const model = defineModel<string>({ required: true });
withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
    error?: string;
    type?: string;
    inputClass?: string;
  }>(),
  { type: "text" },
);
const id = useId();
const input = ref<HTMLInputElement>();
defineExpose({ focus: () => input.value?.focus() });
</script>
<template>
  <div class="field" :class="$attrs.class">
    <label v-if="label" :for="id">{{ label }}</label>
    <input
      :id="id"
      ref="input"
      v-model="model"
      v-bind="{ ...$attrs, class: undefined }"
      :class="inputClass"
      :type="type"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error || hint ? `${id}-help` : undefined"
      @blur="model = model.trim()"
    />
    <p
      v-if="error || hint"
      :id="`${id}-help`"
      :class="error ? 'field-error' : 'muted small'"
      :role="error ? 'alert' : undefined"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
