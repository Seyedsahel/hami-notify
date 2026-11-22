/** Shared contracts from notifyAppSwagger.json (Swagger 2, /api/v1). */
export interface PageQuery {
  page?: number;
  limit?: number;
}

export interface SearchQuery extends PageQuery {
  q?: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  has_more: boolean;
}

export interface CountedPage<T> extends Page<T> {
  total: number;
}

export interface ApiErrorBody {
  error?: string;
  field?: string;
}

export type Category = "cosmetics" | "medicines" | "supplements";
export type Priority = "urgent" | "high" | "normal";
export type QueueStatus = "ready" | "waiting";
export type SmsKind = "education" | "stock";
export type SmsStatus =
  | "queued"
  | "sending"
  | "accepted"
  | "delivered"
  | "undelivered"
  | "failed"
  | "review";
export type AriaOutcome = "success" | "rejected" | "unavailable";

export interface EducationSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  url: string;
  short_path: string;
  thumbnail_url?: string;
  published_at?: number;
}

export interface Product {
  /** String codes retain their leading zeros. */
  code: string;
  name: string;
  quantity: number;
}

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export interface StockRequestOptions {
  categories: Option<Category>[];
  priorities: Option<Priority>[];
}

export interface StockRegistration {
  product_code: string;
  phone: string;
  category: Category;
  priority: Priority;
}

export interface StockRequest extends StockRegistration {
  id: string;
  created_at: string;
  quantity: number;
  status: QueueStatus;
}

export interface QueueProduct extends Product {
  ready_count: number;
  waiting_count: number;
}

export interface QueueProductQuery extends SearchQuery {
  category?: Category;
  status?: QueueStatus | "all";
}

export interface QueueQuery extends PageQuery {
  product_code: string;
  phone?: string;
  category?: Category;
  priority?: Priority;
  status?: QueueStatus | "all";
}

export interface EducationSmsInput {
  phone: string;
  slug: string;
}

export interface StockSmsInput {
  product_code: string;
  /** 1–100 unique IDs belonging to the selected product. */
  request_ids: string[];
}

export interface SmsMessage {
  id: string;
  kind: SmsKind;
  status: SmsStatus;
  title: string;
  masked_phone: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  education_slug?: string;
  stock_request_id?: string;
  provider_id?: string;
  error_code?: string;
}

export interface SmsAttempt {
  number: number;
  status: "sending" | "accepted" | "failed" | "review";
  started_at: string;
  finished_at?: string;
  error_code?: string;
}

export interface SmsDetail {
  message: SmsMessage;
  attempts: SmsAttempt[];
}

export interface SmsQuery extends SearchQuery {
  kind?: SmsKind;
  status?: SmsStatus;
}

export interface SmsPattern {
  pattern_code: string;
  pattern_message: string;
  pattern_status: string;
  title: string;
  variable: { name: string; type: string; len: number }[];
}

export interface SmsBinding {
  pattern_code: string;
  mapping: Record<string, string>;
}

export interface SmsSettings {
  enabled: boolean;
  sender: string;
  max_retries: number;
  education: SmsBinding | null;
  stock: SmsBinding | null;
}

export interface SmsSettingsResponse {
  settings: SmsSettings;
  provider_configured: boolean;
  education_sources: string[];
  stock_sources: string[];
}

export interface AriaReceipt {
  request_id: string;
  received_at: string;
  outcome: AriaOutcome;
  duration_ms: number;
  item_count: number;
}

export interface AriaQuery extends SearchQuery {
  outcome?: AriaOutcome;
}

export interface Customer {
  phone: string;
  last_activity_at: string;
  sms_count: number;
  sent_sms_count: number;
  stock_request_count: number;
}

export interface CustomerQuery extends SearchQuery {
  has_sent_sms?: boolean;
}

export interface CustomerStock {
  id: string;
  category: Category;
  priority: Priority;
  product_code: string;
  product_name: string;
  status: QueueStatus | "sent";
  created_at: string;
  sent_at?: string;
}

export type CustomerSms = Omit<
  SmsMessage,
  "masked_phone" | "provider_id" | "error_code"
>;

export interface CustomerDetail {
  customer: Customer;
  stock_requests: Page<CustomerStock>;
  sms: Page<CustomerSms>;
}

export interface CustomerHistoryQuery {
  stock_page?: number;
  sms_page?: number;
  limit?: number;
}
