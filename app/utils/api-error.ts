export type ApiErrorKind =
  | "http"
  | "network"
  | "timeout"
  | "aborted"
  | "configuration"
  | "invalid-response";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly field?: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      kind: ApiErrorKind;
      field?: string;
      requestId?: string;
      details?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.kind = options.kind;
    this.field = options.field;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "درخواست انجام نشد. دوباره تلاش کنید.";
}
