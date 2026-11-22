<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
const id = useId();
watchEffect(() => {
  if (!dialog.value) return;
  if (props.open && !dialog.value.open) dialog.value.showModal();
  if (!props.open && dialog.value.open) dialog.value.close();
});
</script>
<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="id"
    @cancel.prevent="emit('close')"
    @click="$event.target === dialog && emit('close')"
  >
    <div class="modal-inner">
      <h2 :id="id">{{ title }}</h2>
      <slot />
    </div>
  </dialog>
</template>
