import assert from "node:assert/strict";
import { test } from "node:test";
import { BOOT_SCRIPT, DEFAULT_SETTINGS, SETTINGS_KEY, parseSettings } from "./settings.ts";

test("stores under its own key, nothing by default", () => {
  assert.equal(SETTINGS_KEY, "innomi.settings.v1");
  assert.deepEqual(DEFAULT_SETTINGS, { locale: null });
});

test("keeps a known locale and nothing else", () => {
  assert.deepEqual(parseSettings({ locale: "fr", extra: 1 }), { locale: "fr" });
  assert.deepEqual(parseSettings({ locale: "de" }), { locale: null });
  assert.deepEqual(parseSettings(null), { locale: null });
  assert.deepEqual(parseSettings("fr"), { locale: null });
});

function runBootScript(stored: string | null, languages: string[] = ["en-US"], language = ""): string | undefined {
  const attributes: Record<string, string> = {};
  const storage = { getItem: (key: string) => (key === SETTINGS_KEY ? stored : null) };
  const doc = { documentElement: { setAttribute: (name: string, value: string) => { attributes[name] = value; } } };
  new Function("localStorage", "document", "navigator", BOOT_SCRIPT)(storage, doc, { languages, language });
  return attributes.lang;
}

test("boot script: saved language, else the browser's, else English", () => {
  assert.equal(runBootScript(JSON.stringify({ locale: "en" }), ["fr-FR"]), "en");
  assert.equal(runBootScript(null, ["fr-FR"]), "fr");
  assert.equal(runBootScript(JSON.stringify({ locale: "xx" }), ["fr-BE"]), "fr");
  assert.equal(runBootScript("{not json", ["de"]), "en");
  assert.equal(runBootScript(null, [], "fr"), "fr");
});
