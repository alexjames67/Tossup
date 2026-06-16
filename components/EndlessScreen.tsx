"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameHeader } from "./GameHeader";
import { PlayArea } from "./PlayArea";
import { useGame } from "@/hooks/useGame";
import { buildPath } from "@/lib/share";
import { PUZZLES } from "@/lib/puzzles";
import {
  availableCategories,
  clampHeadStart,
  filterPuzzles,
  shuffle,
  type DifficultyFilter,
  type EndlessConfig,
} from "@/lib/endless";
import {
  applyEndlessRound,
  loadEndlessRecords,
  saveEndlessRecords,
} from "@/lib/storage";
import { DIFFICULTIES, type ClueIndex, type Puzzle } from "@/lib/types";

interface NavHandlers {
  goHome: () => void;
  openHelp: () => void;
  openStats: () => void;
}

interface Board {
  // Per-session counters (reset each time you start practicing).
  solved: number;
  correct: number;
  points: number;
  currentStreak: number;
  // Records, persisted across sessions.
  bestStreak: number;
  highScore: number;
}

const ALL_CATEGORIES = availableCategories(PUZZLES);

const HEAD_STARTS = [
  { value: 1, label: "Cold", hint: "start on clue 1" },
  { value: 2, label: "2 clues", hint: "easier" },
  { value: 3, label: "3 clues", hint: "easiest" },
];

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "any", label: "Any" },
  ...DIFFICULTIES.map((d) => ({
    value: d,
    label: d[0].toUpperCase() + d.slice(1),
  })),
];

type Phase = "setup" | "playing";

/**
 * Endless practice mode: pick difficulty + categories, then play unlimited
 * puzzles in random order. No daily lock, no effect on the daily streak.
 */
export function EndlessScreen({ nav }: { nav: NavHandlers }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<EndlessConfig>({
    difficulty: "any",
    categories: ALL_CATEGORIES,
    headStart: 1,
  });

  const [queue, setQueue] = useState<Puzzle[]>([]);
  const [pos, setPos] = useState(0);
  const [roundId, setRoundId] = useState(0);
  // Records are loaded once from storage; session counters start at zero.
  const [board, setBoard] = useState<Board>(() => {
    const r = loadEndlessRecords();
    return {
      solved: 0,
      correct: 0,
      points: 0,
      currentStreak: 0,
      bestStreak: r.bestStreak,
      highScore: r.highScore,
    };
  });

  const pool = useMemo(() => filterPuzzles(PUZZLES, config), [config]);

  // Persist records whenever they change (external write only — no setState).
  useEffect(() => {
    saveEndlessRecords({
      bestStreak: board.bestStreak,
      highScore: board.highScore,
    });
  }, [board.bestStreak, board.highScore]);

  function startPractice() {
    if (pool.length === 0) return;
    setQueue(shuffle(pool));
    setPos(0);
    setRoundId((r) => r + 1);
    // Reset the session, but keep the persisted records.
    setBoard((b) => ({
      solved: 0,
      correct: 0,
      points: 0,
      currentStreak: 0,
      bestStreak: b.bestStreak,
      highScore: b.highScore,
    }));
    setPhase("playing");
  }

  const handleComplete = useCallback((won: boolean, score: number) => {
    setBoard((b) => {
      const currentStreak = won ? b.currentStreak + 1 : 0;
      const records = applyEndlessRound(
        { bestStreak: b.bestStreak, highScore: b.highScore },
        currentStreak,
        score,
      );
      return {
        solved: b.solved + 1,
        correct: b.correct + (won ? 1 : 0),
        points: b.points + score,
        currentStreak,
        ...records,
      };
    });
  }, []);

  function handleNext() {
    setRoundId((r) => r + 1);
    const next = pos + 1;
    if (next < queue.length) {
      setPos(next);
    } else {
      // Exhausted the shuffled queue — reshuffle for continuous play.
      setQueue(shuffle(pool));
      setPos(0);
    }
  }

  if (phase === "setup") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-10">
        <GameHeader
          subtitle="Endless · practice"
          onHome={nav.goHome}
          onHelp={nav.openHelp}
          onStats={nav.openStats}
        />
        <EndlessSetup
          config={config}
          onChange={setConfig}
          poolCount={pool.length}
          onStart={startPractice}
        />
      </div>
    );
  }

  const puzzle = queue[pos];
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-10">
      <GameHeader
        subtitle={`Endless · ${puzzle.category}`}
        onHome={nav.goHome}
        onHelp={nav.openHelp}
        onStats={nav.openStats}
      />

      <PracticeTally board={board} />
      <button
        type="button"
        onClick={() => setPhase("setup")}
        className="focus-ring mt-2 self-start rounded text-xs text-fg-faint underline-offset-4 transition hover:text-fg hover:underline"
      >
        ← Change filters
      </button>

      <main className="mt-4 flex flex-1 flex-col gap-6">
        <EndlessRound
          key={roundId}
          puzzle={puzzle}
          headStart={clampHeadStart(config.headStart)}
          onComplete={handleComplete}
          onNext={handleNext}
        />
      </main>
    </div>
  );
}

interface EndlessSetupProps {
  config: EndlessConfig;
  onChange: (next: EndlessConfig) => void;
  poolCount: number;
  onStart: () => void;
}

function EndlessSetup({
  config,
  onChange,
  poolCount,
  onStart,
}: EndlessSetupProps) {
  function toggleCategory(cat: string) {
    const has = config.categories.includes(cat);
    onChange({
      ...config,
      categories: has
        ? config.categories.filter((c) => c !== cat)
        : [...config.categories, cat],
    });
  }

  const allSelected = config.categories.length === ALL_CATEGORIES.length;

  return (
    <main className="flex flex-1 flex-col gap-7 pt-2">
      <div>
        <h2 className="font-display text-2xl font-bold text-fg">
          Endless practice
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          Unlimited puzzles in random order — for learning. Your streak and
          daily stats are untouched.
        </p>
      </div>

      {/* Difficulty */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg">
          Question difficulty
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {DIFFICULTY_OPTIONS.map((opt) => {
            const active = config.difficulty === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ ...config, difficulty: opt.value })}
                className={`focus-ring rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-accent bg-accent/15 text-accent-strong"
                    : "border-border-strong text-fg-muted hover:text-fg"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Head start */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg">
          Head start{" "}
          <span className="font-normal text-fg-faint">
            (clues shown at the start)
          </span>
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {HEAD_STARTS.map((opt) => {
            const active = config.headStart === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ ...config, headStart: opt.value })}
                className={`focus-ring flex flex-col items-start rounded-lg border px-4 py-2 text-sm transition ${
                  active
                    ? "border-accent bg-accent/15 text-accent-strong"
                    : "border-border-strong text-fg-muted hover:text-fg"
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Categories */}
      <fieldset>
        <div className="mb-2 flex items-center justify-between">
          <legend className="text-sm font-semibold text-fg">Categories</legend>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...config,
                categories: allSelected ? [] : [...ALL_CATEGORIES],
              })
            }
            className="focus-ring rounded text-xs text-fg-faint underline-offset-4 transition hover:text-fg hover:underline"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_CATEGORIES.map((cat) => {
            const checked = config.categories.includes(cat);
            return (
              <label
                key={cat}
                className={`focus-within:shadow-[0_0_0_3px_var(--ring)] flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  checked
                    ? "border-accent/60 bg-accent/10 text-fg"
                    : "border-border bg-bg-inset text-fg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(cat)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {cat}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={poolCount === 0}
          className="focus-ring rounded-lg bg-accent px-6 py-3 text-base font-semibold text-bg transition enabled:hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start practicing
        </button>
        <p className="text-center text-xs text-fg-faint" aria-live="polite">
          {poolCount === 0
            ? "Select at least one category with matching puzzles."
            : `${poolCount} puzzle${poolCount === 1 ? "" : "s"} match your filters`}
        </p>
      </div>
    </main>
  );
}

function PracticeTally({ board }: { board: Board }) {
  const items = [
    { label: "Solved", value: board.solved },
    { label: "Correct", value: board.correct },
    { label: "Points", value: board.points },
    { label: "Streak", value: board.currentStreak },
    { label: "Best", value: board.bestStreak },
    { label: "High", value: board.highScore },
  ];
  return (
    <div
      className="grid grid-cols-3 gap-2 sm:grid-cols-6"
      aria-label="Practice session scoreboard"
    >
      {items.map((it) => (
        <div
          key={it.label}
          className="flex flex-col items-center justify-center rounded-lg border border-border bg-bg-inset px-2 py-2"
        >
          <span className="font-mono text-lg font-bold tabular-nums text-fg">
            {it.value}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-fg-faint">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface EndlessRoundProps {
  puzzle: Puzzle;
  headStart: number;
  onComplete: (won: boolean, score: number) => void;
  onNext: () => void;
}

function EndlessRound({
  puzzle,
  headStart,
  onComplete,
  onNext,
}: EndlessRoundProps) {
  const game = useGame(puzzle, `endless-${puzzle.id}`, "endless", headStart);
  const firedRef = useRef(false);

  // Report the result up exactly once when the round finishes.
  useEffect(() => {
    if (firedRef.current) return;
    if (game.status === "won" || game.status === "lost") {
      firedRef.current = true;
      onComplete(game.status === "won", game.score);
    }
  }, [game.status, game.score, onComplete]);

  if (game.isOver) {
    return (
      <EndlessResultCard
        puzzle={puzzle}
        won={game.status === "won"}
        buzzedOn={game.buzzedOn}
        negs={game.negs}
        score={game.score}
        onNext={onNext}
      />
    );
  }
  return <PlayArea game={game} />;
}

interface EndlessResultCardProps {
  puzzle: Puzzle;
  won: boolean;
  buzzedOn: ClueIndex | null;
  negs: number;
  score: number;
  onNext: () => void;
}

function EndlessResultCard({
  puzzle,
  won,
  buzzedOn,
  negs,
  score,
  onNext,
}: EndlessResultCardProps) {
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
        <p className="mt-1 text-sm text-fg-faint">
          {puzzle.category} · {puzzle.difficulty}
        </p>
      </div>

      <div className="text-5xl leading-none tracking-widest" aria-hidden="true">
        {buildPath({ won, buzzedOn })}
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

      <button
        type="button"
        onClick={onNext}
        autoFocus
        className="focus-ring w-full rounded-lg bg-accent px-6 py-3 text-base font-semibold text-bg transition hover:bg-accent-strong"
      >
        Next puzzle →
      </button>
    </section>
  );
}
