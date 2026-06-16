"use client";

import { Modal } from "./Modal";
import { NEG_PENALTY, TIER_VALUES } from "@/lib/scoring";

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

export function HowToPlay({ open, onClose }: HowToPlayProps) {
  return (
    <Modal open={open} onClose={onClose} title="How to play">
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-fg-muted">
        <p>
          Every day, one tossup: five clues about a single answer, ordered{" "}
          <strong className="text-fg">hardest first</strong> down to a giveaway.
        </p>
        <p>
          Read the clue and <strong className="text-fg">buzz</strong> when you
          think you know it — or reveal the next, easier clue. The earlier you
          buzz correctly, the more you score:
        </p>
        <div className="flex justify-between gap-1 font-mono text-xs tabular-nums">
          {TIER_VALUES.map((v, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center rounded bg-bg-inset py-2"
            >
              <span className="text-fg-faint">clue {i + 1}</span>
              <span className="font-bold text-accent-strong">{v}</span>
            </div>
          ))}
        </div>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            A wrong buzz is a <strong className="text-neg">neg</strong>: −
            {NEG_PENALTY} points, and the next clue is revealed automatically.
          </li>
          <li>
            If your answer is on the right track but too vague, you&apos;ll be{" "}
            <strong className="text-accent-strong">prompted</strong> to be more
            specific — no penalty.
          </li>
          <li>It&apos;s the same puzzle for everyone, once per day.</li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring mt-1 rounded-lg bg-accent px-5 py-2.5 font-semibold text-on-accent transition hover:bg-accent-strong"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
