"use client";

import { useEffect, useRef, useState } from "react";
import Highlight, { MAX_PIECES, TEXT_LAYER_CLASS } from "./Highlight";
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

const panelClass =
  "flex min-h-[9rem] flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40";
const headerClass =
  "flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-zinc-400";
const ghostButtonClass =
  "rounded-md border border-zinc-700/70 px-2 py-1 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30";

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

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <section className={panelClass}>
        <div className={headerClass}>
          <h2 className={labelClass}>Original text</h2>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs tabular-nums text-zinc-600">
              {input.length.toLocaleString("en-US")} chars
            </span>
            <button type="button" onClick={handlePaste} className={ghostButtonClass}>
              Paste
            </button>
            <button
              type="button"
              onClick={() => onInputChange("")}
              disabled={!input}
              className={ghostButtonClass}
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
            className={`${TEXT_LAYER_CLASS} relative h-full w-full resize-none bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none`}
            spellCheck={false}
            placeholder="Paste the text to anonymize here…"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onScroll={(event) => {
              const backdrop = backdropRef.current;
              if (!backdrop) return;
              backdrop.scrollTop = event.currentTarget.scrollTop;
              backdrop.scrollLeft = event.currentTarget.scrollLeft;
            }}
          />
        </div>
      </section>

      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onApply}
          className="relative w-full rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-emerald-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
          disabled={live}
          title={live ? "Live preview is on" : undefined}
        >
          Apply
          {stale && !live && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-950/20 px-2 py-0.5 text-xs font-medium">
              pending changes
            </span>
          )}
        </button>
        <label className="flex w-full shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 sm:w-auto">
          <input
            type="checkbox"
            className="size-4 accent-emerald-500"
            checked={live}
            onChange={(event) => onLiveChange(event.target.checked)}
          />
          Live preview
        </label>
      </div>

      <section className={panelClass}>
        <div className={headerClass}>
          <h2 className={labelClass}>
            Anonymized text{" "}
            {total > 0 && (
              <span className="ml-1 rounded bg-emerald-500/15 px-1.5 py-0.5 font-normal normal-case tracking-normal text-emerald-300">
                {total} replacement{total > 1 ? "s" : ""}
              </span>
            )}
            {highlightingOff && (
              <span className="ml-1 font-normal normal-case tracking-normal text-zinc-600">
                highlighting off (text too large)
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!output}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-30 ${
              copied
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700/70 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div
          ref={outputRef}
          data-testid="output"
          className={`${TEXT_LAYER_CLASS} min-h-0 flex-1 text-zinc-100`}
        >
          {outputPieces.length === 0 ? (
            <span className="text-zinc-600">
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
    </main>
  );
}
