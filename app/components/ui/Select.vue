<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const model = defineModel<string>({ required: true });
defineProps<{
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}>();
const id = useId();
</script>
<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="field-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>
