<script setup lang="ts">
const query = defineModel<string>("query", { required: true });
const selected = defineModel<string>("selected", { required: true });
const props = defineProps<{
  items: { id: string; name: string; meta: string }[];
  stock?: boolean;
  loading: boolean;
  error?: string;
  page: number;
  hasMore: boolean;
}>();
const emit = defineEmits<{ next: []; retry: []; changePage: [page: number] }>();
const input = ref<{ focus: () => void }>();
const group = useId();
function proceed() {
  if (
    !props.loading &&
    !props.error &&
    props.items.some((item) => item.id === selected.value)
  )
    emit("next");
}
function searchKey(event: KeyboardEvent) {
  if (props.loading || props.error) {
    if (["Enter", "ArrowDown", "ArrowUp"].includes(event.key))
      event.preventDefault();
    return;
  }
  const current = props.items.findIndex((item) => item.id === selected.value);
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    const index = Math.max(
      0,
      Math.min(
        props.items.length - 1,
        current + (event.key === "ArrowDown" ? 1 : -1),
      ),
    );
    selected.value = props.items[index]?.id ?? "";
  }
  if (event.key === "Enter") {
    event.preventDefault();
    if (current >= 0) proceed();
    else selected.value = props.items[0]?.id ?? "";
  }
}
onMounted(() => input.value?.focus());
useShortcuts((event, editing) => {
  if (
    (event.key === "/" && !editing) ||
    (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))
  ) {
    event.preventDefault();
    input.value?.focus();
  }
});
</script>
<template>
  <div class="stack">
    <div class="section-heading">
      <h2>{{ stock ? "کدام محصول؟" : "کدام آموزش؟" }}</h2>
      <p>
        {{
          stock
            ? "با نام محصول یا کد آریا جست‌وجو کنید."
            : "آموزش موردنظر مشتری را انتخاب کنید."
        }}
      </p>
    </div>
    <UiInput
      ref="input"
      v-model="query"
      :label="stock ? 'نام محصول یا کد آریا' : 'جست‌وجوی آموزش'"
      type="search"
      placeholder="جست‌وجو…"
      @keydown="searchKey"
    />
    <UiAsyncState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      @retry="emit('retry')"
    >
      <div
        class="result-list"
        role="radiogroup"
        :aria-label="stock ? 'انتخاب محصول' : 'انتخاب آموزش'"
        @keydown.enter.prevent="proceed"
      >
        <label
          v-for="item in items"
          :key="item.id"
          class="result-row"
          :class="{ selected: selected === item.id }"
        >
          <input
            v-model="selected"
            type="radio"
            :name="group"
            :value="item.id"
          /><span
            ><strong>{{ item.name }}</strong
            ><small>{{ item.meta }}</small></span
          >
        </label>
      </div>
    </UiAsyncState>
    <UiPagination
      :page="page"
      :has-more="hasMore"
      :disabled="loading"
      @change="emit('changePage', $event)"
    />
    <UiButton
      class="full-button"
      :disabled="!selected || loading || !!error"
      @click="proceed"
      >ادامه</UiButton
    >
    <p class="muted small">جست‌وجو با /، انتخاب با جهت‌نما و ادامه با Enter</p>
  </div>
</template>
