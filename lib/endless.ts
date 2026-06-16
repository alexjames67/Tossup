/**
 * Endless (practice) mode helpers: filtering the puzzle pool by difficulty and
 * category, and shuffling it into a random play order.
 *
 * `filterPuzzles` is pure and unit-tested. `shuffle` uses Math.random — that's
 * fine here because Endless is explicitly NOT deterministic (unlike the daily
 * puzzle, which never uses randomness).
 */

import { CLUE_COUNT, type Difficulty, type Puzzle } from "./types";

/** "any" means no difficulty restriction. */
export type DifficultyFilter = Difficulty | "any";

export interface EndlessConfig {
  difficulty: DifficultyFilter;
  /** Categories to include; a puzzle must be in one of these. */
  categories: string[];
  /** How many clues are revealed at the start (1 = cold, hardest). */
  headStart: number;
}

/** Distinct categories present in the puzzle set, alphabetised. */
export function availableCategories(puzzles: Puzzle[]): string[] {
  return Array.from(new Set(puzzles.map((p) => p.category))).sort();
}

/** Puzzles matching the difficulty + category filters. */
export function filterPuzzles(
  puzzles: Puzzle[],
  config: EndlessConfig,
): Puzzle[] {
  return puzzles.filter(
    (p) =>
      (config.difficulty === "any" || p.difficulty === config.difficulty) &&
      config.categories.includes(p.category),
  );
}

/** Clamp a head-start to a sensible range (always leave the giveaway). */
export function clampHeadStart(headStart: number): number {
  return Math.min(Math.max(1, Math.trunc(headStart)), CLUE_COUNT - 1);
}

/** Fisher–Yates shuffle, returning a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Shuffle for the "shuffle bag": every item appears exactly once before any
 * repeats. Avoids starting the new bag with `avoid` (the item just played) so
 * there is no back-to-back repeat across the reshuffle boundary.
 */
export function reshuffleAvoiding<T>(
  items: readonly T[],
  avoid: T | null,
): T[] {
  const a = shuffle(items);
  if (avoid !== null && a.length > 1 && a[0] === avoid) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}
