import type { Rule } from "./types";

/**
 * A run of text, tagged with the rule that acted on it. `ruleId: null` marks
 * untouched text. A piece with an empty `text` on the output side is a deletion:
 * something was there, and the UI still has a spot to point at.
 */
export type Piece = { text: string; ruleId: string | null };

export type AnonymizeResult = {
  output: string;
  /** The source text, cut at every match, so the UI can highlight what was found. */
  sourcePieces: Piece[];
  /** The same cuts on the output side, so the UI can highlight what was written. */
  outputPieces: Piece[];
  /** Number of occurrences actually replaced, keyed by rule id. */
  counts: Record<string, number>;
  total: number;
};

export const EMPTY_RESULT: AnonymizeResult = {
  output: "",
  sourcePieces: [],
  outputPieces: [],
  counts: {},
  total: 0,
};

function untouched(text: string): Piece[] {
  return text.length > 0 ? [{ text, ruleId: null }] : [];
}

type Candidate = {
  start: number;
  length: number;
  /** Position of the rule in the user's list; used to break ties. */
  order: number;
  rule: Rule;
};

/**
 * Lowercases while guaranteeing that every character keeps its original length,
 * so offsets in the lowered copy still address the source text. A handful of
 * code points grow when lowercased (U+0130 "İ" becomes two code units); those
 * are left untouched rather than shifting every index that follows them.
 */
function foldCase(text: string): string {
  let out = "";
  for (const char of text) {
    const lower = char.toLowerCase();
    out += lower.length === char.length ? lower : char;
  }
  return out;
}

/**
 * Applies every rule in a single pass over the source text.
 *
 * A naive `for (rule of rules) text = text.replaceAll(...)` re-scans text that
 * previous rules already produced, so `Alice → Bob` followed by `Bob → Carol`
 * would silently turn Alice into Carol. Here each rule only ever matches the
 * original text, and overlapping matches are settled once: leftmost first, then
 * longest, then by rule order.
 */
export function anonymize(text: string, rules: Rule[]): AnonymizeResult {
  const counts: Record<string, number> = {};
  const active: Rule[] = [];
  for (const rule of rules) {
    counts[rule.id] = 0;
    if (rule.find.length > 0) active.push(rule);
  }
  const inert = (): AnonymizeResult => ({
    output: text,
    sourcePieces: untouched(text),
    outputPieces: untouched(text),
    counts,
    total: 0,
  });
  if (text.length === 0 || active.length === 0) return inert();

  const needsFold = active.some((rule) => !rule.caseSensitive);
  const folded = needsFold ? foldCase(text) : text;

  const candidates: Candidate[] = [];
  active.forEach((rule, order) => {
    const haystack = rule.caseSensitive ? text : folded;
    const needle = rule.caseSensitive ? rule.find : foldCase(rule.find);
    let from = 0;
    for (;;) {
      const start = haystack.indexOf(needle, from);
      if (start === -1) break;
      candidates.push({ start, length: needle.length, order, rule });
      // Step by one so overlapping occurrences stay in the running; the
      // conflict resolution below decides which ones survive.
      from = start + 1;
    }
  });
  if (candidates.length === 0) return inert();

  candidates.sort(
    (a, b) => a.start - b.start || b.length - a.length || a.order - b.order,
  );

  const sourcePieces: Piece[] = [];
  const outputPieces: Piece[] = [];
  let cursor = 0;
  let total = 0;
  for (const candidate of candidates) {
    if (candidate.start < cursor) continue; // already covered by a previous match
    if (candidate.start > cursor) {
      const between = text.slice(cursor, candidate.start);
      sourcePieces.push({ text: between, ruleId: null });
      outputPieces.push({ text: between, ruleId: null });
    }
    const end = candidate.start + candidate.length;
    sourcePieces.push({ text: text.slice(candidate.start, end), ruleId: candidate.rule.id });
    outputPieces.push({ text: candidate.rule.replace, ruleId: candidate.rule.id });
    cursor = end;
    counts[candidate.rule.id] += 1;
    total += 1;
  }
  if (cursor < text.length) {
    const tail = text.slice(cursor);
    sourcePieces.push({ text: tail, ruleId: null });
    outputPieces.push({ text: tail, ruleId: null });
  }

  return {
    output: outputPieces.map((piece) => piece.text).join(""),
    sourcePieces,
    outputPieces,
    counts,
    total,
  };
}
