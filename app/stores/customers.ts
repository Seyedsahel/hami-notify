import type {
  Page,
  Customer,
  CustomerDetail,
  CustomerQuery,
  CustomerHistoryQuery,
} from "~/types/api";

export const useCustomersStore = defineStore("customers", () => {
  const api = useApi();
  const list = useResourceRequest((query: CustomerQuery, signal) =>
    api.get<Page<Customer>>("/customers", { query: { ...query }, signal }),
  );
  const detail = useResourceRequest(
    (input: { phone: string; query?: CustomerHistoryQuery }, signal) =>
      api.get<CustomerDetail>(`/customers/${encodeURIComponent(input.phone)}`, {
        query: { ...input.query },
        signal,
      }),
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
