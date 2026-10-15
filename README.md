# Innomi

Paste text, strip the sensitive parts out of it, copy the clean version back.
Rules are saved as reusable templates, so redacting the same kind of document
twice takes one click.

Innomi is a single static page. There is no account, no backend, and no network
call carrying your text — because there is no server to call.

## Why it is private

This is the whole point of the tool, so it is worth being precise about it.

- **No server.** The app is built with `output: "export"`, so `next build`
  produces plain HTML, CSS and JS. There are no API routes and no server-side
  rendering at runtime. Even if you wanted to send your text somewhere, there is
  nowhere for it to go.
- **The text never leaves the page.** Everything is a `"use client"` component.
  Your input and the anonymized result live in React state and nowhere else —
  not in `localStorage`, not in a cookie, not in the URL. Reloading the page
  wipes both.
- **Only templates and the language are stored.** At most two keys are ever
  written: `innomi.templates.v1`, which holds rules you explicitly saved, and
  `innomi.settings.v1`, which holds the interface language and is written only
  if you picked one with the FR | EN switch; never any text. That restraint is
  deliberate: a rule's "text to find" *is* the sensitive value, so nothing is
  persisted until you ask for it by name.
- **No third-party requests.** Fonts are self-hosted by `next/font`. The page
  loads no analytics, no CDN, no tracker.
- **The browser enforces it.** The built page carries a Content Security Policy
  with `connect-src 'none'` and `form-action 'none'` (also sent as a header by
  [vercel.json](vercel.json)): even a bug could not open a connection.

### Check it yourself

Don't take the list above on faith:

- Open your browser's **Network** tab, paste something, hit Apply. Nothing new
  is requested.
- Open **Application → Local Storage**. It stays empty until you save a
  template or use the FR | EN switch, then holds at most those two keys.
- Turn off your Wi-Fi and reload. The app keeps working.
- Read [src/app/page.tsx](src/app/page.tsx) — the whole state of the app is under
  about 200 lines.

## What it does

- **Rules**: pairs of "text to find" → "replacement". An empty replacement
  deletes the match. Each rule has its own `Aa` toggle for case sensitivity and
  shows how many occurrences it hit. "+ Add rule" sits at the top of the list
  and focuses the new rule; `Enter` moves from "find" to "replacement", and from
  the last replacement adds the next rule.
- **Templates**: save the current rule list under a name ("HR data", "Network
  config") and load it back in one click.
- **Apply**: the main button, or `Ctrl`/`Cmd` + `Enter`. Switch "Live preview"
  on to recompute on every keystroke instead.
- **Highlighting**: matches are marked in yellow in the original text, their
  replacements are shown as inverted blocks in the result, and a red bar marks
  where something was deleted. Hover a highlight to see which rule caused it.
- **Layout**: on a wide screen the app is exactly one window tall. The rule
  list and both texts scroll inside their own panels, so Apply and "Add rule"
  never move, however long the text or the list. Long unbroken strings (URLs,
  hashes, base64) wrap instead of widening the page.
- **Copy**: one button puts the result on your clipboard.
- **Languages**: French or English: the browser's language on the first visit,
  then the FR | EN switch in the header.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (node:test)
npm run build    # static export into out/
npm run smoke    # browser regression test against out/ (needs Chromium)
```

`npm run smoke` drives headless Chromium over the DevTools protocol, with no
extra dependency. It pastes a 160 kB text with a 5,000-character unbroken token
and 80 rules, then fails on any request leaving the page, any page error, any
text reaching `localStorage`, any horizontal scrolling (at 1440 and 390 px),
a highlight layer out of step with the text, or Apply / "Add rule" pushed off
screen. Screenshots land in `.smoke/`. Set `CHROME` to pick the browser binary.

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs the type check,
unit tests, lint, build and this browser test on every push and pull request,
and keeps the screenshots when it fails.

## How the replacement engine works

[src/lib/anonymize.ts](src/lib/anonymize.ts) applies every rule in a **single
pass** over the original text, instead of chaining `.replaceAll()` calls.

That matters for correctness, not just speed. With successive replacements,
`Alice → Bob` followed by `Bob → Carol` would quietly turn Alice into Carol —
text a rule just wrote would be rewritten by the next rule. Here every rule only
ever sees the source text, and overlaps are settled once: leftmost first, then
longest, then rule order.

Edge cases (mixed case sensitivity, overlapping occurrences, characters whose
lowercase form changes length like `İ`) are covered by
[src/lib/anonymize.test.ts](src/lib/anonymize.test.ts).

## Deploy

The build output is static, so anything that serves files will do.

For Vercel: push the repo, then "Add New… → Project" and import it. Next.js is
detected automatically and `output: "export"` is honoured. There is nothing to
configure — no environment variables, no external services.

For anything else, `npm run build` and serve `out/`, ideally with the headers
from [vercel.json](vercel.json).

## Legal notice

The page *Mentions légales et confidentialité* (`/mentions-legales`, linked from
every page's footer) gives the publisher and host as French law requires, the
privacy notice, and the tool's limits: Innomi only replaces what your rules
name, so its output is not anonymised in the GDPR sense until a human has read
it. The page also has an English translation, shown when the interface is in
English (the footer link then reads "Legal notice"); the French text is the
legally binding one. If you deploy your own copy, edit
[src/app/mentions-legales/page.tsx](src/app/mentions-legales/page.tsx) with your
own details.

## Project layout

```
src/
  app/page.tsx                    app state (rules, templates, text)
  app/mentions-legales/page.tsx   legal notice and privacy policy
  components/RulesPanel.tsx       left column: templates + rules
  components/WorkArea.tsx         action bar, original and anonymized side by side
  components/Highlight.tsx        renders the highlighted segments
  components/Footer.tsx           disclaimer, legal and source links
  components/ui.ts                shared class lists (colours come from globals.css)
  hooks/useLocalStorage.ts        template persistence, safe for static export
  i18n/                           dictionaries, locale context
  lib/i18n/                       language detection and helpers
  lib/settings.ts                 the saved interface language
  lib/anonymize.ts                single-pass replacement engine
  lib/csp.ts                      the page's Content Security Policy
  lib/types.ts                    Rule / Template types + localStorage validation
scripts/smoke.mjs                 browser regression test
```

Built with Next.js, React and Tailwind CSS.

## License

Copyright © 2026 Innomi contributors. Licensed under the
[GNU Affero General Public License v3.0](LICENSE).

Use it, study it, change it, share it. The one condition worth knowing: if you
deploy a modified version as a hosted service, you have to publish your changes
under the same license. That is deliberate — it is what keeps the privacy claims
above checkable on *any* Innomi someone puts in front of you, not just this one.

If you host a modified copy, set `SOURCE_URL` in
[src/components/Footer.tsx](src/components/Footer.tsx) to your repository. Every
page links to its own source, as section 13 requires.
