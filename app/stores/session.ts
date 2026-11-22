import { defineStore } from "pinia";
import { computed, ref } from "vue";

/** Development access only; production staff authentication is a separate decision. */
export const useSessionStore = defineStore("session", () => {
  const token = ref("");
  const rejected = ref(false);
  const configured = computed(() => Boolean(token.value));

  function configure(value: string) {
    token.value = value.trim();
    rejected.value = false;
  }

  function invalidate() {
    token.value = "";
    rejected.value = true;
  }

  return { token, rejected, configured, configure, invalidate };
});
