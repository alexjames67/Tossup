import { describe, it, expect } from "vitest";
import { buildPath, buildShareText, SHARE_URL, SHARE_TITLE } from "./share";
import { validatePuzzles } from "./validate";
import rawPuzzles from "@/data/puzzles.json";

describe("buildPath", () => {
  it("matches the spec example for a mid-pyramid win", () => {
    // buzzed on clue 3 (1-based) == index 2
    expect(buildPath({ won: true, buzzedOn: 2 })).toBe("🟦🟦🟩⬜⬜");
  });

  it("shows an immediate win on clue 1", () => {
    expect(buildPath({ won: true, buzzedOn: 0 })).toBe("🟩⬜⬜⬜⬜");
  });

  it("marks a loss at the giveaway", () => {
    expect(buildPath({ won: false, buzzedOn: null })).toBe("🟦🟦🟦🟦🟥");
  });
});

describe("buildShareText", () => {
  it("reproduces the spec example line", () => {
    const text = buildShareText(
      { won: true, buzzedOn: 2, negs: 1, score: 35 },
      142,
    );
    expect(text).toBe(
      [
        "Pyramidal Buzz #142",
        "🟦🟦🟩⬜⬜  buzzed on clue 3 · 1 neg · 35 pts",
        SHARE_URL,
      ].join("\n"),
    );
  });

  it("omits the neg segment when there are none", () => {
    const text = buildShareText(
      { won: true, buzzedOn: 0, negs: 0, score: 100 },
      7,
    );
    expect(text).toContain("buzzed on clue 1 · 100 pts");
    expect(text).not.toContain("neg");
  });

  it("pluralizes negs and shows a miss", () => {
    const text = buildShareText(
      { won: false, buzzedOn: null, negs: 2, score: 0 },
      7,
    );
    expect(text).toContain("missed · 2 negs · 0 pts");
  });

  it("is genuinely spoiler-free for every shipped puzzle", () => {
    const puzzles = validatePuzzles(rawPuzzles);
    for (const p of puzzles) {
      const text = buildShareText(
        { won: true, buzzedOn: 1, negs: 0, score: 80 },
        p.id,
      );
      // Scrub the fixed scaffolding (title, URL, score labels, emoji) so we
      // only scan the truly variable content. Otherwise short answers like
      // "Ra" false-match substrings of "pyRAmidal".
      let haystack = text.toLowerCase();
      for (const s of [
        SHARE_TITLE.toLowerCase(),
        SHARE_URL.toLowerCase(),
        "buzzed on clue",
        "missed",
        "negs",
        "neg",
        "pts",
      ]) {
        haystack = haystack.split(s).join(" ");
      }

      // The answer must not appear.
      expect(haystack).not.toContain(p.answer.toLowerCase());
      // No clue text (use a distinctive long token from each clue).
      for (const clue of p.clues) {
        const token = clue
          .toLowerCase()
          .replace(/[^a-z ]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length >= 6)[0];
        if (token) expect(haystack).not.toContain(token);
      }
    }
  });
});
