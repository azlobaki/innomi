import { LOCALES, isLocale, type Locale } from "./i18n/text.ts";

/** The second and last key Innomi may write: the interface language, once picked. Never any text. */
export const SETTINGS_KEY = "innomi.settings.v1";

export type Settings = {
  /** Interface language; null follows the browser. */
  locale: Locale | null;
};

export const DEFAULT_SETTINGS: Settings = { locale: null };

/** Stored values are untrusted: anything but a known locale is dropped. */
export function parseSettings(value: unknown): Settings {
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return { locale: isLocale(raw.locale) ? raw.locale : null };
}

/**
 * Runs inline in <head>, before first paint: sets <html lang> to the saved
 * language, else the browser's first supported one, else English. A string:
 * no imports, nothing to bundle.
 */
export const BOOT_SCRIPT = `(function(){var s=null;try{s=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_KEY,
)})||"null")}catch(e){}var L=${JSON.stringify(LOCALES)};var l=s&&s.locale;if(L.indexOf(l)<0){l="en";var n=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""]);for(var i=0;i<n.length;i++){var b=String(n[i]).toLowerCase().split("-")[0];if(L.indexOf(b)>-1){l=b;break}}}document.documentElement.setAttribute("lang",l)})()`;
