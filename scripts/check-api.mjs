import process from "node:process";

const base =
  process.env.NUXT_PUBLIC_API_BASE || "https://notify.hamidaroo.ir/api/v1";
const token = process.env.NOTIFY_DEV_STAFF_TOKEN?.trim();
const origin = process.env.NOTIFY_FRONTEND_ORIGIN || "http://localhost:3000";
if (!token) {
  console.error(
    "Set NOTIFY_DEV_STAFF_TOKEN in .env before running this check.",
  );
  process.exit(1);
}
let failures = 0;
for (const [path, method, headers] of [
  ["/education", "GET", ["authorization"]],
  [
    "/sms/education",
    "POST",
    ["authorization", "content-type", "idempotency-key"],
  ],
]) {
  try {
    const response = await fetch(`${base}${path}`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": headers.join(","),
      },
      signal: AbortSignal.timeout(15_000),
    });
    const allowedOrigin = response.headers.get("access-control-allow-origin");
    const allowedHeaders = (
      response.headers.get("access-control-allow-headers") || ""
    )
      .toLowerCase()
      .split(",")
      .map((value) => value.trim());
    const allowedMethods = (
      response.headers.get("access-control-allow-methods") || ""
    )
      .toUpperCase()
      .split(",")
      .map((value) => value.trim());
    const passed =
      response.ok &&
      [origin, "*"].includes(allowedOrigin) &&
      allowedMethods.includes(method) &&
      headers.every((header) => allowedHeaders.includes(header));
    console.log(
      `${passed ? "PASS" : "FAIL"} OPTIONS ${path}: HTTP ${response.status}, origin ${allowedOrigin || "(missing)"}`,
    );
    if (!passed) failures++;
  } catch {
    console.error(`FAIL OPTIONS ${path}: connection unavailable`);
    failures++;
  }
}
for (const path of [
  "/stock-request-options",
  "/education?limit=1",
  "/products?limit=1",
]) {
  try {
    const response = await fetch(`${base}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        Origin: origin,
      },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json();
    const readable = data && typeof data === "object" && !Array.isArray(data);
    console.log(
      `${response.ok && readable ? "PASS" : "FAIL"} GET ${path}: HTTP ${response.status}`,
    );
    if (!response.ok || !readable) failures++;
    if (
      ![origin, "*"].includes(
        response.headers.get("access-control-allow-origin"),
      )
    ) {
      console.log(
        `FAIL GET ${path}: Access-Control-Allow-Origin is missing or does not match`,
      );
      failures++;
    }
  } catch {
    console.error(`FAIL GET ${path}: response unavailable`);
    failures++;
  }
}
process.exitCode = failures ? 1 : 0;
