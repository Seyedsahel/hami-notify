import type { Page, AriaReceipt, AriaQuery } from "~/types/api";

export const useAriaStore = defineStore("arya", () => {
  const api = useApi();
  const list = useResourceRequest((query: AriaQuery, signal) =>
    api.get<Page<AriaReceipt>>("/arya/logs", { query: { ...query }, signal }),
  );
  const detail = useResourceRequest((id: string, signal) =>
    api.get<AriaReceipt>(`/arya/logs/${encodeURIComponent(id)}`, { signal }),
  );
  return {
    page: list.data,
    loading: list.loading,
    error: list.error,
    fetchPage: list.execute,
    detail: detail.data,
    detailLoading: detail.loading,
    detailError: detail.error,
    fetchDetail: detail.execute,
  };
});
