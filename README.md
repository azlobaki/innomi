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
- **Only templates are stored.** The single key ever written is
  `innomi.templates.v1`, and it only holds rules you explicitly saved. That
  restraint is deliberate: a rule's "text to find" *is* the sensitive value, so
  nothing is persisted until you ask for it by name.
- **No third-party requests.** Fonts are self-hosted by `next/font`. The page
  loads no analytics, no CDN, no tracker.

### Check it yourself

Don't take the list above on faith:

- Open your browser's **Network** tab, paste something, hit Apply. Nothing new
  is requested.
- Open **Application → Local Storage**. Either it is empty, or it holds exactly
  one key of templates you saved.
- Turn off your Wi-Fi and reload. The app keeps working.
- Read [src/app/page.tsx](src/app/page.tsx) — the whole state of the app is about
  150 lines.

## What it does

- **Rules**: pairs of "text to find" → "replacement". An empty replacement
  deletes the match. Each rule has its own `Aa` toggle for case sensitivity and
  shows how many occurrences it hit.
- **Templates**: save the current rule list under a name ("HR data", "Network
  config") and load it back in one click.
- **Apply**: the main button, or `Ctrl`/`Cmd` + `Enter`. Tick "Live preview" to
  recompute on every keystroke instead.
- **Highlighting**: matches are shown in amber in the original text, their
  replacements in green in the result, and a rose bar marks where something was
  deleted. Hover a highlight to see which rule caused it.
- **Copy**: one button puts the result on your clipboard.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # replacement engine tests (node:test)
npm run build    # static export into out/
```

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

For anything else, `npm run build` and serve `out/`.

## Project layout

```
src/
  app/page.tsx              app state (rules, templates, text)
  components/RulesPanel.tsx left column: templates + rules
  components/WorkArea.tsx   original → Apply → anonymized
  components/Highlight.tsx  renders the highlighted segments
  hooks/useLocalStorage.ts  template persistence, safe for static export
  lib/anonymize.ts          single-pass replacement engine
  lib/types.ts              Rule / Template types + localStorage validation
```

Built with Next.js, React and Tailwind CSS.

## License

Copyright © 2026 Innomi contributors. Licensed under the
[GNU Affero General Public License v3.0](LICENSE).

Use it, study it, change it, share it. The one condition worth knowing: if you
deploy a modified version as a hosted service, you have to publish your changes
under the same license. That is deliberate — it is what keeps the privacy claims
above checkable on *any* Innomi someone puts in front of you, not just this one.

If you host it, set `SOURCE_URL` in [src/app/page.tsx](src/app/page.tsx) to your
repository. The page then links to its own source, as section 13 requires.
