import { ApiError } from "~/utils/api-error";

/** Each resource store owns one instance; newer reads supersede older responses. */
export function useResourceRequest<T, Q>(
  fetcher: (query: Q, signal: AbortSignal) => Promise<T>,
) {
  const data = shallowRef<T | null>(null);
  const loading = ref(false);
  const error = shallowRef<ApiError | null>(null);
  let generation = 0;
  let controller: AbortController | undefined;

  async function execute(query: Q): Promise<T | undefined> {
    const current = ++generation;
    controller?.abort();
    controller = new AbortController();
    loading.value = true;
    error.value = null;
    try {
      const result = await fetcher(query, controller.signal);
      if (current !== generation) return;
      data.value = result;
      return result;
    } catch (cause) {
      if (
        current !== generation ||
        (cause instanceof ApiError && cause.kind === "aborted")
      )
        return;
      error.value =
        cause instanceof ApiError
          ? cause
          : new ApiError("دریافت اطلاعات انجام نشد.", { kind: "network" });
      throw error.value;
    } finally {
      if (current === generation) loading.value = false;
    }
  }

  function reset() {
    generation++;
    controller?.abort();
    data.value = null;
    error.value = null;
    loading.value = false;
  }

  onScopeDispose(() => controller?.abort());
  return { data, loading, error, execute, reset };
}
