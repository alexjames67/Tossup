import { NEG_PENALTY, TIER_VALUES, applyNegs } from "@/lib/scoring";
import { CLUE_COUNT } from "@/lib/types";

interface TierMeterProps {
  /** The clue index currently in focus (0 hardest .. 4 giveaway). */
  activeIndex: number;
  /** Accumulated negs, used to show the live point value on the active tier. */
  negs: number;
  /** Visual mode: during play, on a win, or on a loss. */
  mode: "playing" | "won" | "lost";
}

/**
 * The pyramid. Apex (clue 1) is hardest and worth the most; the base
 * (giveaway) is worth the least. The active tier is highlighted and steps
 * downward as clues are revealed.
 */
export function TierMeter({ activeIndex, negs, mode }: TierMeterProps) {
  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={
        mode === "playing"
          ? `Scoring pyramid. Currently worth ${applyNegs(
              TIER_VALUES[activeIndex],
              negs,
            )} points on clue ${activeIndex + 1} of ${CLUE_COUNT}.`
          : `Scoring pyramid, round over.`
      }
    >
      {TIER_VALUES.map((value, i) => {
        const widthPct = 44 + i * 14; // apex narrow → base wide
        const isActive = i === activeIndex && mode === "playing";
        const isWin = i === activeIndex && mode === "won";
        const isPast = i < activeIndex;
        const live = applyNegs(value, negs);

        let tone = "border-border bg-bg-inset text-fg-faint"; // future / inactive
        if (isPast) tone = "border-border bg-bg-raised text-fg-faint";
        if (isActive)
          tone =
            "border-accent bg-accent/15 text-accent-strong shadow-[0_0_0_1px_var(--accent)]";
        if (isWin) tone = "border-correct bg-correct/20 text-correct-strong";

        return (
          <div
            key={i}
            style={{ width: `${widthPct}%` }}
            className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-sm font-mono tabular-nums transition-colors ${tone}`}
            aria-hidden="true"
          >
            <span className="opacity-70">clue {i + 1}</span>
            <span className="font-semibold">
              {isActive && negs > 0 ? (
                <>
                  <span className="line-through opacity-50">{value}</span>{" "}
                  {live}
                </>
              ) : (
                value
              )}
            </span>
          </div>
        );
      })}
      {mode === "playing" && negs > 0 && (
        <p className="mt-1 text-xs text-neg" aria-hidden="true">
          −{negs * NEG_PENALTY} from {negs} neg{negs > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
