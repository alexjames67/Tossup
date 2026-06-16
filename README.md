# Pyramidal Buzz

A daily, Wordle-style quizbowl tossup. Every player gets the **same single
puzzle** each day: five clues about one answer, ordered hardest → giveaway. Buzz
early for more points, or wait for an easier clue. Wrong buzzes ("negs") cost
points and reveal the next clue. Playable in under 90 seconds, with a
spoiler-free shareable result.

- **No backend, no accounts, no database.** Puzzles ship as static JSON;
  progress lives in `localStorage`.
- Deploys as a fully static site (`output: "export"`) to Vercel with **zero
  environment variables**.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
npm test         # unit tests (Vitest)
npm run lint     # ESLint
```

`npm run build` emits a static `out/` directory. Deploy to Vercel with `vercel`
(preview) or `vercel --prod` (production) — no config needed.

## How the daily puzzle is chosen

All selection is UTC-based so the puzzle is identical worldwide and rolls over
at the same instant (`lib/daily.ts`):

1. Prefer a puzzle whose `date` matches today (UTC).
2. Otherwise fall back to indexing the puzzle list by days-since-`EPOCH_DATE`,
   modulo the list length — so the game works before a full dated calendar
   exists.

No `Math.random()` is used anywhere in selection or scoring.

## Adding a puzzle

Edit [`data/puzzles.json`](data/puzzles.json). Each entry must match this shape
(validated at load time — a malformed puzzle throws loudly in dev):

```jsonc
{
  "id": 7,                       // unique integer, shown as "#7"
  "date": "2026-06-22",          // YYYY-MM-DD (UTC) it is the daily puzzle
  "category": "Science",
  "clues": ["…", "…", "…", "…", "…"], // exactly 5, hardest → giveaway
  "answer": "canonical answer",  // shown on reveal
  "accept": ["alt form", "…"],   // also fully correct
  "prompt": ["underspecified"],  // triggers "be more specific", no penalty
  "reject": ["near-miss"]        // explicitly wrong, counts as a neg
}
```

Authoring tips:

- Clue `0` should be genuinely obscure; clue `4` a giveaway a general audience
  could get.
- `accept` last-name-only forms where unambiguous; `prompt` them where
  ambiguous; `reject` commonly-confused other figures.

## Where the tunable constants live

| Constant | File | Meaning |
| --- | --- | --- |
| `TIER_VALUES` `[100,80,60,40,20]` | `lib/scoring.ts` | Points by the clue a correct answer lands on |
| `NEG_PENALTY` `25` | `lib/scoring.ts` | Points lost per wrong buzz |
| `FUZZY_THRESHOLD` `0.85` | `lib/judge.ts` | Typo-tolerance similarity ratio |
| `FUZZY_MIN_LENGTH` `4` | `lib/judge.ts` | Min input length for fuzzy matching |
| `EPOCH_DATE` | `lib/daily.ts` | Anchor for the index-based fallback |

No game-logic numbers live in components or the hook — they consume `lib/` only.

## Architecture

```
app/                 routes, layout, the page
components/          ClueStack, AnswerInput, TierMeter, ResultCard,
                    StatsModal, ShareButton, HowToPlay, Modal, GameScreen
hooks/useGame.ts     explicit state machine for one day's round (pure reducer)
lib/
  scoring.ts         tier / neg math            (pure, tested)
  judge.ts           answer matching            (pure, tested)
  daily.ts           date → puzzle selection    (pure, tested)
  storage.ts         localStorage, versioned    (tested)
  share.ts           spoiler-free share text    (tested)
  validate.ts        puzzle schema validation   (tested)
  puzzles.ts         data access seam (→ could become an API later)
  types.ts
data/puzzles.json    seed puzzles
```

The round is modeled as a state machine (`revealing`, `awaiting-answer`,
`prompting`, `won`, `lost`, `already-completed`) in `gameReducer`, which is pure
and unit-tested independently of React.

## Tests

`npm test` runs the Vitest suite, including the answer-matching cases
(exact / case / whitespace / article / diacritic variants, a passing one-char
typo, a failing too-short typo, a prompt, and a reject), the scoring and daily
determinism math, storage/streak logic, and the spoiler-free share string.
