import { describe, it, expect } from "vitest";
import {
  normalize,
  levenshtein,
  similarity,
  judgeAnswer,
  FUZZY_THRESHOLD,
} from "./judge";
import type { Puzzle } from "./types";

const puzzle: Puzzle = {
  id: 1,
  date: "2026-06-16",
  category: "History",
  difficulty: "easy",
  clues: ["c0", "c1", "c2", "c3", "c4"],
  answer: "Napoleon Bonaparte",
  accept: ["Napoleon", "Napoleon I"],
  prompt: ["Bonaparte"],
  reject: ["Napoleon III", "Louis Napoleon"],
};

const riverPuzzle: Puzzle = {
  id: 4,
  date: "2026-06-19",
  category: "Geography",
  difficulty: "easy",
  clues: ["c0", "c1", "c2", "c3", "c4"],
  answer: "Nile River",
  accept: ["Nile", "the Nile"],
  prompt: [],
  reject: ["Niger River"],
};

describe("normalize", () => {
  it("lowercases and trims", () => {
    expect(normalize("  NAPOLEON  ")).toBe("napoleon");
  });

  it("collapses internal whitespace", () => {
    expect(normalize("John   F   Kennedy")).toBe("john f kennedy");
  });

  it("strips surrounding and internal punctuation", () => {
    expect(normalize("Moby-Dick!")).toBe("moby dick");
    expect(normalize("(Nile)")).toBe("nile");
  });

  it("removes a single leading article", () => {
    expect(normalize("the Nile")).toBe("nile");
    expect(normalize("An Apple")).toBe("apple");
    // a non-leading article stays
    expect(normalize("Day of the Jackal")).toBe("day of the jackal");
  });

  it("keeps a lone article rather than emptying the string", () => {
    expect(normalize("the")).toBe("the");
  });

  it("strips diacritics", () => {
    expect(normalize("café")).toBe("cafe");
    expect(normalize("Velázquez")).toBe("velazquez");
  });
});

describe("levenshtein & similarity", () => {
  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("computes a similarity ratio", () => {
    expect(similarity("abc", "abc")).toBe(1);
    // one substitution in nine chars
    expect(similarity("beethoven", "beethovan")).toBeCloseTo(1 - 1 / 9, 5);
  });
});

describe("judgeAnswer", () => {
  it("accepts an exact canonical match", () => {
    expect(judgeAnswer("Napoleon Bonaparte", puzzle)).toBe("correct");
  });

  it("accepts case / whitespace / article / diacritic variants", () => {
    expect(judgeAnswer("  napoleon   bonaparte ", puzzle)).toBe("correct");
    expect(judgeAnswer("the Nile", riverPuzzle)).toBe("correct");
    expect(judgeAnswer("nile", riverPuzzle)).toBe("correct");
  });

  it("accepts an alternate from the accept list", () => {
    expect(judgeAnswer("Napoleon I", puzzle)).toBe("correct");
  });

  it("accepts a one-character typo on a long input (fuzzy)", () => {
    // "napoleon bonaparte" with a single typo
    expect(judgeAnswer("napoleon bonoparte", puzzle)).toBe("correct");
  });

  it("rejects a too-short typo (fuzzy disabled for short inputs)", () => {
    // "nyle" (4 chars) is one edit from "nile" but too short to fuzzy-match
    expect(judgeAnswer("nyle", riverPuzzle)).toBe("incorrect");
  });

  it("prompts on an underspecified answer", () => {
    expect(judgeAnswer("Bonaparte", puzzle)).toBe("prompt");
  });

  it("never treats a prompt as a neg (returns prompt, not incorrect)", () => {
    expect(judgeAnswer("bonaparte", puzzle)).not.toBe("incorrect");
  });

  it("rejects an explicit near-miss", () => {
    expect(judgeAnswer("Napoleon III", puzzle)).toBe("incorrect");
    expect(judgeAnswer("Niger River", riverPuzzle)).toBe("incorrect");
  });

  it("treats empty input as incorrect", () => {
    expect(judgeAnswer("   ", puzzle)).toBe("incorrect");
  });

  it("rejects an unrelated answer", () => {
    expect(judgeAnswer("Winston Churchill", puzzle)).toBe("incorrect");
  });

  it("does not fuzzy-match a reject into correct", () => {
    // a near-miss that is explicitly rejected stays incorrect
    expect(judgeAnswer("Napoleon III", puzzle)).toBe("incorrect");
  });

  it("exposes the documented fuzzy threshold", () => {
    expect(FUZZY_THRESHOLD).toBe(0.85);
  });
});
