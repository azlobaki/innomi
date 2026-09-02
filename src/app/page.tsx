"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RulesPanel from "@/components/RulesPanel";
import WorkArea from "@/components/WorkArea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { EMPTY_RESULT, anonymize, type AnonymizeResult } from "@/lib/anonymize";
import { emptyRule, newId, parseTemplates } from "@/lib/types";
import type { Rule, Template } from "@/lib/types";

/** The only key Innomi ever writes. It holds templates — never any text. */
const STORAGE_KEY = "innomi.templates.v1";

/**
 * AGPL section 13: a copy offered to users over a network has to offer them the
 * source it runs on. Point this at the public repository before deploying — the
 * header link appears as soon as it is filled in.
 */
const SOURCE_URL: string = "";

type Applied = { result: AnonymizeResult; input: string; rules: Rule[] };

export default function Home() {
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
      !window.confirm(`Replace the template “${existing.name}”?`)
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
    if (!window.confirm(`Delete the template “${template.name}”?`)) return;
    setTemplates((previous) => previous.filter((item) => item.id !== template.id));
    setSelectedTemplateId("");
  }

  function handleRuleChange(id: string, patch: Partial<Rule>) {
    setRules((previous) =>
      previous.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  }

  function handleClearRules() {
    const hasContent = rules.some((rule) => rule.find || rule.replace);
    if (hasContent && !window.confirm("Clear all current rules?")) return;
    setRules([emptyRule()]);
    setSelectedTemplateId("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
            Innomi
          </h1>
          <p className="text-sm text-zinc-500">
            Template-based text anonymization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
            100% local — no text is sent anywhere or stored
          </span>
          {SOURCE_URL && (
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-500 underline underline-offset-2 transition hover:text-zinc-300"
            >
              Source
            </a>
          )}
        </div>
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
          onAddRule={() => setRules((previous) => [...previous, emptyRule()])}
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
    </div>
  );
}
