"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Rule, Template } from "@/lib/types";
import { BUTTON, BUTTON_DANGER, FIELD, LABEL } from "./ui";

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
  /** Returns the new rule's id so it can be focused once rendered. */
  onAddRule: () => string;
  onRemoveRule: (id: string) => void;
  onClearRules: () => void;
};

const ICON_BUTTON =
  "h-7 w-7 shrink-0 border text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";

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
  const listRef = useRef<HTMLUListElement>(null);
  // The rule to focus once it shows up in the list.
  const focusRef = useRef<{ id: string; field: "find" | "replace" } | null>(null);
  const trimmedName = templateName.trim();
  const overwrites = useMemo(
    () =>
      templates.some(
        (template) => template.name.toLowerCase() === trimmedName.toLowerCase(),
      ),
    [templates, trimmedName],
  );
  const activeRules = rules.filter((rule) => rule.find.length > 0).length;

  function focusInput(target: { id: string; field: "find" | "replace" }) {
    const input = listRef.current?.querySelector<HTMLInputElement>(
      // Ids loaded from storage may hold any character.
      `[data-rule="${CSS.escape(target.id)}"][data-field="${target.field}"]`,
    );
    if (!input) return false;
    input.focus();
    input.scrollIntoView({ block: "nearest" });
    return true;
  }

  useEffect(() => {
    if (focusRef.current && focusInput(focusRef.current)) focusRef.current = null;
  }, [rules]);

  function focusRule(id: string, field: "find" | "replace") {
    if (!focusInput({ id, field })) focusRef.current = { id, field };
  }

  function handleAdd() {
    focusRef.current = { id: onAddRule(), field: "find" };
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-rule bg-panel max-lg:border-b lg:w-[min(34vw,420px)] lg:min-w-[340px] lg:border-r">
      <section className="border-b border-hairline px-4 py-3">
        <h2 className={LABEL}>Templates</h2>
        <div className="mt-2 flex gap-1">
          <select
            aria-label="Load a template"
            className={`${FIELD} cursor-pointer`}
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
            className={BUTTON_DANGER}
          >
            Delete
          </button>
        </div>
        <div className="mt-1 flex gap-1">
          <input
            className={FIELD}
            placeholder="Template name (e.g. HR data)"
            aria-label="Template name"
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
            className={BUTTON}
          >
            {overwrites ? "Update" : "Save"}
          </button>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2">
          <h2 className={LABEL}>
            Rules{" "}
            <span className="normal-case tracking-normal text-faint">
              · {activeRules} active
            </span>
          </h2>
          <button
            type="button"
            onClick={onClearRules}
            disabled={rules.length === 0}
            className={`${BUTTON_DANGER} ml-auto`}
          >
            Clear all
          </button>
          <button
            id="add-rule"
            type="button"
            onClick={handleAdd}
            title="Add a rule (Enter in the last replacement does the same)"
            className={BUTTON}
          >
            + Add rule
          </button>
        </div>

        {/* Bounded on narrow screens too, so a long list never pushes the text away. */}
        <ul
          ref={listRef}
          className="relative max-h-[45dvh] min-h-0 flex-1 overflow-y-auto lg:max-h-none"
        >
          {rules.map((rule, index) => {
            const hits = counts[rule.id] ?? 0;
            const next = rules[index + 1];
            return (
              <li
                key={rule.id}
                className="border-b border-hairline px-4 py-2"
              >
                <div className="flex items-center gap-1">
                  <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-faint">
                    {index + 1}
                  </span>
                  <input
                    className={FIELD}
                    placeholder="Text to find"
                    aria-label="Text to find"
                    spellCheck={false}
                    data-rule={rule.id}
                    data-field="find"
                    value={rule.find}
                    onChange={(event) =>
                      onRuleChange(rule.id, { find: event.target.value })
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      focusRule(rule.id, "replace");
                    }}
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
                    className={`${ICON_BUTTON} ${
                      rule.caseSensitive
                        ? "border-ink bg-ink text-paper"
                        : "border-hairline bg-field text-faint hover:border-ink hover:text-ink"
                    }`}
                  >
                    Aa
                    <span className="sr-only">Match case</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveRule(rule.id)}
                    title="Delete rule"
                    aria-label="Delete rule"
                    className={`${ICON_BUTTON} border-hairline bg-field text-base leading-none text-faint hover:border-cut hover:bg-cut hover:text-paper`}
                  >
                    ×
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span
                    aria-hidden
                    className="w-6 shrink-0 font-mono text-xs text-faint"
                  >
                    →
                  </span>
                  <input
                    className={FIELD}
                    placeholder="Replacement (empty deletes the match)"
                    aria-label="Replacement text"
                    spellCheck={false}
                    data-rule={rule.id}
                    data-field="replace"
                    value={rule.replace}
                    onChange={(event) =>
                      onRuleChange(rule.id, { replace: event.target.value })
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      if (next) focusRule(next.id, "find");
                      else handleAdd();
                    }}
                  />
                  <span
                    className={`w-[3.75rem] shrink-0 text-right font-mono text-xs tabular-nums ${
                      hits > 0 ? "text-ink" : "text-faint"
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
            <li className="px-4 py-6 text-center text-sm text-muted">
              No rules yet. Add one, or load a template.
            </li>
          )}
        </ul>
      </section>
    </aside>
  );
}
