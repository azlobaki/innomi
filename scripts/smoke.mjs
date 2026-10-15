// Browser regression test. Serves out/ (run `npm run build` first), drives
// headless Chromium over the DevTools protocol and fails on:
// - any request leaving the local server, any page error (CSP violations too);
// - anything written to localStorage before a template is saved, or any pasted
//   text found in it afterwards;
// - a big paste (with a long unbroken token) that scrolls the page sideways,
//   stretches it past the window, or misaligns the highlight backdrop;
// - Apply, Live preview or "Add rule" leaving the window, with a long rule list
//   or a long text, at desktop and phone width;
// - the keyboard flow (Enter adds a rule, Ctrl+Enter applies) breaking;
// - the legal notice losing its key statements.
// Screenshots land in .smoke/. Set CHROME to override the browser binary.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const SHOTS = join(ROOT, ".smoke");
const STORAGE_KEY = "innomi.templates.v1";
const RULES = 80;
// Never matched by any rule: if it ever reaches storage, the text leaked.
const SENTINEL = "SENTINEL-NOT-A-RULE-7f3a";
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
};

function serve() {
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (path.endsWith("/")) path += "index.html";
    let file = join(OUT, path);
    if (!file.startsWith(OUT)) return res.writeHead(403).end();
    // Next exports /page as page.html, sometimes next to a page/ directory of its own.
    const isFile = (f) => existsSync(f) && statSync(f).isFile();
    if (!isFile(file) && isFile(`${file}.html`)) file += ".html";
    if (!isFile(file)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function launch() {
  const profile = mkdtempSync(join(tmpdir(), "innomi-smoke-"));
  const proc = spawn(
    process.env.CHROME ?? "chromium",
    [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions",
      // Ubuntu 24.04 CI runners forbid the unprivileged user namespaces Chrome's
      // sandbox needs; the pages loaded here are our own build.
      ...(process.env.CI ? ["--no-sandbox"] : []),
      `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const wsUrl = await new Promise((ok, fail) => {
    let log = "";
    proc.stderr.on("data", (chunk) => {
      log += chunk;
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(log);
      if (match) ok(match[1]);
    });
    proc.on("exit", (code) => fail(new Error(`Chromium exited (${code}):\n${log}`)));
  });
  return { proc, profile, wsUrl };
}

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  const listeners = new Set();
  let seq = 0;
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) fail(new Error(msg.error.message));
      else ok(msg.result);
    } else {
      for (const listener of listeners) listener(msg);
    }
  };
  return {
    opened: new Promise((ok, fail) => {
      ws.onopen = ok;
      ws.onerror = fail;
    }),
    send(method, params = {}, sessionId) {
      return new Promise((ok, fail) => {
        const id = ++seq;
        pending.set(id, { ok, fail });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
    once(method, sessionId) {
      return new Promise((ok) => {
        const listener = (msg) => {
          if (msg.method === method && msg.sessionId === sessionId) {
            listeners.delete(listener);
            ok(msg.params);
          }
        };
        listeners.add(listener);
      });
    },
    on(listener) {
      listeners.add(listener);
    },
    close() {
      ws.close();
    },
  };
}

/**
 * About 200 kB: thousands of lines, one token no space can break, and few
 * enough matches that highlighting stays on (see MAX_PIECES).
 */
function bigText() {
  const named = `Alice Martin (alice.martin@example.com) called ACME about ticket 4471. ${SENTINEL}\n`;
  const plain = "The customer called the Lyon office about a delayed delivery; see notes below.\n";
  const block = named + plain.repeat(9);
  const unbroken = "x".repeat(5000);
  return `${block.repeat(120)}${unbroken}\n${block.repeat(80)}`;
}

// Runs in the page. React ignores a plain `.value =`, so go through the native
// setter and fire the event React listens to.
const PAGE_HELPERS = `
  window.__set = (el, value) => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  window.__inView = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
  };
  window.__overflow = () => ({
    x: document.documentElement.scrollWidth - innerWidth,
    y: document.documentElement.scrollHeight - innerHeight,
  });
  true;
`;

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/`;
const { proc, profile, wsUrl } = await launch();
const cdp = connect(wsUrl);
const failures = [];
const external = [];
const errors = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

try {
  await cdp.opened;
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const page = (method, params) => cdp.send(method, params, sessionId);
  for (const domain of ["Page", "Network", "Runtime", "Log"]) await page(`${domain}.enable`);
  cdp.on((msg) => {
    if (msg.method !== "Network.requestWillBeSent" || msg.sessionId !== sessionId) return;
    const url = msg.params.request.url;
    // Only network schemes count: browser-internal ones (data:, blob:) never leave the machine.
    if (/^(https?|wss?):/.test(url) && !url.startsWith(base)) external.push(url);
  });
  // CSP violations, React errors and uncaught exceptions all land here.
  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Runtime.exceptionThrown") {
      const details = msg.params.exceptionDetails;
      errors.push(details.exception?.description ?? details.text);
    } else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
      errors.push(msg.params.entry.text);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      errors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
    }
  });

  const evaluate = async (expression) => {
    const result = await page("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };
  const wait = (ms) => evaluate(`new Promise((ok) => setTimeout(ok, ${ms}))`);
  const load = async (url) => {
    const loaded = cdp.once("Page.loadEventFired", sessionId);
    await page("Page.navigate", { url });
    await loaded;
    // Let React hydrate and the stored templates be read.
    await wait(400);
    await evaluate(PAGE_HELPERS);
  };
  const viewport = (width, height) =>
    // Not emulated as "mobile": Chromium would then widen the layout viewport
    // to fit the content, hiding the very overflow this test looks for.
    page("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  const screenshot = async (name) => {
    const { data } = await page("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(SHOTS, name), Buffer.from(data, "base64"));
  };
  const key = (keyName, modifiers = 0) =>
    page("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: keyName,
      code: keyName,
      windowsVirtualKeyCode: keyName === "Enter" ? 13 : 0,
      modifiers,
    }).then(() => page("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code: keyName, modifiers }));
  const ruleCount = () => evaluate(`document.querySelectorAll('[data-field="find"]').length`);

  /** Fills the first rule, adds rules up to RULES, pastes the big text and applies. */
  const fillUp = async (label) => {
    await evaluate(`(() => {
      __set(document.querySelector('[data-field="find"]'), "Alice");
      __set(document.querySelector('[data-field="replace"]'), "PERSON_1");
      return true;
    })()`);
    while ((await ruleCount()) < RULES) await evaluate(`document.getElementById("add-rule").click(), true`);
    await wait(100);
    const focusedIsLast = await evaluate(`(() => {
      const finds = document.querySelectorAll('[data-field="find"]');
      return document.activeElement === finds[finds.length - 1];
    })()`);
    check(focusedIsLast, `${label}: "Add rule" does not focus the new rule`);
    check(await evaluate(`__inView("#add-rule")`), `${label}: "Add rule" is off screen with ${RULES} rules`);
    const lastVisible = await evaluate(`(() => {
      const finds = document.querySelectorAll('[data-field="find"]');
      const list = finds[0].closest("ul").getBoundingClientRect();
      const last = finds[finds.length - 1].getBoundingClientRect();
      return last.top >= list.top && last.bottom <= list.bottom;
    })()`);
    check(lastVisible, `${label}: the rule just added is scrolled out of its list`);

    await evaluate(`__set(document.getElementById("input"), ${JSON.stringify(bigText())}), true`);
    await evaluate(`document.getElementById("apply").click(), true`);
    await wait(300);
    const output = await evaluate(`document.querySelector('[data-testid="output"]').innerText`);
    check(output.includes("PERSON_1") && !output.includes("Alice"), `${label}: Apply did not replace "Alice"`);
  };

  const checkLayout = async (label, { fitsWindow }) => {
    const overflow = await evaluate("__overflow()");
    check(overflow.x <= 0, `${label}: ${overflow.x} px of horizontal scrolling`);
    if (fitsWindow) check(overflow.y <= 0, `${label}: the page is ${overflow.y} px taller than the window`);
    const marks = await evaluate(`document.querySelectorAll('[data-testid="backdrop"] mark').length`);
    check(marks > 0, `${label}: no highlight under the original text`);
    // The textarea and its highlight layer must wrap the same way, or the marks drift off their words.
    const drift = await evaluate(`(() => {
      const textarea = document.getElementById("input");
      const backdrop = document.querySelector('[data-testid="backdrop"]');
      return Math.abs(textarea.scrollHeight - backdrop.scrollHeight);
    })()`);
    check(drift <= 2, `${label}: highlight layer is ${drift} px out of step with the text`);
    for (const id of ["apply", "live"]) {
      check(await evaluate(`__inView("#${id}")`), `${label}: #${id} is off screen`);
    }
  };

  mkdirSync(SHOTS, { recursive: true });

  // Desktop.
  await viewport(1440, 900);
  await load(base);
  await wait(1100);
  check((await evaluate("localStorage.length")) === 0, "a first visit wrote to localStorage");
  await screenshot("desktop-empty.png");
  await fillUp("1440 px");
  await checkLayout("1440 px", { fitsWindow: true });
  // Scrolled to the very end of the text, the controls must not have moved.
  await evaluate(`(() => { const t = document.getElementById("input"); t.scrollTop = t.scrollHeight; return true; })()`);
  await wait(100);
  await checkLayout("1440 px, scrolled to the end", { fitsWindow: true });
  await screenshot("desktop-full.png");

  // Keyboard: Enter in the last replacement adds a rule, Ctrl+Enter applies.
  await evaluate(`(() => { const r = document.querySelectorAll('[data-field="replace"]'); r[r.length - 1].focus(); return true; })()`);
  await key("Enter");
  await wait(100);
  check((await ruleCount()) === RULES + 1, "Enter in the last replacement did not add a rule");
  await evaluate(`__set(document.querySelector('[data-field="replace"]'), "PERSON_2"), true`);
  await key("Enter", 2);
  await wait(300);
  const rekeyed = await evaluate(`document.querySelector('[data-testid="output"]').innerText.includes("PERSON_2")`);
  check(rekeyed, "Ctrl+Enter did not apply");

  check((await evaluate("localStorage.length")) === 0, "typing text and rules wrote to localStorage");
  await evaluate(`(() => {
    __set(document.querySelector('[aria-label="Template name"]'), "Smoke");
    return true;
  })()`);
  await evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent === "Save").click(), true`);
  await wait(200);
  const keys = await evaluate("Object.keys(localStorage)");
  check(JSON.stringify(keys) === JSON.stringify([STORAGE_KEY]), `saving a template wrote ${JSON.stringify(keys)}`);
  const stored = await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) ?? ""`);
  check(stored.includes("PERSON_2"), "the saved template does not hold its rules");
  check(!stored.includes(SENTINEL), "the pasted text reached localStorage");

  // Dark scheme: same layout, its own colours.
  await page("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await wait(100);
  const dark = await evaluate(`getComputedStyle(document.body).backgroundColor`);
  check(dark === "rgb(17, 17, 16)", `dark scheme not applied (body is ${dark})`);
  await screenshot("desktop-dark.png");
  await page("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });

  // Legal notice.
  // French first (the saved language), then English (nothing saved).
  await load(base);
  await evaluate(`localStorage.setItem("innomi.settings.v1", '{"locale":"fr"}')`);
  await load(`${base}mentions-legales`);
  const legalFr = await evaluate("document.body.innerText");
  for (const want of [
    "Vercel Inc.",
    "contact.azlobaki@pm.me",
    "Relisez toujours le résultat",
    STORAGE_KEY,
    "https://github.com/azlobaki/innomi",
  ]) {
    check(legalFr.includes(want), `legal notice (fr) misses "${want}"`);
  }
  await evaluate(`localStorage.removeItem("innomi.settings.v1")`);
  await load(`${base}mentions-legales`);
  const legal = await evaluate("document.body.innerText");
  for (const want of [
    "Vercel Inc.",
    "contact.azlobaki@pm.me",
    "the French text is the legally binding one",
    "innomi.settings.v1",
  ]) {
    check(legal.includes(want), `legal notice (en) misses "${want}"`);
  }
  await screenshot("desktop-legal.png");
  await evaluate("localStorage.clear()");

  // Phone: the page scrolls, but never sideways, and the actions stay at hand.
  await viewport(390, 844);
  await load(base);
  await fillUp("390 px");
  const listHeight = await evaluate(`document.querySelector('[data-field="find"]').closest("ul").getBoundingClientRect().height`);
  check(listHeight <= 844 * 0.45 + 1, `390 px: the rule list is ${Math.round(listHeight)} px tall`);
  await evaluate(`document.getElementById("input").scrollIntoView(), true`);
  await wait(100);
  await checkLayout("390 px, at the text", { fitsWindow: false });
  await screenshot("phone-text.png");
  await evaluate("window.scrollTo(0, document.documentElement.scrollHeight), true");
  await wait(100);
  check((await evaluate("__overflow()")).x <= 0, "390 px, page bottom: horizontal scrolling");
  await load(`${base}mentions-legales`);
  check((await evaluate("__overflow()")).x <= 0, "390 px, legal notice: horizontal scrolling");
} finally {
  cdp.close();
  // Chromium keeps writing its profile until it has exited.
  const exited = new Promise((ok) => proc.once("exit", ok));
  proc.kill();
  await exited;
  server.close();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

if (external.length > 0) failures.push(`External requests:\n  ${[...new Set(external)].join("\n  ")}`);
if (errors.length > 0) failures.push(`Page errors:\n  ${[...new Set(errors)].join("\n  ")}`);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Smoke test passed. Screenshots in .smoke/");
