"use client";

import { Modal } from "./Modal";
import { averageBuzzPosition, winRate } from "@/lib/storage";
import { CLUE_COUNT, type Stats } from "@/lib/types";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  stats: Stats;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-bg-inset px-2 py-3">
      <span className="font-mono text-2xl font-bold tabular-nums text-fg">
        {value}
      </span>
      <span className="mt-1 text-center text-[11px] uppercase tracking-wide text-fg-faint">
        {label}
      </span>
    </div>
  );
}

export function StatsModal({ open, onClose, stats }: StatsModalProps) {
  const avg = averageBuzzPosition(stats);
  const maxBar = Math.max(1, ...stats.tierDistribution);

  return (
    <Modal open={open} onClose={onClose} title="Statistics">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Played" value={String(stats.gamesPlayed)} />
        <Stat label="Win %" value={`${Math.round(winRate(stats) * 100)}`} />
        <Stat label="Streak" value={String(stats.currentStreak)} />
        <Stat label="Max" value={String(stats.maxStreak)} />
      </div>

      <p className="mt-5 text-center text-sm text-fg-muted">
        Average buzz position:{" "}
        <span className="font-semibold text-fg">
          {avg === null ? "—" : `clue ${(avg + 1).toFixed(1)}`}
        </span>
      </p>

      <h3 className="mt-6 mb-2 text-sm font-semibold text-fg-muted">
        Where you buzz correctly
      </h3>
      <div className="flex flex-col gap-1.5">
        {stats.tierDistribution.map((count, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-xs text-fg-faint">
              clue {i + 1}
            </span>
            <div className="h-5 flex-1 rounded bg-bg-inset">
              <div
                className="flex h-5 min-w-6 items-center justify-end rounded bg-correct px-2 text-[11px] font-semibold text-on-accent transition-all"
                style={{
                  width: `${Math.max((count / maxBar) * 100, count > 0 ? 12 : 0)}%`,
                }}
              >
                {count > 0 ? count : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
      {stats.gamesPlayed === 0 && (
        <p className="mt-4 text-center text-xs text-fg-faint">
          Play your first puzzle to start building stats. {CLUE_COUNT} clues,
          one answer.
        </p>
      )}
    </Modal>
  );
}
