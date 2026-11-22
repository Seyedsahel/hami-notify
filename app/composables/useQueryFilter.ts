export function useQueryFilter(key: string, fallback = "") {
  const route = useRoute();
  const router = useRouter();
  return computed({
    get: () =>
      typeof route.query[key] === "string"
        ? (route.query[key] as string)
        : fallback,
    set: (value: string) => {
      const query = {
        ...route.query,
        [key]: value === fallback ? undefined : value,
      };
      if (key !== "page") query.page = undefined;
      void router.replace({ query });
    },
  });
}

export function usePageNumber() {
  const value = useQueryFilter("page", "1");
  return computed({
    get: () => Math.max(1, Number.parseInt(value.value, 10) || 1),
    set: (page: number) => {
      value.value = String(Math.max(1, page));
    },
  });
}
