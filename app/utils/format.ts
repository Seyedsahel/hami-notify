export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizePhone(value: string): string {
  return normalizeDigits(value).replace(/[\s-]/g, "");
}

export function isValidPhone(value: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(value));
}

export function normalizeSearch(value: string): string {
  return normalizeDigits(value).replace(/ي/g, "ی").replace(/ك/g, "ک").trim();
}

export function faDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]!);
}

export function formatDate(value?: string | number): string {
  if (!value) return "—";
  const date = new Date(typeof value === "number" ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(date);
}

/** Only public HTTP(S) links from content summaries may be opened. */
export function publicLink(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
