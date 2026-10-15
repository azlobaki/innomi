"use client";

import { useT } from "@/i18n/LocaleContext";
import type { Piece } from "@/lib/anonymize";
import type { Rule } from "@/lib/types";

/**
 * Past this many pieces, every highlight would be its own DOM node and typing
 * would crawl. Big pastes fall back to plain text; the panel says so.
 */
export const MAX_PIECES = 4000;

/**
 * Shared by the textarea and its highlight backdrop — they must wrap
 * identically. `overflow-wrap: anywhere` lets an unbroken run (a URL, a hash,
 * base64) wrap instead of widening the page.
 */
export const TEXT_LAYER_CLASS =
  "overflow-x-hidden overflow-y-scroll whitespace-pre-wrap [overflow-wrap:anywhere] p-3 font-mono text-sm leading-relaxed";

function describe(rule: Rule | undefined, deleted: string): string | undefined {
  if (!rule) return undefined;
  return rule.replace
    ? `“${rule.find}” → “${rule.replace}”`
    : `“${rule.find}” → ${deleted}`;
}

type Props = {
  pieces: Piece[];
  variant: "source" | "output";
  rulesById: Record<string, Rule>;
};

export default function Highlight({ pieces, variant, rulesById }: Props) {
  const deleted = useT().highlight.deleted;
  return (
    <>
      {pieces.map((piece, index) => {
        if (piece.ruleId === null) return piece.text;
        const title = describe(rulesById[piece.ruleId], deleted);
        // A deletion has no text of its own; show where the cut happened.
        if (piece.text.length === 0) {
          return (
            <span
              key={index}
              title={title}
              className="mx-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] bg-cut"
            />
          );
        }
        return (
          <mark
            key={index}
            title={title}
            className={
              variant === "source"
                ? "bg-mark text-transparent"
                : "bg-redact text-on-redact"
            }
          >
            {piece.text}
          </mark>
        );
      })}
    </>
  );
}
