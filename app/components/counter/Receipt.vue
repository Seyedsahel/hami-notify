<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    note: string;
    entries: { label: string; value: string }[];
    tone?: "success" | "pending" | "danger";
  }>(),
  { tone: "success" },
);
defineEmits<{ next: []; choose: [] }>();
const receipt = ref<HTMLElement>();
onMounted(() => receipt.value?.focus());
</script>
<template>
  <div
    ref="receipt"
    class="receipt"
    :class="`receipt-${tone}`"
    role="status"
    tabindex="-1"
  >
    <UiIcon
      :name="
        tone === 'danger' ? 'warning' : tone === 'pending' ? 'send' : 'success'
      "
      :size="58"
    />
    <h2>{{ title }}</h2>
    <p>{{ note }}</p>
    <dl>
      <div v-for="entry in entries" :key="entry.label">
        <dt>{{ entry.label }}</dt>
        <dd>{{ entry.value }}</dd>
      </div>
    </dl>
    <slot />
    <div class="stack">
      <UiButton @click="$emit('next')">ثبت برای مشتری بعدی</UiButton
      ><UiButton variant="secondary" @click="$emit('choose')"
        >انتخاب مورد دیگر</UiButton
      ><NuxtLink class="button button-secondary" to="/">بازگشت به خانه</NuxtLink>
    </div>
  </div>
</template>
