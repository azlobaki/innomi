"use client";

import { useT } from "@/i18n/LocaleContext";
import { LABEL } from "./ui";

/**
 * AGPL section 13: a copy offered to users over a network has to offer them
 * the source it runs on. Point this at your own repository if you deploy a
 * modified copy — the link disappears if it is emptied.
 */
const SOURCE_URL: string = "https://github.com/azlobaki/innomi";

export default function Footer() {
  const t = useT().footer;
  return (
    <footer className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule bg-paper px-4 py-2">
      <p className="text-xs text-muted">
        {t.disclaimer}
      </p>
      <span className="flex gap-4">
        {/* A plain link: Next's <Link> would prefetch, which the page's CSP forbids. */}
        <a className={`${LABEL} underline hover:text-ink`} href="/mentions-legales">
          {t.legal}
        </a>
        {SOURCE_URL && (
          <a
            className={`${LABEL} underline hover:text-ink`}
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t.source}
          </a>
        )}
      </span>
    </footer>
  );
}
