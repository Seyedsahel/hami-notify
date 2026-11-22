import type { CountedPage, EducationSummary, SearchQuery } from "~/types/api";

export const useEducationStore = defineStore("education", () => {
  const api = useApi();
  const list = useResourceRequest((query: SearchQuery, signal) =>
    api.get<CountedPage<EducationSummary>>("/education", {
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
