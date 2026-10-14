// Shared class lists. Components never pick colours or fonts directly — only
// the tokens defined in globals.css.

/** Small caption above a value or a section. */
export const LABEL =
  "text-[11px] font-medium uppercase tracking-[0.08em] text-muted";

const BUTTON_BASE =
  "border px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-35";

export const BUTTON = `${BUTTON_BASE} border-hairline bg-field text-ink hover:border-ink enabled:hover:bg-ink enabled:hover:text-paper`;

export const BUTTON_PRIMARY = `${BUTTON_BASE} border-ink bg-ink text-paper enabled:hover:bg-paper enabled:hover:text-ink`;

/** A destructive action that only shows its colour when hovered. */
export const BUTTON_DANGER = `${BUTTON_BASE} border-hairline bg-field text-muted enabled:hover:border-cut enabled:hover:bg-cut enabled:hover:text-paper`;

export const FIELD =
  "min-w-0 flex-1 border border-hairline bg-field px-2 py-1 text-sm text-ink placeholder:text-faint focus:border-ink focus:outline-none";

/** The top bar, shared by every page. */
export const HEADER =
  "flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule bg-paper px-4 py-2.5";

export const WORDMARK = "text-base font-semibold tracking-tight text-ink";
