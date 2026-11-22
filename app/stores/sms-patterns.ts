import type { CountedPage, SmsPattern, SearchQuery } from "~/types/api";

export const useSmsPatternsStore = defineStore("sms-patterns", () => {
  const api = useApi();
  const list = useResourceRequest((query: SearchQuery, signal) =>
    api.get<CountedPage<SmsPattern>>("/sms/patterns", {
      query: { ...query },
      signal,
    }),
  );
  const byCode = shallowRef<Record<string, SmsPattern>>({});
  async function fetchPage(query: SearchQuery) {
    const result = await list.execute(query);
    if (result)
      byCode.value = {
        ...byCode.value,
        ...Object.fromEntries(
          (result.items || []).map((pattern) => [
            pattern.pattern_code,
            pattern,
          ]),
        ),
      };
    return result;
  }
  return {
    page: list.data,
    loading: list.loading,
    error: list.error,
    fetchPage,
    byCode,
  };
});
