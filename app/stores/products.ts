import type { Page, Product, SearchQuery } from "~/types/api";

export const useProductsStore = defineStore("products", () => {
  const api = useApi();
  const list = useResourceRequest((query: SearchQuery, signal) =>
    api.get<Page<Product>>("/products", { query: { ...query }, signal }),
  );
  return {
    page: list.data,
    loading: list.loading,
    error: list.error,
    fetchPage: list.execute,
  };
});
