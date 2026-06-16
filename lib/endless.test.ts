import { describe, it, expect } from "vitest";
import {
  availableCategories,
  filterPuzzles,
  clampHeadStart,
  shuffle,
  type EndlessConfig,
} from "./endless";
import { validatePuzzles } from "./validate";
import rawPuzzles from "@/data/puzzles.json";
import type { Puzzle } from "./types";

const puzzles = validatePuzzles(rawPuzzles);

function config(over: Partial<EndlessConfig> = {}): EndlessConfig {
  return {
    difficulty: "any",
    categories: availableCategories(puzzles),
    headStart: 1,
    ...over,
  };
}

describe("availableCategories", () => {
  it("returns sorted unique categories", () => {
    const cats = availableCategories(puzzles);
    expect(cats).toEqual([...cats].sort());
    expect(new Set(cats).size).toBe(cats.length);
    expect(cats).toContain("Literature");
  });
});

describe("filterPuzzles", () => {
  it("returns everything with 'any' difficulty and all categories", () => {
    expect(filterPuzzles(puzzles, config())).toHaveLength(puzzles.length);
  });

  it("filters by difficulty", () => {
    const easy = filterPuzzles(puzzles, config({ difficulty: "easy" }));
    expect(easy.length).toBeGreaterThan(0);
    expect(easy.every((p) => p.difficulty === "easy")).toBe(true);
  });

  it("filters by category", () => {
    const lit = filterPuzzles(puzzles, config({ categories: ["Literature"] }));
    expect(lit.every((p) => p.category === "Literature")).toBe(true);
  });

  it("returns empty when no category is selected", () => {
    expect(filterPuzzles(puzzles, config({ categories: [] }))).toHaveLength(0);
  });

  it("combines difficulty and category filters", () => {
    const result = filterPuzzles(
      puzzles,
      config({ difficulty: "hard", categories: ["Literature"] }),
    );
    expect(
      result.every(
        (p) => p.difficulty === "hard" && p.category === "Literature",
      ),
    ).toBe(true);
  });
});

describe("clampHeadStart", () => {
  it("keeps values in [1, CLUE_COUNT-1]", () => {
    expect(clampHeadStart(1)).toBe(1);
    expect(clampHeadStart(0)).toBe(1);
    expect(clampHeadStart(99)).toBe(4);
    expect(clampHeadStart(3)).toBe(3);
  });
});

describe("shuffle", () => {
  it("preserves all elements", () => {
    const input: Puzzle[] = puzzles;
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect(new Set(out.map((p) => p.id))).toEqual(
      new Set(input.map((p) => p.id)),
    );
  });

  it("does not mutate the input", () => {
    const input = [...puzzles];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});
