import type { Page, QueueProduct, QueueProductQuery } from "~/types/api";

export const useStockQueueStore = defineStore("stock-queue-products", () => {
  const api = useApi();
  const list = useResourceRequest((query: QueueProductQuery, signal) =>
    api.get<Page<QueueProduct>>("/stock-queue/products", {
      query: { ...query },
      signal,
    }),
  );
  return {
    page: list.data,
    loading: list.loading,
    error: list.error,
    fetchPage: list.execute,
  };
});
