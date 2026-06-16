"use client";

/**
 * useGame — the explicit state machine for a single day's round.
 *
 * The reducer (`gameReducer`) and `initGameState` are pure and exported so the
 * machine can be unit-tested without React. The hook wraps them with storage
 * hydration and one-time result persistence.
 */

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";
import { judgeAnswer } from "@/lib/judge";
import { scoreForCorrect, scoreForMiss, tierValue } from "@/lib/scoring";
import { getTheme } from "@/lib/theme";
import { playTwangyBass } from "@/lib/sound";
import {
  getResultForDate,
  getStatsServerSnapshot,
  getStatsSnapshot,
  recordResult,
  subscribeStorage,
} from "@/lib/storage";
import {
  CLUE_COUNT,
  type ClueIndex,
  type DayResult,
  type GameStatus,
  type Puzzle,
  type Stats,
} from "@/lib/types";

export type FeedbackKind = "neg" | "prompt" | "win" | "lose";

export interface Feedback {
  kind: FeedbackKind;
  message: string;
}

export interface GameState {
  status: GameStatus;
  /** Number of clues revealed so far (1..CLUE_COUNT). */
  revealedCount: number;
  negs: number;
  buzzedOn: ClueIndex | null;
  score: number;
  feedback: Feedback | null;
}

export type GameAction =
  | { type: "engage" }
  | { type: "reveal" }
  | { type: "submit"; raw: string }
  | { type: "hydrate"; result: DayResult };

const ACTIVE: GameStatus[] = ["revealing", "awaiting-answer", "prompting"];
const isActive = (status: GameStatus) => ACTIVE.includes(status);

const NEG_MESSAGE = "Neg! −25 points. Next clue revealed.";
const PROMPT_MESSAGE = "Close — can you be more specific?";
const WIN_MESSAGE = "Correct!";
const LOSE_MESSAGE = "Out of clues — here's the answer.";

function completedState(result: DayResult): GameState {
  return {
    status: "already-completed",
    revealedCount:
      result.won && result.buzzedOn !== null ? result.buzzedOn + 1 : CLUE_COUNT,
    negs: result.negs,
    buzzedOn: result.buzzedOn,
    score: result.score,
    feedback: null,
  };
}

/**
 * Initial state for a fresh round, or a restored already-completed round.
 * `startRevealed` (≥1) lets a practice round begin with extra clues showing.
 */
export function initGameState(
  existing: DayResult | null,
  startRevealed = 1,
): GameState {
  if (existing) return completedState(existing);
  return {
    status: "revealing",
    revealedCount: Math.max(1, startRevealed),
    negs: 0,
    buzzedOn: null,
    score: 0,
    feedback: null,
  };
}

function finishLost(state: GameState): GameState {
  return {
    ...state,
    status: "lost",
    revealedCount: CLUE_COUNT,
    buzzedOn: null,
    score: scoreForMiss(state.negs),
    feedback: { kind: "lose", message: LOSE_MESSAGE },
  };
}

/** Pure transition function for the round. */
export function gameReducer(
  state: GameState,
  action: GameAction,
  puzzle: Puzzle,
): GameState {
  switch (action.type) {
    case "hydrate":
      return completedState(action.result);

    case "engage":
      // Player started typing: distinguish "deciding" from "answering".
      return state.status === "revealing"
        ? { ...state, status: "awaiting-answer" }
        : state;

    case "reveal": {
      if (!isActive(state.status)) return state;
      const idx = state.revealedCount - 1;
      if (idx >= CLUE_COUNT - 1) {
        // No clue left to reveal: choosing to skip the giveaway ends the round.
        return finishLost(state);
      }
      return {
        ...state,
        status: "revealing",
        revealedCount: state.revealedCount + 1,
        feedback: null,
      };
    }

    case "submit": {
      if (!isActive(state.status)) return state;
      const idx = (state.revealedCount - 1) as ClueIndex;
      const judgment = judgeAnswer(action.raw, puzzle);

      if (judgment === "correct") {
        return {
          ...state,
          status: "won",
          buzzedOn: idx,
          score: scoreForCorrect(idx, state.negs),
          feedback: { kind: "win", message: WIN_MESSAGE },
        };
      }

      if (judgment === "prompt") {
        return {
          ...state,
          status: "prompting",
          feedback: { kind: "prompt", message: PROMPT_MESSAGE },
        };
      }

      // Incorrect → neg, then advance (or end if on the giveaway).
      const negs = state.negs + 1;
      if (idx >= CLUE_COUNT - 1) {
        return finishLost({ ...state, negs });
      }
      return {
        ...state,
        status: "revealing",
        negs,
        revealedCount: state.revealedCount + 1,
        feedback: { kind: "neg", message: NEG_MESSAGE },
      };
    }

    default:
      return state;
  }
}

export type GameMode = "daily" | "endless";

export interface UseGameResult {
  status: GameStatus;
  puzzle: Puzzle;
  /** The clues revealed so far, hardest → most recent. */
  revealedClues: string[];
  currentClueIndex: ClueIndex;
  /** Points currently on the line for a correct buzz (pre-nets already applied). */
  currentTier: number;
  negs: number;
  score: number;
  buzzedOn: ClueIndex | null;
  feedback: Feedback | null;
  isGiveaway: boolean;
  isOver: boolean;
  stats: Stats;
  submit: (raw: string) => void;
  reveal: () => void;
  engage: () => void;
}

export function useGame(
  puzzle: Puzzle,
  date: string,
  mode: GameMode = "daily",
  startRevealed = 1,
): UseGameResult {
  const reducer = useCallback(
    (state: GameState, action: GameAction) =>
      gameReducer(state, action, puzzle),
    [puzzle],
  );

  // This hook only ever renders on the client (the page gates it behind a
  // mounted date), so reading localStorage in the lazy initializer is safe and
  // avoids any hydration mismatch. Endless (practice) rounds always start
  // fresh — they are never restored from storage — and may begin with extra
  // clues already revealed (the head-start difficulty knob).
  const [state, dispatch] = useReducer(
    reducer,
    { date, mode, startRevealed },
    (arg) =>
      initGameState(
        arg.mode === "daily" ? getResultForDate(arg.date) : null,
        arg.startRevealed,
      ),
  );
  // Endless rounds are never persisted, so they start "already recorded".
  const recordedRef = useRef(
    mode !== "daily" || state.status === "already-completed",
  );
  const wonSoundRef = useRef(false);

  // Funky theme: play the signature twang on a correct buzz (once per round).
  useEffect(() => {
    if (wonSoundRef.current) return;
    if (state.status === "won") {
      wonSoundRef.current = true;
      if (getTheme() === "funky") playTwangyBass();
    }
  }, [state.status]);

  // Stats are sourced from storage and refreshed via subscription, so we never
  // call setState from inside an effect.
  const stats: Stats = useSyncExternalStore(
    subscribeStorage,
    getStatsSnapshot,
    getStatsServerSnapshot,
  );

  // Persist exactly once when a *daily* round ends. The effect only writes to
  // the external store; the subscription above propagates the new stats back.
  // Endless rounds intentionally never touch daily stats or the streak.
  useEffect(() => {
    if (mode !== "daily" || recordedRef.current) return;
    if (state.status === "won" || state.status === "lost") {
      recordedRef.current = true;
      recordResult({
        date,
        puzzleId: puzzle.id,
        won: state.status === "won",
        buzzedOn: state.buzzedOn,
        negs: state.negs,
        score: state.score,
      });
    }
  }, [
    mode,
    state.status,
    state.buzzedOn,
    state.negs,
    state.score,
    date,
    puzzle.id,
  ]);

  const currentClueIndex = (state.revealedCount - 1) as ClueIndex;

  return {
    status: state.status,
    puzzle,
    revealedClues: puzzle.clues.slice(0, state.revealedCount),
    currentClueIndex,
    currentTier: tierValue(currentClueIndex),
    negs: state.negs,
    score: state.score,
    buzzedOn: state.buzzedOn,
    feedback: state.feedback,
    isGiveaway: currentClueIndex >= CLUE_COUNT - 1,
    isOver:
      state.status === "won" ||
      state.status === "lost" ||
      state.status === "already-completed",
    stats,
    submit: (raw: string) => dispatch({ type: "submit", raw }),
    reveal: () => dispatch({ type: "reveal" }),
    engage: () => dispatch({ type: "engage" }),
  };
}
