import type {
  Page,
  StockRequest,
  StockRegistration,
  QueueQuery,
} from "~/types/api";

export const useStockRequestsStore = defineStore("stock-requests", () => {
  const api = useApi();
  const list = useResourceRequest((query: QueueQuery, signal) =>
    api.get<Page<StockRequest>>("/stock-queue", {
      query: { ...query },
      signal,
    }),
  );
  const lastRegistered = shallowRef<StockRequest | null>(null);

  async function register(input: StockRegistration) {
    const saved = await api.post<StockRequest, StockRegistration>(
      "/stock-requests",
      input,
    );
    lastRegistered.value = saved;
    list.reset();
    return saved;
  }

  return {
    page: list.data,
    loading: list.loading,
    error: list.error,
    fetchPage: list.execute,
    register,
    lastRegistered,
  };
});
