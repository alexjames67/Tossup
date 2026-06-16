import { describe, it, expect } from "vitest";
import {
  TIER_VALUES,
  NEG_PENALTY,
  tierValue,
  applyNegs,
  scoreForCorrect,
  scoreForMiss,
} from "./scoring";

describe("tier values", () => {
  it("descend from hardest to giveaway", () => {
    expect(TIER_VALUES).toEqual([100, 80, 60, 40, 20]);
  });
});

describe("applyNegs", () => {
  it("subtracts the penalty per neg", () => {
    expect(applyNegs(100, 0)).toBe(100);
    expect(applyNegs(100, 1)).toBe(100 - NEG_PENALTY);
    expect(applyNegs(100, 2)).toBe(100 - 2 * NEG_PENALTY);
  });

  it("floors at zero rather than going negative", () => {
    expect(applyNegs(20, 1)).toBe(0); // 20 - 25 -> floored
    expect(applyNegs(40, 5)).toBe(0);
  });
});

describe("scoreForCorrect", () => {
  it("returns the full tier value with no negs", () => {
    expect(scoreForCorrect(0, 0)).toBe(100);
    expect(scoreForCorrect(4, 0)).toBe(20);
  });

  it("applies neg penalties", () => {
    // correct on clue 1 (80) after one neg -> 55
    expect(scoreForCorrect(1, 1)).toBe(55);
    // correct on clue 2 (60) after two negs -> 10
    expect(scoreForCorrect(2, 2)).toBe(10);
  });

  it("never goes below zero", () => {
    expect(scoreForCorrect(4, 1)).toBe(0);
  });
});

describe("scoreForMiss", () => {
  it("awards the lowest tier minus negs", () => {
    expect(scoreForMiss(0)).toBe(20);
  });

  it("floors at zero with any neg", () => {
    expect(scoreForMiss(1)).toBe(0);
    expect(scoreForMiss(3)).toBe(0);
  });
});

describe("tierValue", () => {
  it("maps clue index to its tier", () => {
    expect(tierValue(0)).toBe(100);
    expect(tierValue(3)).toBe(40);
  });
});
