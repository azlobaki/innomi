"use client";

import type { Locale } from "@/lib/i18n/text";
import { useT } from "@/i18n/LocaleContext";

const BUTTON_CLASS =
  "border px-2 py-0.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";

/** French first. */
const ORDER: Locale[] = ["fr", "en"];
const LABELS: Record<Locale, string> = { fr: "FR", en: "EN" };

export default function LocaleSwitch({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  const t = useT();
  return (
    <div role="group" aria-label={t.header.language} className="flex gap-1">
      {ORDER.map((code) => (
        <button
          key={code}
          id={`locale-${code}`}
          type="button"
          lang={code}
          aria-pressed={locale === code}
          onClick={() => onChange(code)}
          className={`${BUTTON_CLASS} ${
            locale === code
              ? "border-ink bg-ink text-paper"
              : "border-hairline bg-field text-faint hover:border-ink hover:text-ink"
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
