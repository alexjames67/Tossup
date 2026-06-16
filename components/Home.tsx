"use client";

import { PyramidMark } from "./PyramidMark";
import { winRate } from "@/lib/storage";
import type { Stats } from "@/lib/types";

interface HomeProps {
  onPlayDaily: () => void;
  onPlayEndless: () => void;
  onHelp: () => void;
  onStats: () => void;
  stats: Stats;
}

export function Home({
  onPlayDaily,
  onPlayEndless,
  onHelp,
  onStats,
  stats,
}: HomeProps) {
  const hasHistory = stats.gamesPlayed > 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <PyramidMark size={56} />
        <h1 className="font-display text-4xl font-bold tracking-tight text-fg">
          Pyramidal Buzz
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-fg-muted">
          A daily pyramid of clues about one answer. Buzz early for more points,
          or wait for an easier clue.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onPlayDaily}
          className="focus-ring group flex flex-col items-start gap-1 rounded-xl bg-accent px-5 py-4 text-left text-bg transition hover:bg-accent-strong"
        >
          <span className="text-lg font-bold">Daily Puzzle</span>
          <span className="text-sm font-medium opacity-80">
            One tossup for everyone. Builds your streak.
          </span>
        </button>

        <button
          type="button"
          onClick={onPlayEndless}
          className="focus-ring group flex flex-col items-start gap-1 rounded-xl border border-border-strong bg-bg-raised px-5 py-4 text-left transition hover:border-fg-faint"
        >
          <span className="text-lg font-bold text-fg">Endless Mode</span>
          <span className="text-sm text-fg-muted">
            Unlimited puzzles, back to back — for learning. Doesn&apos;t affect
            your streak.
          </span>
        </button>
      </div>

      {hasHistory && (
        <p className="text-sm text-fg-faint">
          {stats.gamesPlayed} played · {Math.round(winRate(stats) * 100)}% won ·
          streak {stats.currentStreak}
        </p>
      )}

      <div className="flex items-center gap-5 text-sm">
        <button
          type="button"
          onClick={onHelp}
          className="focus-ring rounded text-fg-muted underline-offset-4 transition hover:text-fg hover:underline"
        >
          How to play
        </button>
        <button
          type="button"
          onClick={onStats}
          className="focus-ring rounded text-fg-muted underline-offset-4 transition hover:text-fg hover:underline"
        >
          Statistics
        </button>
      </div>
    </div>
  );
}
