import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiClient } from "../app/utils/api-client.ts";
import { ApiError } from "../app/utils/api-error.ts";

function client(
  fetch: typeof globalThis.fetch,
  overrides: Partial<Parameters<typeof createApiClient>[0]> = {},
) {
  return createApiClient({
    baseURL: "https://notify.example/api/v1",
    getToken: () => "test-token",
    onUnauthorized: () => {},
    fetch,
    ...overrides,
  });
}

test("retains API prefix, leading zeros, false filters and Persian search text", async () => {
  const api = client(async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/api/v1/products");
    assert.equal(url.searchParams.get("q"), "0034210 تست");
    assert.equal(url.searchParams.get("has_sent_sms"), "false");
    assert.equal(url.searchParams.has("unused"), false);
    assert.equal(url.searchParams.has("empty"), false);
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer test-token",
    );
    assert.equal(init?.credentials, "omit");
    return Response.json({ items: [], page: 1, limit: 20, has_more: false });
  });
  await api.get("/products", {
    query: {
      q: "0034210 تست",
      has_sent_sms: false,
      unused: undefined,
      empty: "",
    },
  });
});

test("preserves idempotency keys and treats 202 as queued, without claiming delivery", async () => {
  const api = client(async (_input, init) => {
    assert.equal(init?.method, "POST");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Idempotency-Key"), "confirmation-1");
    assert.equal(headers.get("Content-Type"), "application/json");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      slug: "lesson",
      phone: "09120000000",
    });
    return Response.json(
      { id: "message-1", status: "queued" },
      { status: 202 },
    );
  });
  const result = await api.post<
    { status: string },
    { slug: string; phone: string }
  >(
    "/sms/education",
    { slug: "lesson", phone: "09120000000" },
    { headers: { "Idempotency-Key": "confirmation-1" } },
  );
  assert.equal(result.status, "queued");
});

test("normalizes backend validation errors with their field and request ID", async () => {
  const api = client(async () =>
    Response.json(
      { error: "invalid phone", field: "phone" },
      {
        status: 400,
        headers: { "X-Request-ID": "receipt-1" },
      },
    ),
  );
  await assert.rejects(api.post("/stock-requests", {}), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, "http");
    assert.equal(error.status, 400);
    assert.equal(error.field, "phone");
    assert.equal(error.requestId, "receipt-1");
    assert.equal(error.message, "invalid phone");
    return true;
  });
});

test("preserves backend messages across JSON and plain-text error responses", async () => {
  const cases: [Response, string][] = [
    [
      Response.json({ error: "  exact backend error  " }, { status: 400 }),
      "  exact backend error  ",
    ],
    [
      Response.json({ message: "provider quota exceeded" }, { status: 503 }),
      "provider quota exceeded",
    ],
    [
      Response.json(
        { error: { message: "pattern is not approved" } },
        { status: 409 },
      ),
      "pattern is not approved",
    ],
    [
      Response.json("backend string error", { status: 500 }),
      "backend string error",
    ],
    [
      new Response("original upstream failure\n", { status: 502 }),
      "original upstream failure\n",
    ],
    [
      new Response('{"detail":"database unavailable"}', { status: 503 }),
      '{"detail":"database unavailable"}',
    ],
  ];
  for (const [response, message] of cases) {
    await assert.rejects(
      client(async () => response).get("/education"),
      (error: unknown) =>
        error instanceof ApiError &&
        error.kind === "http" &&
        error.message === message,
    );
  }
});

test("uses HTTP metadata only when the backend error response has no body", async () => {
  const api = client(
    async () =>
      new Response(null, { status: 503, statusText: "Service Unavailable" }),
  );
  await assert.rejects(
    api.get("/education"),
    (error: unknown) =>
      error instanceof ApiError &&
      error.message === "HTTP 503 Service Unavailable",
  );
});

test("invalidates access on 401 even when an upstream response is HTML", async () => {
  let invalidated = 0;
  const api = client(
    async () => new Response("<html>Unauthorized</html>", { status: 401 }),
    {
      onUnauthorized: () => {
        invalidated++;
      },
    },
  );
  await assert.rejects(
    api.get("/education"),
    (error: unknown) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(invalidated, 1);
});

test("does not invalidate access on service failure", async () => {
  let invalidated = false;
  const api = client(async () => new Response("Unavailable", { status: 503 }), {
    onUnauthorized: () => {
      invalidated = true;
    },
  });
  await assert.rejects(
    api.get("/education"),
    (error: unknown) => error instanceof ApiError && error.status === 503,
  );
  assert.equal(invalidated, false);
});

test("does not retry an SMS mutation after network failure", async () => {
  let calls = 0;
  const api = client(async () => {
    calls++;
    throw new TypeError("Network error");
  });
  await assert.rejects(
    api.post("/sms/education", {}),
    (error: unknown) =>
      error instanceof ApiError &&
      error.kind === "network" &&
      error.message === "Network error",
  );
  assert.equal(calls, 1);
});

test("distinguishes timeout from an explicit cancellation", async () => {
  const fetch: typeof globalThis.fetch = async (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    });
  const api = client(fetch, { timeoutMs: 5 });
  await assert.rejects(
    api.get("/education"),
    (error: unknown) => error instanceof ApiError && error.kind === "timeout",
  );
  const controller = new AbortController();
  const pending = client(fetch).get("/education", {
    signal: controller.signal,
  });
  controller.abort();
  await assert.rejects(
    pending,
    (error: unknown) => error instanceof ApiError && error.kind === "aborted",
  );
});

test("does not dispatch a request which is already cancelled", async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  const api = client(async () => {
    calls++;
    return Response.json({});
  });
  await assert.rejects(
    api.get("/education", { signal: controller.signal }),
    (error: unknown) => error instanceof ApiError && error.kind === "aborted",
  );
  assert.equal(calls, 0);
});

test("does not dispatch requests without a configured credential", async () => {
  let calls = 0;
  const api = client(
    async () => {
      calls++;
      return Response.json({});
    },
    { getToken: () => "" },
  );
  await assert.rejects(
    api.get("/education"),
    (error: unknown) =>
      error instanceof ApiError && error.kind === "configuration",
  );
  assert.equal(calls, 0);
});

test("rejects paths that could escape the configured API or carry their own query", async () => {
  const api = client(async () => {
    throw new Error("Must not make a request");
  });
  for (const path of [
    "https://other.example",
    "//other.example",
    "/../other",
    "/%2e%2e/other",
    "/education?q=test",
    "/education#fragment",
    "/\\other.example",
  ]) {
    await assert.rejects(
      api.get(path),
      (error: unknown) =>
        error instanceof ApiError && error.kind === "configuration",
    );
  }
});

test("rejects malformed and empty successful JSON responses", async () => {
  for (const response of [
    new Response("<html>Unexpected proxy page</html>"),
    new Response(""),
  ]) {
    await assert.rejects(
      client(async () => response).get("/education"),
      (error: unknown) =>
        error instanceof ApiError && error.kind === "invalid-response",
    );
  }
});

test("supports an empty 204 response", async () => {
  assert.equal(
    await client(async () => new Response(null, { status: 204 })).get(
      "/education",
    ),
    undefined,
  );
});

test("reports full backend details while redacting the request credential", async () => {
  const reports: unknown[] = [];
  const details = {
    error: "provider unavailable",
    field: "pattern",
    reason: { code: "provider_timeout" },
    echoed_credential: "test-token",
  };
  const api = client(
    async () =>
      Response.json(details, {
        status: 503,
        headers: { "X-Request-ID": "debug-receipt" },
      }),
    {
      onError: (diagnostic) => reports.push(diagnostic),
    },
  );
  await assert.rejects(api.get("/sms/settings"), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.deepEqual(error.details, details);
    return true;
  });
  assert.deepEqual(reports, [
    {
      method: "GET",
      path: "/sms/settings",
      status: 503,
      kind: "http",
      message: "provider unavailable",
      field: "pattern",
      requestId: "debug-receipt",
      details: { ...details, echoed_credential: "[REDACTED]" },
    },
  ]);
});

test("a diagnostic logger failure cannot mask the backend error or retry the request", async () => {
  let calls = 0;
  const api = client(
    async () => {
      calls++;
      return Response.json({ error: "invalid phone" }, { status: 400 });
    },
    {
      onError: () => {
        throw new Error("logger unavailable");
      },
    },
  );
  await assert.rejects(
    api.post("/stock-requests", {}),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 400 &&
      error.message === "invalid phone",
  );
  assert.equal(calls, 1);
});

test("does not log successful or intentionally cancelled requests", async () => {
  let reports = 0;
  await client(async () => Response.json({ items: [] }), {
    onError: () => {
      reports++;
    },
  }).get("/education");
  const controller = new AbortController();
  const api = client(
    async (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
    {
      onError: () => {
        reports++;
      },
    },
  );
  const pending = api.get("/education", { signal: controller.signal });
  controller.abort();
  await assert.rejects(
    pending,
    (error: unknown) => error instanceof ApiError && error.kind === "aborted",
  );
  assert.equal(reports, 0);
});
