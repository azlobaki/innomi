"use client";

import { useMemo } from "react";
import type { Rule, Template } from "@/lib/types";
import { ArrowRightIcon, TrashIcon } from "./icons";

type Props = {
  rules: Rule[];
  counts: Record<string, number>;
  templates: Template[];
  selectedTemplateId: string;
  templateName: string;
  onSelectTemplate: (id: string) => void;
  onDeleteTemplate: () => void;
  onSaveTemplate: () => void;
  onTemplateNameChange: (name: string) => void;
  onRuleChange: (id: string, patch: Partial<Rule>) => void;
  onAddRule: () => void;
  onRemoveRule: (id: string) => void;
  onClearRules: () => void;
};

const inputClass =
  "min-w-0 flex-1 rounded-md border border-zinc-700/70 bg-zinc-950/60 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/40";

export default function RulesPanel({
  rules,
  counts,
  templates,
  selectedTemplateId,
  templateName,
  onSelectTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  onTemplateNameChange,
  onRuleChange,
  onAddRule,
  onRemoveRule,
  onClearRules,
}: Props) {
  const trimmedName = templateName.trim();
  const overwrites = useMemo(
    () =>
      templates.some(
        (template) => template.name.toLowerCase() === trimmedName.toLowerCase(),
      ),
    [templates, trimmedName],
  );
  const activeRules = rules.filter((rule) => rule.find.length > 0).length;

  return (
    <aside className="flex w-full shrink-0 flex-col border-zinc-800 bg-zinc-900/40 lg:w-[30%] lg:min-w-[320px] lg:max-w-[440px] lg:border-r">
      <section className="border-b border-zinc-800 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Templates
        </h2>
        <div className="mt-2.5 flex gap-1.5">
          <select
            aria-label="Load a template"
            className={`${inputClass} cursor-pointer`}
            value={selectedTemplateId}
            onChange={(event) => onSelectTemplate(event.target.value)}
          >
            <option value="">
              {templates.length ? "Load a template…" : "No saved templates"}
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.rules.length})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onDeleteTemplate}
            disabled={!selectedTemplateId}
            title="Delete the selected template"
            className="rounded-md border border-zinc-700/70 px-2 text-zinc-400 transition hover:border-red-500/60 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-zinc-700/70 disabled:hover:text-zinc-400"
          >
            <TrashIcon className="size-4" />
            <span className="sr-only">Delete template</span>
          </button>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <input
            className={inputClass}
            placeholder="Template name (e.g. HR data)"
            value={templateName}
            onChange={(event) => onTemplateNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && trimmedName) onSaveTemplate();
            }}
          />
          <button
            type="button"
            onClick={onSaveTemplate}
            disabled={!trimmedName}
            className="shrink-0 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-emerald-500/10"
          >
            {overwrites ? "Update" : "Save"}
          </button>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Rules{" "}
            <span className="font-normal normal-case tracking-normal text-zinc-600">
              · {activeRules} active
            </span>
          </h2>
          <button
            type="button"
            onClick={onClearRules}
            disabled={rules.length === 0}
            className="text-xs text-zinc-500 transition hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-zinc-500"
          >
            Clear all
          </button>
        </div>

        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 pb-2 lg:max-h-none">
          {rules.map((rule) => {
            const hits = counts[rule.id] ?? 0;
            return (
              <li
                key={rule.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-2"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    className={inputClass}
                    placeholder="Text to find"
                    aria-label="Text to find"
                    spellCheck={false}
                    value={rule.find}
                    onChange={(event) =>
                      onRuleChange(rule.id, { find: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    aria-pressed={rule.caseSensitive}
                    title={
                      rule.caseSensitive
                        ? "Case-sensitive — click to ignore case"
                        : "Case-insensitive — click to match case"
                    }
                    onClick={() =>
                      onRuleChange(rule.id, { caseSensitive: !rule.caseSensitive })
                    }
                    className={`h-8 w-8 shrink-0 rounded-md border text-xs font-semibold transition ${
                      rule.caseSensitive
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-zinc-700/70 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Aa
                    <span className="sr-only">Match case</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveRule(rule.id)}
                    title="Delete rule"
                    className="h-8 w-8 shrink-0 rounded-md border border-zinc-700/70 p-1.5 text-zinc-500 transition hover:border-red-500/60 hover:text-red-400"
                  >
                    <TrashIcon className="size-full" />
                    <span className="sr-only">Delete rule</span>
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <ArrowRightIcon className="size-4 shrink-0 text-zinc-600" />
                  <input
                    className={inputClass}
                    placeholder="Replacement (empty deletes the match)"
                    aria-label="Replacement text"
                    spellCheck={false}
                    value={rule.replace}
                    onChange={(event) =>
                      onRuleChange(rule.id, { replace: event.target.value })
                    }
                  />
                  <span
                    className={`w-9 shrink-0 text-right text-xs tabular-nums ${
                      hits > 0 ? "text-emerald-400" : "text-zinc-700"
                    }`}
                    title={`${hits} occurrence${hits === 1 ? "" : "s"} replaced`}
                  >
                    {rule.find ? `×${hits}` : ""}
                  </span>
                </div>
              </li>
            );
          })}
          {rules.length === 0 && (
            <li className="rounded-lg border border-dashed border-zinc-800 px-3 py-6 text-center text-sm text-zinc-600">
              No rules yet. Add one, or load a template.
            </li>
          )}
        </ul>

        <div className="border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={onAddRule}
            className="w-full rounded-md border border-zinc-700/70 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/60"
          >
            Add a rule
          </button>
        </div>
      </section>
    </aside>
  );
}
