import type {
  Category,
  Priority,
  SmsStatus,
  SmsKind,
  AriaOutcome,
} from "~/types/api";

export const smsStatusLabels: Record<SmsStatus, string> = {
  queued: "در صف ارسال",
  sending: "در حال ارسال",
  accepted: "پذیرفته‌شده توسط پیامک‌رسان",
  delivered: "تحویل‌شده",
  undelivered: "تحویل‌نشده",
  failed: "ارسال ناموفق",
  review: "نیازمند بررسی",
};
export const smsKindLabels: Record<SmsKind, string> = {
  education: "آموزش",
  stock: "اطلاع موجودی",
};
export const categoryLabels: Record<Category, string> = {
  cosmetics: "آرایشی",
  medicines: "دارویی",
  supplements: "مکملی",
};
export const priorityLabels: Record<Priority, string> = {
  urgent: "فوری",
  high: "بالا",
  normal: "عادی",
};
export const outcomeLabels: Record<AriaOutcome, string> = {
  success: "موفق",
  rejected: "ردشده",
  unavailable: "سرویس ناموجود",
};
