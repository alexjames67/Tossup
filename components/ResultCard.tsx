"use client";

import { useEffect, useState } from "react";
import { ShareButton } from "./ShareButton";
import { buildPath } from "@/lib/share";
import { msUntilNextUtcMidnight } from "@/lib/daily";
import type { ClueIndex, Puzzle } from "@/lib/types";

interface ResultCardProps {
  puzzle: Puzzle;
  won: boolean;
  buzzedOn: ClueIndex | null;
  negs: number;
  score: number;
  onShowStats: () => void;
}

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function Countdown() {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(msUntilNextUtcMidnight());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wide text-fg-faint">
        Next puzzle in
      </p>
      <p
        className="font-mono text-2xl font-bold tabular-nums text-fg"
        aria-live="off"
      >
        {ms === null ? "--:--:--" : format(ms)}
      </p>
    </div>
  );
}

export function ResultCard({
  puzzle,
  won,
  buzzedOn,
  negs,
  score,
  onShowStats,
}: ResultCardProps) {
  const path = buildPath({ won, buzzedOn });

  return (
    <section
      className="animate-pop-in flex flex-col gap-5 rounded-2xl border border-border-strong bg-bg-raised p-6 text-center shadow-xl"
      aria-live="polite"
    >
      <div>
        <p
          className={`text-sm font-semibold uppercase tracking-wide ${
            won ? "text-correct-strong" : "text-fg-muted"
          }`}
        >
          {won ? "Correct" : "Out of clues"}
        </p>
        <h2 className="mt-1 font-display text-3xl font-bold text-fg">
          {puzzle.answer}
        </h2>
        <p className="mt-1 text-sm text-fg-faint">{puzzle.category}</p>
      </div>

      <div className="text-5xl leading-none tracking-widest" aria-hidden="true">
        {path}
      </div>

      <div className="flex items-center justify-center gap-6">
        <div>
          <p className="font-mono text-4xl font-bold tabular-nums text-accent-strong">
            {score}
          </p>
          <p className="text-xs uppercase tracking-wide text-fg-faint">
            points
          </p>
        </div>
        <div className="h-10 w-px bg-border" aria-hidden="true" />
        <div className="text-left text-sm text-fg-muted">
          {won && buzzedOn !== null ? (
            <p>Buzzed on clue {buzzedOn + 1}</p>
          ) : (
            <p>Missed the answer</p>
          )}
          <p>
            {negs} neg{negs === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ShareButton
        won={won}
        buzzedOn={buzzedOn}
        negs={negs}
        score={score}
        puzzleId={puzzle.id}
      />

      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <button
          type="button"
          onClick={onShowStats}
          className="focus-ring rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-fg-muted transition hover:text-fg"
        >
          View stats
        </button>
        <Countdown />
      </div>
    </section>
  );
}
