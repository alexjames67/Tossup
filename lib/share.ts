/**
 * Spoiler-free share text.
 *
 * The output never contains the answer or any clue text — only an emoji "path"
 * encoding where the player buzzed, plus score metadata. Clue numbers are
 * shown 1-based to match the UI ("clue 3" == internal index 2).
 */

import { CLUE_COUNT, type DayResult } from "./types";

const PASSED = "🟦"; // a clue the player moved past
const GOT_IT = "🟩"; // the clue they answered correctly
const UNREACHED = "⬜"; // a clue never revealed
const MISSED = "🟥"; // reached the giveaway and still missed

export const SHARE_URL = "pyramidalbuzz.com";
export const SHARE_TITLE = "Pyramidal Buzz";

type ShareResult = Pick<DayResult, "won" | "buzzedOn" | "negs" | "score">;

/** Build the 5-square emoji path. */
export function buildPath(
  result: Pick<ShareResult, "won" | "buzzedOn">,
): string {
  const squares: string[] = [];
  for (let i = 0; i < CLUE_COUNT; i++) {
    if (result.won && result.buzzedOn !== null) {
      if (i < result.buzzedOn) squares.push(PASSED);
      else if (i === result.buzzedOn) squares.push(GOT_IT);
      else squares.push(UNREACHED);
    } else {
      // A loss means every clue was revealed and the giveaway was missed.
      squares.push(i === CLUE_COUNT - 1 ? MISSED : PASSED);
    }
  }
  return squares.join("");
}

function negText(negs: number): string | null {
  if (negs <= 0) return null;
  return `${negs} ${negs === 1 ? "neg" : "negs"}`;
}

/** Compose the full, multi-line shareable string. */
export function buildShareText(result: ShareResult, puzzleId: number): string {
  const path = buildPath(result);

  const segments: string[] = [];
  if (result.won && result.buzzedOn !== null) {
    segments.push(`buzzed on clue ${result.buzzedOn + 1}`);
  } else {
    segments.push("missed");
  }
  const negs = negText(result.negs);
  if (negs) segments.push(negs);
  segments.push(`${result.score} pts`);

  return [
    `${SHARE_TITLE} #${puzzleId}`,
    `${path}  ${segments.join(" · ")}`,
    SHARE_URL,
  ].join("\n");
}
