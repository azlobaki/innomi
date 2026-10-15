# Innomi — French and English (i18n)

Date: 2026-10-15 · Status: draft, awaiting review

Innomi's interface is English-only today, apart from its French legal notice.
This change offers every visible text in French and English, the same way
Perspicax does (`Perspicax/docs/superpowers/specs/2026-10-14-perspicax-i18n-design.md`),
minus what Innomi does not have: there is no analysis engine writing
sentences, and no report.

## 1. Decisions

| Question | Decision |
|---|---|
| Languages | English and French; English for any other browser language. |
| How the language is chosen | Same URL. First visit: the first supported language in `navigator.languages`. A FR \| EN switch in the header overrides it. |
| Where the choice is kept | A new key, `innomi.settings.v1` = `{ "locale": "fr" }`, written **only when the switch is used**. A visit that never touches it writes nothing new. |
| Translations | Written by hand, shipped with the page. No machine translation, no request. |
| Legal notice | Both languages; the English version says the French text is binding. |
| Libraries | None: a typed dictionary. |

### What this changes in Innomi's privacy promise

Today: *"The single key ever written is `innomi.templates.v1`"*. After:
*at most two keys, and never any text*: `innomi.templates.v1` (templates you
saved) and `innomi.settings.v1` (the interface language, if you picked one).
The README, the legal notice and the browser test say exactly this.

## 2. Pieces

Reused from Perspicax, adapted to Innomi's look (no themes):

- `src/lib/i18n/text.ts`: `Locale`, `LOCALES`, `isLocale`, `detectLocale`,
  `browserLanguages`.
- `src/lib/settings.ts`: `SETTINGS_KEY = "innomi.settings.v1"`,
  `Settings = { locale: Locale | null }`, `parseSettings`, `BOOT_SCRIPT`
  (sets `<html lang>` before first paint: saved locale, else browser, else
  English). `src/app/layout.tsx` runs it inline in `<head>`; the CSP already
  allows inline scripts.
- `src/hooks/useSettings.ts`: settings through the existing
  `useLocalStorage` (which already writes nothing until a value changes), the
  effective locale, `setLocale`.
- `src/i18n/messages.ts` (`fr: Messages = typeof en`),
  `src/i18n/LocaleContext.tsx` (`LocaleProvider`, `useLocale`, `useT`),
  `src/components/LocaleSwitch.tsx`.
- Hide-until-ready: `html[lang="fr"]:not([data-locale-ready]) [data-localised]`
  is hidden; the home page wraps everything in one `display: contents`
  element carrying `data-localised`.

## 3. Texts

- Every literal in `page.tsx`, `RulesPanel`, `WorkArea`, `Highlight` (hover
  titles), `Footer`: headings, buttons, placeholders, `aria-label`s,
  `title`s, empty states, counters, the three `window.confirm` questions.
- The document title follows the language.
- Rule text, template names and the text being anonymised are the user's
  and are never translated.

## 4. Legal notice

Two `<article lang>` in the page, one shown by CSS keyed on `<html lang>`
(no flash, no script needed); header switch and footer hidden until ready,
as on the home page. The English article opens with *"This translation is
provided for convenience; the French text is the legally binding one."* Both
articles describe the two keys as above.

## 5. Testing

- Unit: `detectLocale`, `browserLanguages`, `parseSettings`, `BOOT_SCRIPT`
  (saved, browser, English).
- Type check: the French dictionary has the English one's shape.
- Browser test (`scripts/smoke.mjs`):
  - every existing pass pinned to English, whatever the machine's locale;
  - first visit from a French browser: `<html lang="fr">`, French on
    screen, **nothing** in `localStorage`;
  - clicking FR writes exactly `innomi.settings.v1` = `{"locale":"fr"}`;
    saving a template then leaves exactly the two keys, and the pasted text
    is in neither;
  - French at 1440 px and 390 px: same layout checks as English (no
    horizontal scroll, Apply / Add rule on screen) — French labels are
    longer;
  - legal notice checked in both languages.

## 6. Out of scope

Other languages; separate URLs; translating user content.
