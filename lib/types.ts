/**
 * Core domain types for Pyramidal Buzz.
 *
 * A puzzle is a single quizbowl-style "tossup": five clues about one answer,
 * ordered hardest (index 0) to easiest / giveaway (index 4).
 */

/** Number of clues in every tossup. The pyramid is always this tall. */
export const CLUE_COUNT = 5;

/** A clue index, 0 (hardest) .. 4 (giveaway). */
export type ClueIndex = 0 | 1 | 2 | 3 | 4;

/** Overall difficulty rating of a puzzle's answer. */
export type Difficulty = "easy" | "medium" | "hard";

/** All difficulty ratings, easiest → hardest. */
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

/** Exactly five clues, hardest → giveaway. */
export type Clues = [string, string, string, string, string];

export interface Puzzle {
  /** Sequential puzzle number, shown to the user as "#142". */
  id: number;
  /** "YYYY-MM-DD" (UTC) — the day this is the daily puzzle. */
  date: string;
  /** e.g. "Literature", "Science", "History". */
  category: string;
  /** Overall difficulty rating, used by Endless mode's filters. */
  difficulty: Difficulty;
  /** Five clues, hardest → giveaway. */
  clues: Clues;
  /** Canonical answer, shown on reveal. */
  answer: string;
  /** Alternate acceptable forms (counted fully correct). */
  accept: string[];
  /** Underspecified forms that trigger a "be more specific" prompt. */
  prompt: string[];
  /** Near-misses that must be rejected as incorrect. */
  reject: string[];
}

/** The result of judging a typed answer against a puzzle. */
export type Judgment = "correct" | "prompt" | "incorrect";

/** Explicit states a single day's round can be in. */
export type GameStatus =
  | "revealing" // a fresh clue was just shown; awaiting the player's move
  | "awaiting-answer" // player is typing / deciding
  | "prompting" // last buzz was underspecified; same clue, no penalty
  | "won" // correct buzz; round over
  | "lost" // missed through the giveaway; round over
  | "already-completed"; // today was finished on a previous visit

/** Persisted outcome of one day's round. */
export interface DayResult {
  /** Puzzle id this result belongs to. */
  puzzleId: number;
  /** "YYYY-MM-DD" (UTC) the result was recorded for. */
  date: string;
  /** Final score (>= 0). */
  score: number;
  /** Clue index of the correct buzz, or null if the puzzle was missed. */
  buzzedOn: ClueIndex | null;
  /** Number of incorrect buzzes ("negs"). */
  negs: number;
  /** True when the answer was reached correctly. */
  won: boolean;
  /** Whether the round is finished (always true once stored). */
  completed: true;
}

/** Aggregate, cross-day statistics. */
export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  /** Sum of correct buzz clue indices, used to derive the mean. */
  buzzPositionSum: number;
  /** Count of wins contributing to buzzPositionSum. */
  buzzPositionCount: number;
  /** Histogram: how many wins occurred at each clue index [0..4]. */
  tierDistribution: [number, number, number, number, number];
  /** UTC date of the most recently recorded result, for streak continuity. */
  lastResultDate: string | null;
}
