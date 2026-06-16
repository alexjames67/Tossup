import { CLUE_COUNT } from "@/lib/types";

interface ClueStackProps {
  /** Clues revealed so far, hardest (index 0) → most recent. */
  clues: string[];
}

/**
 * The revealed clues as an editorial list. Older clues are quiet, indexed
 * reference lines; the newest is set in a focused card with an accent rule.
 */
export function ClueStack({ clues }: ClueStackProps) {
  const newestIndex = clues.length - 1;

  return (
    <ol className="flex flex-col gap-3">
      {clues.map((clue, i) => {
        const isNewest = i === newestIndex;
        const num = String(i + 1).padStart(2, "0");

        if (isNewest) {
          return (
            <li
              key={i}
              className="animate-clue-in rounded-xl border border-border-strong border-l-2 border-l-accent bg-bg-raised px-5 py-4"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-mono text-xs tabular-nums text-accent-strong">
                  {num}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-fg-faint">
                  Clue {i + 1} of {CLUE_COUNT}
                </span>
              </div>
              <p className="text-lg leading-relaxed text-fg">{clue}</p>
            </li>
          );
        }

        return (
          <li key={i} className="flex gap-3 px-1">
            <span className="pt-0.5 font-mono text-xs tabular-nums text-fg-faint">
              {num}
            </span>
            <p className="text-sm leading-relaxed text-fg-faint">{clue}</p>
          </li>
        );
      })}
    </ol>
  );
}
