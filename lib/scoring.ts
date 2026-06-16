/**
 * Scoring math for Pyramidal Buzz.
 *
 * Every tunable number lives here. The component and hook layers must consume
 * these functions and never hardcode tier values or penalties.
 */

import { CLUE_COUNT, type ClueIndex } from "./types";

/** Points awarded for a correct answer, indexed by the clue it was given on. */
export const TIER_VALUES: readonly [number, number, number, number, number] = [
  100, 80, 60, 40, 20,
];

/** Points subtracted for each incorrect buzz ("neg"). */
export const NEG_PENALTY = 25;

/** Scores never go below this floor. */
export const MIN_SCORE = 0;

/** Tier value (pre-penalty) for a correct answer on the given clue. */
export function tierValue(clueIndex: ClueIndex): number {
  return TIER_VALUES[clueIndex];
}

/** Subtract neg penalties from a base value, floored at MIN_SCORE. */
export function applyNegs(base: number, negs: number): number {
  return Math.max(MIN_SCORE, base - negs * NEG_PENALTY);
}

/** Final score for a correct buzz on `clueIndex` after `negs` wrong buzzes. */
export function scoreForCorrect(clueIndex: ClueIndex, negs: number): number {
  return applyNegs(TIER_VALUES[clueIndex], negs);
}

/**
 * Final score when the player reaches the giveaway and still misses.
 * Per spec, this is the lowest (final) tier value minus accumulated negs,
 * floored at zero — a small consolation for going the distance.
 */
export function scoreForMiss(negs: number): number {
  return applyNegs(TIER_VALUES[CLUE_COUNT - 1], negs);
}
