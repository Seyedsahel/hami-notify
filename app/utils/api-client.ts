import type { ApiErrorBody } from "../types/api.ts";
import { ApiError } from "./api-error.ts";

type QueryValue = string | number | boolean | null | undefined;
export type ApiQuery = Record<string, QueryValue>;

export interface ApiRequestOptions {
  query?: ApiQuery;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<T>(path: string, options?: ApiRequestOptions): Promise<T>;
  post<T, B>(path: string, body?: B, options?: ApiRequestOptions): Promise<T>;
  put<T, B>(path: string, body: B, options?: ApiRequestOptions): Promise<T>;
}

export interface ApiErrorDiagnostic {
  method: string;
  path: string;
  status: number;
  kind: ApiError["kind"];
  message: string;
  field?: string;
  requestId?: string;
  details?: unknown;
}

interface ClientOptions {
  baseURL: string;
  getToken: () => string;
  onUnauthorized: () => void;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
  onError?: (diagnostic: ApiErrorDiagnostic) => void;
}

function backendErrorMessage(
  data: unknown,
  raw: string,
  response: Response,
): string {
  const envelope =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nestedError =
    envelope.error && typeof envelope.error === "object"
      ? (envelope.error as Record<string, unknown>)
      : {};
  for (const message of [
    envelope.error,
    envelope.message,
    nestedError.message,
    data,
  ]) {
    if (typeof message === "string" && message.trim()) return message;
  }
  // Preserve unrecognized response bodies rather than substitute frontend copy.
  if (raw.trim()) return raw;
  return `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
}

export function createApiClient(config: ClientOptions): ApiClient {
  const fetcher = config.fetch ?? globalThis.fetch.bind(globalThis);

  async function request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    body: unknown,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    let url: URL;
    try {
      const base = new URL(`${config.baseURL.replace(/\/+$/, "")}/`);
      url = new URL(path.slice(1), base);
      if (
        !["http:", "https:"].includes(base.protocol) ||
        !path.startsWith("/") ||
        path.startsWith("//") ||
        /[?#\\]/.test(path) ||
        url.origin !== base.origin ||
        !url.pathname.startsWith(base.pathname)
      ) {
        throw new Error("Invalid API path");
      }
    } catch {
      throw new ApiError("آدرس سرویس به‌درستی تنظیم نشده است.", {
        kind: "configuration",
      });
    }

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== null && value !== "")
        url.searchParams.set(key, String(value));
    }

    const token = config.getToken().trim();
    if (!token)
      throw new ApiError("توکن دسترسی برای این محیط تنظیم نشده است.", {
        kind: "configuration",
      });
    if (options.signal?.aborted)
      throw new ApiError("درخواست لغو شد.", { kind: "aborted" });

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${token}`);
    if (body !== undefined) headers.set("Content-Type", "application/json");

    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, config.timeoutMs ?? 20_000);

    try {
      const response = await fetcher(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
      });

      if (response.status === 401) config.onUnauthorized();
      const raw = await response.text();
      let data: unknown;
      try {
        data = raw ? JSON.parse(raw) : undefined;
      } catch {
        if (response.ok)
          throw new ApiError("پاسخ سرویس قابل خواندن نیست.", {
            kind: "invalid-response",
            status: response.status,
            details: raw,
          });
      }

      if (!response.ok) {
        const envelope: ApiErrorBody =
          data && typeof data === "object" ? data : {};
        throw new ApiError(backendErrorMessage(data, raw, response), {
          status: response.status,
          kind: "http",
          field:
            typeof envelope.field === "string" ? envelope.field : undefined,
          requestId: response.headers.get("X-Request-ID") ?? undefined,
          details: data ?? raw,
        });
      }

      if (data === undefined && response.status !== 204) {
        throw new ApiError("پاسخ سرویس خالی است.", {
          kind: "invalid-response",
          status: response.status,
        });
      }
      return data as T;
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : timedOut
            ? new ApiError(
                "زمان انتظار تمام شد. وضعیت درخواست را پیش از تکرار بررسی کنید.",
                { kind: "timeout" },
              )
            : controller.signal.aborted
              ? new ApiError("درخواست لغو شد.", { kind: "aborted" })
              : new ApiError(
                  error instanceof Error
                    ? error.message
                    : typeof error === "string"
                      ? error
                      : "Network request failed without a readable backend response",
                  {
                    kind: "network",
                    details:
                      error instanceof Error
                        ? { name: error.name, message: error.message }
                        : undefined,
                  },
                );
      if (config.onError && apiError.kind !== "aborted") {
        const diagnostic: ApiErrorDiagnostic = {
          method,
          path,
          status: apiError.status,
          kind: apiError.kind,
          message: apiError.message,
          field: apiError.field,
          requestId: apiError.requestId,
          details: apiError.details,
        };
        try {
          // Diagnostics must never expose the credential or change request behavior.
          config.onError(
            JSON.parse(
              JSON.stringify(diagnostic).replaceAll(token, "[REDACTED]"),
            ),
          );
        } catch {
          /* A logger failure must not mask the original API error. */
        }
      }
      throw apiError;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
    }
  }

  return {
    get: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>("GET", path, undefined, options),
    post: <T, B>(path: string, body?: B, options?: ApiRequestOptions) =>
      request<T>("POST", path, body, options),
    put: <T, B>(path: string, body: B, options?: ApiRequestOptions) =>
      request<T>("PUT", path, body, options),
  };
}
