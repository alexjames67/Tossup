"use client";

import { GameHeader } from "./GameHeader";
import { PlayArea } from "./PlayArea";
import { ResultCard } from "./ResultCard";
import { useGame } from "@/hooks/useGame";
import type { Puzzle } from "@/lib/types";

interface NavHandlers {
  goHome: () => void;
  openHelp: () => void;
  openStats: () => void;
}

interface DailyScreenProps {
  puzzle: Puzzle;
  date: string;
  nav: NavHandlers;
}

export function DailyScreen({ puzzle, date, nav }: DailyScreenProps) {
  const game = useGame(puzzle, date, "daily");

  const won =
    game.status === "won" ||
    (game.status === "already-completed" && game.buzzedOn !== null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-10">
      <GameHeader
        subtitle={`#${puzzle.id} · ${puzzle.category}`}
        onHome={nav.goHome}
        onHelp={nav.openHelp}
        onStats={nav.openStats}
      />
      <main className="flex flex-1 flex-col justify-center gap-6 py-2">
        {game.isOver ? (
          <ResultCard
            puzzle={puzzle}
            won={won}
            buzzedOn={game.buzzedOn}
            negs={game.negs}
            score={game.score}
            onShowStats={nav.openStats}
          />
        ) : (
          <PlayArea game={game} />
        )}
      </main>
    </div>
  );
}
