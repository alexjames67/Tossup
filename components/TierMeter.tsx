import { TIER_VALUES } from "@/lib/scoring";
import { CLUE_COUNT } from "@/lib/types";

interface TierMeterProps {
  /** The clue index currently in focus (0 hardest .. 4 giveaway). */
  activeIndex: number;
  /** Visual mode: during play, on a win, or on a loss. */
  mode: "playing" | "won" | "lost";
}

/**
 * The scoring pyramid: five centered bars widening toward the base, each
 * labelled with its point value. The active tier is highlighted; tiers already
 * passed are dimmed. Purely a visual indicator — live point math (after negs)
 * is shown beneath it by the play screen.
 */
export function TierMeter({ activeIndex, mode }: TierMeterProps) {
  return (
    <div
      className="mx-auto flex w-full max-w-[280px] flex-col items-center gap-1.5"
      role="img"
      aria-label={`Scoring pyramid — clue ${activeIndex + 1} of ${CLUE_COUNT}, worth ${TIER_VALUES[activeIndex]} points.`}
    >
      {TIER_VALUES.map((value, i) => {
        const width = 40 + i * 15; // 40 → 100%, a clean triangle
        const isActive = i === activeIndex && mode === "playing";
        const isWin = i === activeIndex && mode === "won";
        const isPast = i < activeIndex;

        let tone = "border border-border bg-transparent text-fg-faint";
        if (isPast) tone = "border border-border bg-bg-inset text-fg-faint";
        if (isActive) tone = "bg-accent text-bg font-semibold";
        if (isWin) tone = "bg-correct text-bg font-semibold";

        return (
          <div
            key={i}
            style={{ width: `${width}%` }}
            className={`flex justify-center rounded-md py-1 font-mono text-xs tabular-nums transition-colors ${tone}`}
            aria-hidden="true"
          >
            {value}
          </div>
        );
      })}
    </div>
  );
}
