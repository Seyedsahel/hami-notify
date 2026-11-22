import { defineConfig } from "@playwright/test";
import process from "node:process";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1440, height: 1000 },
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 60_000,
    // Tests cannot address the real backend or use the supplied staff token.
    env: {
      NOTIFY_DEV_STAFF_TOKEN: "browser-test-token",
      NUXT_PUBLIC_API_BASE: "https://notify.test/api/v1",
    },
  },
});
