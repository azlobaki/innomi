"use client";

import { useEffect, useRef, useState } from "react";
import Highlight, { MAX_PIECES, TEXT_LAYER_CLASS } from "./Highlight";
import { BUTTON, BUTTON_PRIMARY, LABEL } from "./ui";
import type { Piece } from "@/lib/anonymize";
import type { Rule } from "@/lib/types";

type Props = {
  input: string;
  output: string;
  /** Null while the displayed result no longer matches the text on screen. */
  sourcePieces: Piece[] | null;
  outputPieces: Piece[];
  rulesById: Record<string, Rule>;
  total: number;
  live: boolean;
  stale: boolean;
  onInputChange: (value: string) => void;
  onLiveChange: (live: boolean) => void;
  onApply: () => void;
};

// A fixed height on narrow screens, the remaining window height on wide ones:
// either way a big paste scrolls inside its panel instead of stretching the page.
const panelClass =
  "flex h-[60dvh] min-h-0 min-w-0 flex-col bg-field lg:h-auto";
const headerClass =
  "flex min-h-10 items-center justify-between gap-2 border-b border-hairline bg-paper px-3 py-1.5";

export default function WorkArea({
  input,
  output,
  sourcePieces,
  outputPieces,
  rulesById,
  total,
  live,
  stale,
  onInputChange,
  onLiveChange,
  onApply,
}: Props) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const sourceHighlights =
    sourcePieces && sourcePieces.length <= MAX_PIECES ? sourcePieces : null;
  const outputHighlights =
    outputPieces.length <= MAX_PIECES ? outputPieces : null;
  const highlightingOff =
    (sourcePieces?.length ?? 0) > MAX_PIECES || outputPieces.length > MAX_PIECES;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  // The backdrop only scrolls when told to, so realign it whenever the
  // highlights are redrawn under a textarea that is already scrolled.
  useEffect(() => {
    const backdrop = backdropRef.current;
    const textarea = inputRef.current;
    if (backdrop && textarea) backdrop.scrollTop = textarea.scrollTop;
  }, [sourceHighlights, input]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      // Clipboard API needs a secure context; select the result instead so the
      // user only has to hit Ctrl+C.
      const node = outputRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  async function handlePaste() {
    try {
      onInputChange(await navigator.clipboard.readText());
    } catch {
      // Firefox and Safari refuse programmatic reads: hand over the caret.
      inputRef.current?.focus();
    }
  }

  let status = "";
  if (live) status = "Live preview: recomputed on every keystroke";
  else if (stale) status = "Pending changes — apply to update the result";

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Sticks to the top of the window on narrow screens, where the page scrolls. */}
      <div
        id="actions"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-rule bg-paper px-4 py-2 lg:static"
      >
        <button
          id="apply"
          type="button"
          onClick={onApply}
          disabled={live}
          title={live ? "Live preview is on" : "Ctrl / Cmd + Enter"}
          className={`${BUTTON_PRIMARY} px-5 py-1.5 text-sm`}
        >
          Apply{" "}
          <kbd className="ml-2 font-mono text-[11px] font-normal opacity-60">
            Ctrl+↵
          </kbd>
        </button>
        <button
          id="live"
          type="button"
          role="switch"
          aria-checked={live}
          onClick={() => onLiveChange(!live)}
          className={`${BUTTON} py-1.5 aria-checked:border-ink aria-checked:bg-ink aria-checked:text-paper`}
        >
          Live preview: {live ? "on" : "off"}
        </button>
        <p className="min-w-0 text-xs text-muted" aria-live="polite">
          {status}
        </p>
        <p className="ml-auto font-mono text-xs tabular-nums text-muted">
          {total} replacement{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-px bg-hairline lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <section className={panelClass} aria-labelledby="original-label">
          <div className={headerClass}>
            <h2 id="original-label" className={LABEL}>
              Original text
            </h2>
            <div className="flex items-center gap-1">
              <span className="mr-1 font-mono text-[11px] tabular-nums text-faint">
                {input.length.toLocaleString("en-US")} chars
              </span>
              <button type="button" onClick={handlePaste} className={BUTTON}>
                Paste
              </button>
              <button
                type="button"
                onClick={() => onInputChange("")}
                disabled={!input}
                className={BUTTON}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <div
              ref={backdropRef}
              aria-hidden
              data-testid="backdrop"
              className={`${TEXT_LAYER_CLASS} scrollbar-ghost pointer-events-none absolute inset-0 text-transparent`}
            >
              {sourceHighlights && (
                <Highlight
                  pieces={sourceHighlights}
                  variant="source"
                  rulesById={rulesById}
                />
              )}
              {/* A textarea keeps a line after a trailing newline; a wrapped div
                  does not. Match it so the two layers scroll in step. */}
              {input.endsWith("\n") ? "\n" : null}
            </div>
            <textarea
              ref={inputRef}
              id="input"
              aria-labelledby="original-label"
              className={`${TEXT_LAYER_CLASS} relative block h-full w-full resize-none bg-transparent text-ink placeholder:text-faint focus:outline-none`}
              spellCheck={false}
              placeholder="Paste the text to anonymize here…"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onScroll={(event) => {
                const backdrop = backdropRef.current;
                if (!backdrop) return;
                backdrop.scrollTop = event.currentTarget.scrollTop;
              }}
            />
          </div>
        </section>

        <section className={panelClass} aria-labelledby="output-label">
          <div className={headerClass}>
            <h2 id="output-label" className={LABEL}>
              Anonymized text
              {highlightingOff && (
                <span className="ml-2 normal-case tracking-normal text-faint">
                  highlighting off (text too large)
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output}
              className={`${BUTTON} ${copied ? "border-ink bg-ink text-paper" : ""}`}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div
            ref={outputRef}
            data-testid="output"
            className={`${TEXT_LAYER_CLASS} min-h-0 flex-1 text-ink`}
          >
            {outputPieces.length === 0 ? (
              <span className="text-faint">
                The anonymized text will appear here.
              </span>
            ) : outputHighlights ? (
              <Highlight
                pieces={outputHighlights}
                variant="output"
                rulesById={rulesById}
              />
            ) : (
              output
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
