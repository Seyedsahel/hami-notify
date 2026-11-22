import { test, expect } from "@playwright/test";
import { mockApi, lesson, product, messageId, receiptId } from "./fixtures";

test("keeps counter narrow and dashboard wide, including direct route reload", async ({
  page,
}) => {
  await mockApi(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "چطور کمک کنیم؟" }),
  ).toBeVisible();
  expect((await page.locator(".counter-panel").boundingBox())?.width).toBe(360);
  await page.getByRole("link", { name: "مدیریت سامانه" }).click();
  await expect(
    page.getByRole("heading", { name: "مدیریت سامانه" }),
  ).toBeVisible();
  expect(
    (await page.locator(".dashboard-main").boundingBox())!.width,
  ).toBeGreaterThan(800);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "مدیریت سامانه" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("education flow normalizes the phone and retains the lesson for the next customer", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/education/send");
  await page.getByRole("radio", { name: new RegExp(lesson.title) }).check();
  await page.getByRole("button", { name: "ادامه", exact: true }).click();
  await page.getByLabel("شماره موبایل مشتری").fill("۰۹۱۲-۰۰۰ ۶۷۸۹");
  await page
    .getByRole("button", { name: "ارسال لینک آموزش", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "ارسال لینک", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "درخواست ارسال ثبت شد" }),
  ).toBeVisible();
  expect(api.educationCalls[0]?.input).toEqual({
    slug: lesson.slug,
    phone: "09120006789",
  });
  expect(api.educationCalls[0]?.key).toBeTruthy();
  await page.getByRole("button", { name: "ثبت برای مشتری بعدی" }).click();
  await expect(page.getByLabel("شماره موبایل مشتری")).toHaveValue("");
  await expect(page.getByText(lesson.title, { exact: true })).toBeVisible();
});

test("reuses the education idempotency key after a lost response", async ({
  page,
}) => {
  const api = await mockApi(page, { failEducationOnce: true });
  await page.goto("/education/send");
  await page.getByRole("radio", { name: new RegExp(lesson.title) }).check();
  await page.getByRole("button", { name: "ادامه", exact: true }).click();
  await page.getByLabel("شماره موبایل مشتری").fill("09120006789");
  for (let attempt = 0; attempt < 2; attempt++) {
    await page
      .getByRole("button", { name: "ارسال لینک آموزش", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "ارسال لینک", exact: true })
      .click();
    if (!attempt)
      await expect(page.locator(".counter-form .error-panel")).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "درخواست ارسال ثبت شد" }),
  ).toBeVisible();
  expect(api.educationCalls).toHaveLength(2);
  expect(api.educationCalls[0]?.key).toBe(api.educationCalls[1]?.key);
});

test("shows the returned status when an existing education confirmation has progressed", async ({
  page,
}) => {
  await mockApi(page, { educationStatus: "delivered" });
  await page.goto("/education/send");
  await page.getByRole("radio", { name: new RegExp(lesson.title) }).check();
  await page.getByRole("button", { name: "ادامه", exact: true }).click();
  await page.getByLabel("شماره موبایل مشتری").fill("09120006789");
  await page
    .getByRole("button", { name: "ارسال لینک آموزش", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "ارسال لینک", exact: true })
    .click();
  await expect(
    page.locator(".receipt dd").filter({ hasText: "تحویل‌شده" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "جزئیات ارسال و تحویل" }),
  ).toHaveAttribute("href", `/admin/sms/${messageId}`);
});

test("cancels an unconfirmed send when the counter page is left", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/");
  await page.getByRole("link", { name: /آموزش ارسال لینک/ }).click();
  await page.getByRole("radio", { name: new RegExp(lesson.title) }).check();
  await page.getByRole("button", { name: "ادامه", exact: true }).click();
  await page.getByLabel("شماره موبایل مشتری").fill("09120006789");
  await page
    .getByRole("button", { name: "ارسال لینک آموزش", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "چطور کمک کنیم؟" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(api.educationCalls).toHaveLength(0);
});

test("validates stock input and displays the backend-preserved category and priority", async ({
  page,
}) => {
  const api = await mockApi(page, { duplicateStock: true });
  await page.goto("/stock/register");
  await page.getByRole("radio", { name: new RegExp(product.name) }).check();
  await page.getByRole("button", { name: "ادامه", exact: true }).click();
  await page.getByLabel("شماره موبایل مشتری").fill("0912");
  await page.getByRole("button", { name: "ثبت درخواست موجودی" }).click();
  await expect(page.locator(".field-error")).toContainText("۱۱ رقمی");
  expect(api.registrations).toHaveLength(0);
  await page.getByLabel("شماره موبایل مشتری").fill("۰۹۱۲۰۰۰۶۷۸۹");
  await page.getByLabel("دسته‌بندی درخواست").selectOption("cosmetics");
  await page.getByRole("radio", { name: "عادی", exact: true }).check();
  await page.getByRole("button", { name: "ثبت درخواست موجودی" }).click();
  await expect(
    page.getByRole("heading", { name: "درخواست ثبت شد", exact: true }),
  ).toBeVisible();
  expect(api.registrations[0]).toEqual({
    product_code: "0034210",
    phone: "09120006789",
    category: "cosmetics",
    priority: "normal",
  });
  await expect(
    page.locator(".receipt dd").filter({ hasText: "دارویی" }),
  ).toBeVisible();
  await expect(
    page.locator(".receipt dd").filter({ hasText: "بالا" }),
  ).toBeVisible();
});

test("selects only ready stock requests and sends explicit recipients", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/admin/stock-queue/0034210");
  await expect(
    page.getByRole("checkbox", { name: "انتخاب درخواست 09120006788" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "انتخاب آماده‌های این صفحه" }).click();
  await page
    .getByRole("button", { name: "ارسال اطلاع موجودی", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "ثبت ارسال پیامک" })
    .click();
  await expect.poll(() => api.stockCalls.length).toBe(1);
  expect(api.stockCalls[0]).toEqual({
    product_code: "0034210",
    request_ids: ["request-1"],
  });
  await expect(page.getByText("۰ درخواست انتخاب شده")).toBeVisible();
});

test("retries failed SMS and distinguishes queued state from delivery", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto(`/admin/sms/${messageId}`);
  await expect(
    page.getByRole("button", { name: "تلاش مجدد ارسال" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "تلاش مجدد ارسال" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "تلاش مجدد ارسال" })
    .click();
  await expect(page.locator("dd .badge")).toHaveText("در صف ارسال");
  await expect(
    page.getByRole("button", { name: "تلاش مجدد ارسال" }),
  ).toHaveCount(0);
});

test("does not expose retry for ambiguous SMS outcomes", async ({ page }) => {
  await mockApi(page, { smsStatus: "review" });
  await page.goto(`/admin/sms/${messageId}`);
  await expect(
    page.getByText("نتیجه این ارسال مشخص نیست", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "تلاش مجدد ارسال" }),
  ).toHaveCount(0);
});

test("maps exact SMS pattern variables and saves the complete settings payload", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/admin/sms-settings");
  await page.getByLabel("فعال بودن ارسال پیامک").check();
  const education = page.locator("section").filter({
    has: page.getByRole("heading", { name: "پیامک آموزش", exact: true }),
  });
  await education
    .getByLabel("الگوی پیامک", { exact: true })
    .selectOption("education-pattern");
  await education.getByLabel("مقدار متغیر link").selectOption("education_url");
  const stock = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "پیامک اطلاع موجودی",
      exact: true,
    }),
  });
  await stock
    .getByLabel("الگوی پیامک", { exact: true })
    .selectOption("stock-pattern");
  await stock.getByLabel("مقدار متغیر product").selectOption("product_name");
  await page
    .getByRole("button", { name: "ذخیره تنظیمات", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "ذخیره تنظیمات", exact: true })
    .click();
  await expect.poll(() => api.settingsCalls.length).toBe(1);
  expect(api.settingsCalls[0]).toEqual({
    enabled: true,
    sender: "3000505",
    max_retries: 3,
    education: {
      pattern_code: "education-pattern",
      mapping: { link: "education_url" },
    },
    stock: {
      pattern_code: "stock-pattern",
      mapping: { product: "product_name" },
    },
  });
  await expect(
    page.getByRole("button", { name: "ذخیره تنظیمات", exact: true }),
  ).toBeDisabled();
});

test("keeps false customer filters in API requests and URL state", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/admin/customers");
  await page.getByLabel("سابقه ارسال").selectOption("false");
  await expect(page).toHaveURL(/has_sent_sms=false/);
  await expect
    .poll(() => api.customerQueries.at(-1)?.get("has_sent_sms"))
    .toBe("false");
  await page.getByRole("link", { name: "۰۹۱۲۰۰۰۶۷۸۹" }).click();
  await expect(
    page.getByRole("heading", { name: "درخواست‌های موجودی", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(product.name, { exact: true })).toBeVisible();
});

test("opens Aria receipt details and public education links", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/admin/arya");
  await page.getByRole("link", { name: "مشاهده رسید" }).click();
  await expect(
    page.getByRole("heading", { name: "رسید دریافت موجودی" }),
  ).toBeVisible();
  await expect(page.getByText(receiptId, { exact: true })).toBeVisible();
  await page.goto("/admin/education");
  await expect(
    page.getByRole("link", { name: "مشاهده در فروشگاه" }),
  ).toHaveAttribute("href", lesson.url);
});

test("invalid staff access is handled centrally", async ({ page }) => {
  await mockApi(page, { rejectAccess: true });
  await page.goto("/education/send");
  await expect(page.locator(".access-notice")).toBeVisible();
  await expect(page.locator(".error-state")).toBeVisible();
});

test("counter supports 320px screens without horizontal page overflow", async ({
  page,
}) => {
  await mockApi(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "چطور کمک کنیم؟" }),
  ).toBeVisible();
  await page.keyboard.press("2");
  await expect(
    page.getByRole("heading", { name: "اطلاع موجودی", exact: true }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "چطور کمک کنیم؟" }),
  ).toBeVisible();
});

test("counter selection supports Enter from both search and a focused radio", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/education/send");
  const search = page.getByLabel("جست‌وجوی آموزش", { exact: true });
  await expect(
    page.getByRole("radio", { name: new RegExp(lesson.title) }),
  ).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page.getByLabel("شماره موبایل مشتری")).toBeFocused();
  await page.keyboard.press("Escape");
  const radio = page.getByRole("radio", { name: new RegExp(lesson.title) });
  await radio.focus();
  await radio.press("Enter");
  await expect(page.getByLabel("شماره موبایل مشتری")).toBeFocused();
});
