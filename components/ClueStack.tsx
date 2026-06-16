import { CLUE_COUNT } from "@/lib/types";

interface ClueStackProps {
  /** Clues revealed so far, hardest (index 0) → most recent. */
  clues: string[];
}

/**
 * The revealed clues, stacked oldest → newest with the newest emphasized.
 * Each clue is numbered against the full pyramid height.
 */
export function ClueStack({ clues }: ClueStackProps) {
  const newestIndex = clues.length - 1;

  return (
    <ol className="flex flex-col gap-3">
      {clues.map((clue, i) => {
        const isNewest = i === newestIndex;
        return (
          <li
            // Keying on clue index keeps older items stable; the newest
            // re-mounts only when it first appears, so it animates once.
            key={i}
            className={
              isNewest
                ? "animate-clue-in rounded-xl border border-border-strong bg-bg-raised p-4 shadow-lg sm:p-5"
                : "rounded-xl border border-border bg-bg-inset/60 p-4"
            }
          >
            <div className="flex gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                  isNewest ? "bg-accent text-bg" : "bg-bg-raised text-fg-faint"
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <p
                className={
                  isNewest
                    ? "text-base leading-relaxed text-fg sm:text-lg"
                    : "text-sm leading-relaxed text-fg-muted"
                }
              >
                <span className="sr-only">
                  Clue {i + 1} of {CLUE_COUNT}:{" "}
                </span>
                {clue}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
