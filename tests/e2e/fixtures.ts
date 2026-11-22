import type { Page as BrowserPage } from "@playwright/test";
import type { SmsSettings, SmsMessage } from "../../app/types/api";

export const messageId = "550e8400-e29b-41d4-a716-446655440000";
const now = "2026-11-22T08:00:00Z";
export const lesson = {
  id: "lesson-1",
  slug: "inhaler",
  title: "روش استفاده از اسپری تنفسی",
  summary: "آموزش استفاده و نگهداری اسپری",
  url: "https://shop.example/b/inhaler",
  short_path: "/b/inhaler",
  published_at: 1795334400,
};
export const product = {
  code: "0034210",
  name: "کرم مرطوب‌کننده",
  quantity: 5,
};
export const options = {
  categories: [
    { value: "cosmetics", label: "آرایشی" },
    { value: "medicines", label: "دارویی" },
    { value: "supplements", label: "مکملی" },
  ],
  priorities: [
    { value: "urgent", label: "فوری" },
    { value: "high", label: "بالا" },
    { value: "normal", label: "عادی" },
  ],
};
export const receiptId = "BLXP3B2UU7GHCUZJAJUWDEPS2E";

export async function mockApi(
  page: BrowserPage,
  config: {
    failEducationOnce?: boolean;
    rejectAccess?: boolean;
    duplicateStock?: boolean;
    smsStatus?: SmsMessage["status"];
    educationStatus?: SmsMessage["status"];
  } = {},
) {
  const educationCalls: { input: unknown; key: string | undefined }[] = [];
  const stockCalls: { product_code: string; request_ids: string[] }[] = [];
  const registrations: Record<string, string>[] = [];
  const customerQueries: URLSearchParams[] = [];
  const settingsCalls: SmsSettings[] = [];
  let settings: SmsSettings = {
    enabled: false,
    sender: "3000505",
    max_retries: 3,
    education: null,
    stock: null,
  };
  let sms: SmsMessage = {
    id: messageId,
    kind: "education",
    status: config.smsStatus || "failed",
    title: lesson.title,
    masked_phone: "0912***6789",
    attempts: 1,
    created_at: now,
    updated_at: now,
    provider_id: "provider-1",
  };
  const queue = [
    {
      id: "request-1",
      product_code: product.code,
      phone: "09120006789",
      category: "cosmetics",
      priority: "urgent",
      created_at: now,
      quantity: 5,
      status: "ready",
    },
    {
      id: "request-2",
      product_code: product.code,
      phone: "09120006788",
      category: "medicines",
      priority: "normal",
      created_at: now,
      quantity: 0,
      status: "waiting",
    },
  ];
  const paginate = (items: unknown[], url: URL, total = false) => ({
    items,
    page: Number(url.searchParams.get("page") || 1),
    limit: Number(url.searchParams.get("limit") || 20),
    has_more: false,
    ...(total ? { total: items.length } : {}),
  });

  await page.route("https://notify.test/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();
    const respond = (json: unknown, status = 200) =>
      route.fulfill({
        json,
        status,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    if (method === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization,Content-Type,Idempotency-Key",
        },
      });
    if (config.rejectAccess)
      return respond({ error: "invalid staff credential" }, 401);
    if (request.headers()["authorization"] !== "Bearer browser-test-token")
      return respond({ error: "missing development credential" }, 401);
    if (path === "/stock-request-options") return respond(options);
    if (path === "/education") return respond(paginate([lesson], url, true));
    if (path === "/products") return respond(paginate([product], url));
    if (path === "/sms/education" && method === "POST") {
      educationCalls.push({
        input: request.postDataJSON(),
        key: request.headers()["idempotency-key"],
      });
      if (config.failEducationOnce && educationCalls.length === 1)
        return route.abort("failed");
      return respond(
        { ...sms, status: config.educationStatus || "queued" },
        202,
      );
    }
    if (path === "/stock-requests" && method === "POST") {
      const input = request.postDataJSON();
      registrations.push(input);
      return respond({
        ...queue[0],
        ...input,
        ...(config.duplicateStock
          ? { category: "medicines", priority: "high" }
          : {}),
      });
    }
    if (path === "/stock-queue/products")
      return respond(
        paginate([{ ...product, ready_count: 1, waiting_count: 1 }], url),
      );
    if (path === "/stock-queue") return respond(paginate(queue, url));
    if (path === "/sms/stock" && method === "POST") {
      stockCalls.push(request.postDataJSON());
      return respond(
        {
          items: [
            {
              ...sms,
              kind: "stock",
              status: "queued",
              stock_request_id: "request-1",
            },
          ],
        },
        202,
      );
    }
    if (path === "/sms/messages") return respond(paginate([sms], url));
    if (path === `/sms/messages/${messageId}`)
      return respond({
        message: sms,
        attempts: [
          {
            number: 1,
            status: "failed",
            started_at: now,
            finished_at: now,
            error_code: "test_failure",
          },
        ],
      });
    if (path === `/sms/messages/${messageId}/retry` && method === "POST") {
      sms = { ...sms, status: "queued", attempts: 2 };
      return respond(sms, 202);
    }
    if (
      path === `/sms/messages/${messageId}/refresh-delivery` &&
      method === "POST"
    ) {
      sms = { ...sms, status: "delivered" };
      return respond(sms);
    }
    if (path === "/arya/logs")
      return respond(
        paginate(
          [
            {
              request_id: receiptId,
              received_at: now,
              outcome: "success",
              duration_ms: 12,
              item_count: 2,
            },
          ],
          url,
        ),
      );
    if (path === `/arya/logs/${receiptId}`)
      return respond({
        request_id: receiptId,
        received_at: now,
        outcome: "success",
        duration_ms: 12,
        item_count: 2,
      });
    const customer = {
      phone: "09120006789",
      last_activity_at: now,
      sms_count: 2,
      sent_sms_count: 1,
      stock_request_count: 1,
    };
    if (path === "/customers") {
      customerQueries.push(url.searchParams);
      return respond(paginate([customer], url));
    }
    if (path === "/customers/09120006789")
      return respond({
        customer,
        stock_requests: paginate(
          [{ ...queue[0], product_name: product.name }],
          url,
        ),
        sms: paginate([sms], url),
      });
    if (path === "/sms/settings" && method === "GET")
      return respond({
        settings,
        provider_configured: true,
        education_sources: ["education_url", "education_title", "phone"],
        stock_sources: ["product_name", "phone"],
      });
    if (path === "/sms/settings" && method === "PUT") {
      settings = request.postDataJSON();
      settingsCalls.push(settings);
      return respond(settings);
    }
    if (path === "/sms/patterns")
      return respond(
        paginate(
          [
            {
              pattern_code: "education-pattern",
              title: "الگوی آموزش",
              pattern_message: "آموزش: %link%",
              pattern_status: "approved",
              variable: [{ name: "link", type: "string", len: 200 }],
            },
            {
              pattern_code: "stock-pattern",
              title: "الگوی موجودی",
              pattern_message: "موجود شد: %product%",
              pattern_status: "approved",
              variable: [{ name: "product", type: "string", len: 100 }],
            },
          ],
          url,
          true,
        ),
      );
    return respond(
      { error: `Unexpected mock endpoint ${method} ${path}` },
      404,
    );
  });
  return {
    educationCalls,
    stockCalls,
    registrations,
    customerQueries,
    settingsCalls,
  };
}
