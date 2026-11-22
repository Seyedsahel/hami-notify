import { useSessionStore } from "~/stores/session";
import { createApiClient } from "~/utils/api-client";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const session = useSessionStore();
  session.configure(import.meta.dev ? config.public.devStaffToken : "");

  const api = createApiClient({
    baseURL: config.public.apiBase,
    getToken: () => session.token,
    onUnauthorized: () => session.invalidate(),
    ...(import.meta.dev
      ? {
          onError(diagnostic) {
            console.error("[backend error]", diagnostic);
            import.meta.hot?.send("notify:api-error", diagnostic);
          },
        }
      : {}),
  });

  return { provide: { api } };
});
