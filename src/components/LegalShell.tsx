"use client";

import Footer from "@/components/Footer";
import LocaleSwitch from "@/components/LocaleSwitch";
import { HEADER, WORDMARK } from "@/components/ui";
import { useSettings } from "@/hooks/useSettings";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { messages } from "@/i18n/messages";

export default function LegalShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useSettings();
  return (
    <LocaleProvider locale={locale}>
      <title>{messages[locale].legal.title}</title>
      <header className={HEADER}>
        {/* A plain link: Next's <Link> fetches the next page's data, which the CSP's connect-src 'none' forbids. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={`${WORDMARK} hover:underline`}>
          Innomi
        </a>
        {/* Hidden until the saved language is known, like the home page: a French visitor would otherwise see English first. */}
        <div data-localised className="ml-auto">
          <LocaleSwitch locale={locale} onChange={setLocale} />
        </div>
      </header>
      {children}
      <div data-localised className="contents">
        <Footer />
      </div>
    </LocaleProvider>
  );
}
