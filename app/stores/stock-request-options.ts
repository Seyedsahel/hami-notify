import { defineStore } from "pinia";
import type { StockRequestOptions } from "~/types/api";
import { ApiError } from "~/utils/api-error";

export const useStockRequestOptionsStore = defineStore(
  "stock-request-options",
  () => {
    const api = useApi();
    const options = shallowRef<StockRequestOptions | null>(null);
    const loading = ref(false);
    const error = shallowRef<ApiError | null>(null);
    let pending: Promise<StockRequestOptions> | undefined;

    function fetchOptions(force = false): Promise<StockRequestOptions> {
      if (pending) return pending;
      if (options.value && !force) return Promise.resolve(options.value);
      loading.value = true;
      error.value = null;
      pending = api
        .get<StockRequestOptions>("/stock-request-options")
        .then((result) => {
          options.value = result;
          return result;
        })
        .catch((cause: ApiError) => {
          error.value = cause;
          throw cause;
        })
        .finally(() => {
          loading.value = false;
          pending = undefined;
        });
      return pending;
    }

    return { options, loading, error, fetchOptions };
  },
);
