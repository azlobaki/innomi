/** The only key Innomi ever writes. It holds templates — never any text. */
export const STORAGE_KEY = "innomi.templates.v1";

/** A single find → replace directive. An empty `replace` deletes the match. */
export type Rule = {
  id: string;
  find: string;
  replace: string;
  caseSensitive: boolean;
};

/** A named, reusable set of rules. This is the only thing Innomi persists. */
export type Template = {
  id: string;
  name: string;
  rules: Rule[];
  updatedAt: number;
};

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyRule(): Rule {
  return { id: newId(), find: "", replace: "", caseSensitive: false };
}

/**
 * Values coming out of localStorage are untrusted (hand-edited, from an older
 * version, or plain corrupted), so everything is re-checked before use.
 */
export function parseTemplates(value: unknown): Template[] {
  if (!Array.isArray(value)) return [];
  const templates: Template[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const t = raw as Record<string, unknown>;
    if (typeof t.name !== "string" || !t.name.trim()) continue;
    templates.push({
      id: typeof t.id === "string" ? t.id : newId(),
      name: t.name,
      rules: parseRules(t.rules),
      updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : 0,
    });
  }
  return templates;
}

function parseRules(value: unknown): Rule[] {
  if (!Array.isArray(value)) return [];
  const rules: Rule[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.find !== "string") continue;
    rules.push({
      id: typeof r.id === "string" ? r.id : newId(),
      find: r.find,
      replace: typeof r.replace === "string" ? r.replace : "",
      caseSensitive: r.caseSensitive === true,
    });
  }
  return rules;
}
