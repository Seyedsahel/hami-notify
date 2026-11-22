/** Read errors are displayed from the resource store; never leave rejected watchers. */
export function useListLoader<Q>(
  query: () => Q,
  load: (query: Q) => Promise<unknown>,
  delay = 250,
) {
  async function reload() {
    try {
      await load(query());
    } catch {
      /* The resource store exposes the error to the view. */
    }
  }
  watch(
    query,
    (_value, previous, onCleanup) => {
      if (previous === undefined) {
        void reload();
        return;
      }
      const timer = setTimeout(reload, delay);
      onCleanup(() => clearTimeout(timer));
    },
    { immediate: true, deep: true },
  );
  return { reload };
}
