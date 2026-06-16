import { describe, it, expect } from "vitest";
import { gameReducer, initGameState, type GameState } from "./useGame";
import type { Puzzle } from "@/lib/types";

const puzzle: Puzzle = {
  id: 1,
  date: "2026-06-16",
  category: "History",
  difficulty: "easy",
  clues: ["clue0", "clue1", "clue2", "clue3", "clue4"],
  answer: "Napoleon Bonaparte",
  accept: ["Napoleon"],
  prompt: ["Bonaparte"],
  reject: ["Napoleon III"],
};

const reduce = (state: GameState, action: Parameters<typeof gameReducer>[1]) =>
  gameReducer(state, action, puzzle);

const fresh = () => initGameState(null);

describe("initGameState", () => {
  it("starts revealing with one clue", () => {
    const s = fresh();
    expect(s.status).toBe("revealing");
    expect(s.revealedCount).toBe(1);
    expect(s.negs).toBe(0);
  });

  it("restores a completed round", () => {
    const s = initGameState({
      puzzleId: 1,
      date: "2026-06-16",
      score: 80,
      buzzedOn: 1,
      negs: 0,
      won: true,
      completed: true,
    });
    expect(s.status).toBe("already-completed");
    expect(s.score).toBe(80);
    expect(s.revealedCount).toBe(2);
  });
});

describe("head start (startRevealed)", () => {
  it("begins with the requested number of clues revealed", () => {
    const s = initGameState(null, 3);
    expect(s.status).toBe("revealing");
    expect(s.revealedCount).toBe(3);
  });

  it("clamps to at least one clue", () => {
    expect(initGameState(null, 0).revealedCount).toBe(1);
  });

  it("scores from the head-start clue on a correct buzz", () => {
    // start with 3 clues shown → current clue index 2 → tier 60
    const start = initGameState(null, 3);
    const won = gameReducer(start, { type: "submit", raw: "Napoleon" }, puzzle);
    expect(won.status).toBe("won");
    expect(won.buzzedOn).toBe(2);
    expect(won.score).toBe(60);
  });
});

describe("reveal", () => {
  it("reveals the next clue and stays active", () => {
    const s = reduce(fresh(), { type: "reveal" });
    expect(s.revealedCount).toBe(2);
    expect(s.status).toBe("revealing");
  });

  it("ends the round as a loss when skipping the giveaway", () => {
    let s = fresh();
    for (let i = 0; i < 4; i++) s = reduce(s, { type: "reveal" });
    expect(s.revealedCount).toBe(5); // giveaway shown
    s = reduce(s, { type: "reveal" }); // skip it
    expect(s.status).toBe("lost");
    expect(s.score).toBe(20); // lowest tier, no negs
  });
});

describe("submit — correct", () => {
  it("wins on the first clue for full points", () => {
    const s = reduce(fresh(), { type: "submit", raw: "Napoleon Bonaparte" });
    expect(s.status).toBe("won");
    expect(s.buzzedOn).toBe(0);
    expect(s.score).toBe(100);
  });

  it("scores by the clue reached, minus negs", () => {
    let s = fresh();
    s = reduce(s, { type: "submit", raw: "wrong" }); // neg, advance to clue 1
    expect(s.negs).toBe(1);
    expect(s.revealedCount).toBe(2);
    s = reduce(s, { type: "submit", raw: "Napoleon" }); // correct on clue 1
    expect(s.status).toBe("won");
    expect(s.score).toBe(80 - 25); // 55
  });
});

describe("submit — prompt", () => {
  it("does not penalize or advance on a prompt", () => {
    let s = reduce(fresh(), { type: "reveal" }); // at clue 1
    const before = s.revealedCount;
    s = reduce(s, { type: "submit", raw: "Bonaparte" });
    expect(s.status).toBe("prompting");
    expect(s.negs).toBe(0);
    expect(s.revealedCount).toBe(before);
  });

  it("allows answering correctly after a prompt", () => {
    let s = reduce(fresh(), { type: "submit", raw: "Bonaparte" });
    expect(s.status).toBe("prompting");
    s = reduce(s, { type: "submit", raw: "Napoleon" });
    expect(s.status).toBe("won");
    expect(s.buzzedOn).toBe(0);
    expect(s.score).toBe(100); // prompt cost nothing
  });
});

describe("submit — neg", () => {
  it("negs and auto-advances", () => {
    const s = reduce(fresh(), { type: "submit", raw: "totally wrong" });
    expect(s.negs).toBe(1);
    expect(s.revealedCount).toBe(2);
    expect(s.feedback?.kind).toBe("neg");
  });

  it("a reject answer counts as a neg", () => {
    const s = reduce(fresh(), { type: "submit", raw: "Napoleon III" });
    expect(s.negs).toBe(1);
  });

  it("ends as a loss when negging on the giveaway", () => {
    let s = fresh();
    for (let i = 0; i < 4; i++) s = reduce(s, { type: "reveal" }); // clue 4
    s = reduce(s, { type: "submit", raw: "nope" });
    expect(s.status).toBe("lost");
    expect(s.negs).toBe(1);
    expect(s.score).toBe(0); // 20 - 25 -> floored
  });
});

describe("terminal states are frozen", () => {
  it("ignores actions after a win", () => {
    const won = reduce(fresh(), { type: "submit", raw: "Napoleon" });
    expect(won.status).toBe("won");
    expect(reduce(won, { type: "reveal" })).toEqual(won);
    expect(reduce(won, { type: "submit", raw: "anything" })).toEqual(won);
  });

  it("ignores actions when already completed", () => {
    const done = initGameState({
      puzzleId: 1,
      date: "2026-06-16",
      score: 80,
      buzzedOn: 1,
      negs: 0,
      won: true,
      completed: true,
    });
    expect(reduce(done, { type: "submit", raw: "Napoleon" })).toEqual(done);
  });
});

describe("engage", () => {
  it("transitions revealing -> awaiting-answer", () => {
    const s = reduce(fresh(), { type: "engage" });
    expect(s.status).toBe("awaiting-answer");
  });

  it("is a no-op once answering", () => {
    const a = reduce(fresh(), { type: "engage" });
    expect(reduce(a, { type: "engage" })).toEqual(a);
  });
});
