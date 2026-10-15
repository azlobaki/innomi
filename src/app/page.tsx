"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import LocaleSwitch from "@/components/LocaleSwitch";
import RulesPanel from "@/components/RulesPanel";
import { HEADER, LABEL, WORDMARK } from "@/components/ui";
import WorkArea from "@/components/WorkArea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSettings } from "@/hooks/useSettings";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { messages } from "@/i18n/messages";
import { EMPTY_RESULT, anonymize, type AnonymizeResult } from "@/lib/anonymize";
import { STORAGE_KEY, emptyRule, newId, parseTemplates } from "@/lib/types";
import type { Rule, Template } from "@/lib/types";

type Applied = { result: AnonymizeResult; input: string; rules: Rule[] };

export default function Home() {
  const { locale, setLocale } = useSettings();
  // This component owns the provider, so it reads its own strings directly.
  const t = messages[locale].page;
  useEffect(() => {
    document.title = t.title;
  }, [t.title]);
  const [templates, setTemplates] = useLocalStorage<Template[]>(
    STORAGE_KEY,
    [],
    parseTemplates,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");

  const [rules, setRules] = useState<Rule[]>(() => [emptyRule(), emptyRule()]);
  const [input, setInput] = useState("");
  const [live, setLive] = useState(false);
  const [applied, setApplied] = useState<Applied | null>(null);

  const liveResult = useMemo(
    () => (live ? anonymize(input, rules) : null),
    [live, input, rules],
  );
  const result = live ? (liveResult ?? EMPTY_RESULT) : (applied?.result ?? EMPTY_RESULT);
  // Only worth flagging once there is actually something to anonymise.
  const stale =
    input.length > 0 &&
    (!applied || applied.input !== input || applied.rules !== rules);
  // Source highlights are offsets into the text the result was computed from.
  // Once that text has moved on, they would point at the wrong words.
  const sourcePieces = live || !stale ? result.sourcePieces : null;

  const rulesById = useMemo(
    () => Object.fromEntries(rules.map((rule) => [rule.id, rule])),
    [rules],
  );

  const handleApply = useCallback(() => {
    setApplied({ result: anonymize(input, rules), input, rules });
  }, [input, rules]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleApply();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleApply]);

  function handleLiveChange(next: boolean) {
    // Leaving live mode keeps the result already on screen instead of blanking it.
    if (!next && liveResult) setApplied({ result: liveResult, input, rules });
    setLive(next);
  }

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name, "en")),
    [templates],
  );

  function handleSelectTemplate(id: string) {
    setSelectedTemplateId(id);
    if (!id) return;
    const template = templates.find((candidate) => candidate.id === id);
    if (!template) return;
    // Copy the rules out of the stored template so edits stay local until saved.
    setRules(
      template.rules.length
        ? template.rules.map((rule) => ({ ...rule }))
        : [emptyRule()],
    );
    setTemplateName(template.name);
  }

  function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) return;
    const saved = rules
      .filter((rule) => rule.find.length > 0)
      .map((rule) => ({ ...rule }));
    const existing = templates.find(
      (template) => template.name.toLowerCase() === name.toLowerCase(),
    );
    if (
      existing &&
      !window.confirm(t.confirmReplace(existing.name))
    ) {
      return;
    }
    const template: Template = {
      id: existing?.id ?? newId(),
      name,
      rules: saved,
      updatedAt: Date.now(),
    };
    setTemplates((previous) =>
      existing
        ? previous.map((item) => (item.id === existing.id ? template : item))
        : [...previous, template],
    );
    setSelectedTemplateId(template.id);
  }

  function handleDeleteTemplate() {
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) return;
    if (!window.confirm(t.confirmDelete(template.name))) return;
    setTemplates((previous) => previous.filter((item) => item.id !== template.id));
    setSelectedTemplateId("");
  }

  function handleRuleChange(id: string, patch: Partial<Rule>) {
    setRules((previous) =>
      previous.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  }

  function handleAddRule(): string {
    const rule = emptyRule();
    setRules((previous) => [...previous, rule]);
    return rule.id;
  }

  function handleClearRules() {
    const hasContent = rules.some((rule) => rule.find || rule.replace);
    if (hasContent && !window.confirm(t.confirmClear)) return;
    setRules([emptyRule()]);
    setSelectedTemplateId("");
  }

  return (
    <LocaleProvider locale={locale}>
    <div data-localised className="contents">
    {/* On wide screens the app is exactly one window tall: the rules and both
        texts scroll inside their own panels, so the controls never move away. */}
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:min-h-0">
      <header className={HEADER}>
        <h1 className={WORDMARK}>Innomi</h1>
        <p className="text-sm text-muted">{t.tagline}</p>
        <p className={`${LABEL} sm:ml-auto`}>
          {t.claim}
        </p>
        <LocaleSwitch locale={locale} onChange={setLocale} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <RulesPanel
          rules={rules}
          counts={result.counts}
          templates={sortedTemplates}
          selectedTemplateId={selectedTemplateId}
          templateName={templateName}
          onSelectTemplate={handleSelectTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onSaveTemplate={handleSaveTemplate}
          onTemplateNameChange={setTemplateName}
          onRuleChange={handleRuleChange}
          onAddRule={handleAddRule}
          onRemoveRule={(id) =>
            setRules((previous) => previous.filter((rule) => rule.id !== id))
          }
          onClearRules={handleClearRules}
        />
        <WorkArea
          input={input}
          output={result.output}
          sourcePieces={sourcePieces}
          outputPieces={result.outputPieces}
          rulesById={rulesById}
          total={result.total}
          live={live}
          stale={stale}
          onInputChange={setInput}
          onLiveChange={handleLiveChange}
          onApply={handleApply}
        />
      </div>

      <Footer />
    </div>
    </div>
    </LocaleProvider>
  );
}
