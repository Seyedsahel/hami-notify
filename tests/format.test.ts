import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeDigits,
  normalizeSearch,
  normalizePhone,
  isValidPhone,
  publicLink,
} from "../app/utils/format.ts";

test("normalizes Persian and Arabic input while preserving leading zeros", () => {
  assert.equal(normalizeDigits("۰۰۳٤٢١٠"), "0034210");
  assert.equal(normalizePhone("۰۹۱۲-۰۰۰ ۶۷۸۹"), "09120006789");
  assert.equal(normalizeSearch("  كرم يک ۰۰۳۴  "), "کرم یک 0034");
});

test("validates Iranian mobile input without accepting partial or international numbers", () => {
  assert.equal(isValidPhone("۰۹۱۲ ۰۰۰ ۶۷۸۹"), true);
  for (const phone of [
    "0912",
    "00989120006789",
    "08120006789",
    "091200067890",
    "0912000678a",
  ])
    assert.equal(isValidPhone(phone), false);
});

test("only allows HTTP(S) storefront links", () => {
  assert.equal(
    publicLink("https://shop.example/b/lesson"),
    "https://shop.example/b/lesson",
  );
  for (const link of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "/relative",
    "not a url",
  ])
    assert.equal(publicLink(link), undefined);
});
