import assert from "node:assert/strict";
import { test } from "node:test";
import { browserLanguages, detectLocale, isLocale } from "./text.ts";

test("the first supported browser language wins, else English", () => {
  assert.equal(detectLocale(["fr-FR", "en-US"]), "fr");
  assert.equal(detectLocale(["FR-ca"]), "fr");
  assert.equal(detectLocale(["de-DE", "fr-FR"]), "fr");
  assert.equal(detectLocale(["en-GB"]), "en");
  assert.equal(detectLocale(["es"]), "en");
  assert.equal(detectLocale([]), "en");
});

test("knows its locales", () => {
  assert.equal(isLocale("fr"), true);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("de"), false);
  assert.equal(isLocale(null), false);
});

test("falls back to navigator.language when languages is empty", () => {
  assert.deepEqual(browserLanguages({ languages: ["fr-FR"], language: "en" }), ["fr-FR"]);
  assert.deepEqual(browserLanguages({ languages: [], language: "fr" }), ["fr"]);
  assert.deepEqual(browserLanguages({}), [""]);
});
