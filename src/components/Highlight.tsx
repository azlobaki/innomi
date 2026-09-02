import type { Piece } from "@/lib/anonymize";
import type { Rule } from "@/lib/types";

/**
 * Past this many pieces, every highlight would be its own DOM node and typing
 * would crawl. Big pastes fall back to plain text; the panel says so.
 */
export const MAX_PIECES = 4000;

/** Shared by the textarea and its highlight backdrop — they must wrap identically. */
export const TEXT_LAYER_CLASS =
  "overflow-y-scroll whitespace-pre-wrap break-words p-3 font-mono text-sm leading-relaxed";

function describe(rule: Rule | undefined): string | undefined {
  if (!rule) return undefined;
  return rule.replace
    ? `“${rule.find}” → “${rule.replace}”`
    : `“${rule.find}” → deleted`;
}

type Props = {
  pieces: Piece[];
  variant: "source" | "output";
  rulesById: Record<string, Rule>;
};

export default function Highlight({ pieces, variant, rulesById }: Props) {
  return (
    <>
      {pieces.map((piece, index) => {
        if (piece.ruleId === null) return piece.text;
        const title = describe(rulesById[piece.ruleId]);
        // A deletion has no text of its own; show where the cut happened.
        if (piece.text.length === 0) {
          return (
            <span
              key={index}
              title={title}
              className="mx-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] rounded-full bg-rose-400/80"
            />
          );
        }
        return (
          <mark
            key={index}
            title={title}
            className={
              variant === "source"
                ? "rounded-[3px] bg-amber-400/25 text-transparent"
                : "rounded-[3px] bg-emerald-500/20 text-emerald-200"
            }
          >
            {piece.text}
          </mark>
        );
      })}
    </>
  );
}
