"use client";

import { useEffect } from "react";
import { AnswerInput } from "./AnswerInput";
import { ClueStack } from "./ClueStack";
import { TierMeter } from "./TierMeter";
import type { UseGameResult } from "@/hooks/useGame";
import { applyNegs } from "@/lib/scoring";

interface PlayAreaProps {
  game: UseGameResult;
}

/** The active-round UI: pyramid meter, revealed clues, and the answer input. */
export function PlayArea({ game }: PlayAreaProps) {
  // Keyboard shortcut: → reveals the next clue, unless the caret is mid-answer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowRight" || game.isOver) return;
      const answer = document.getElementById(
        "answer",
      ) as HTMLInputElement | null;
      if (
        document.activeElement === answer &&
        (answer?.value.length ?? 0) > 0
      ) {
        return; // let the arrow move the text caret
      }
      e.preventDefault();
      game.reveal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  const livePoints = applyNegs(game.currentTier, game.negs);

  return (
    <>
      <div className="flex flex-col items-center gap-2 pt-1">
        <TierMeter
          activeIndex={game.currentClueIndex}
          negs={game.negs}
          mode="playing"
        />
        <p className="text-sm text-fg-muted">
          Buzz now for{" "}
          <span className="font-semibold text-accent-strong">
            {livePoints} pts
          </span>
        </p>
      </div>

      <ClueStack clues={game.revealedClues} />

      <AnswerInput
        onSubmit={game.submit}
        onReveal={game.reveal}
        onEngage={game.engage}
        disabled={game.isOver}
        isGiveaway={game.isGiveaway}
        prompting={game.status === "prompting"}
        feedback={game.feedback}
        focusKey={game.currentClueIndex}
      />
    </>
  );
}
