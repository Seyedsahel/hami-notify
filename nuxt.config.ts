import tailwindcss from "@tailwindcss/vite";
import process from "node:process";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: false,
  modules: ["@pinia/nuxt"],
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "همیار داروخانه",
      htmlAttrs: { lang: "fa", dir: "rtl" },
      meta: [
        { name: "description", content: "پیشخوان خدمات مشتریان داروخانه" },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: "https://notify.hamidaroo.ir/api/v1",
      // Deliberately not named NUXT_PUBLIC_*: never load this token in a build.
      devStaffToken:
        process.env.NODE_ENV === "development"
          ? process.env.NOTIFY_DEV_STAFF_TOKEN || ""
          : "",
    },
  },
  typescript: { strict: true },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: "notify-api-error-terminal",
        apply: "serve",
        configureServer(server) {
          server.ws.on("notify:api-error", (diagnostic) => {
            console.error(
              "[backend error]\n" + JSON.stringify(diagnostic, null, 2),
            );
          });
        },
      },
    ],
  },
});
