"use client";

import { useState } from "react";
import { buildShareText } from "@/lib/share";
import type { ClueIndex } from "@/lib/types";

interface ShareButtonProps {
  won: boolean;
  buzzedOn: ClueIndex | null;
  negs: number;
  score: number;
  puzzleId: number;
}

type ShareState = "idle" | "copied" | "shared";

export function ShareButton({
  won,
  buzzedOn,
  negs,
  score,
  puzzleId,
}: ShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle");

  async function handleShare() {
    const text = buildShareText({ won, buzzedOn, negs, score }, puzzleId);

    // Prefer the native share sheet on supporting (mostly mobile) browsers.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        setState("shared");
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="focus-ring w-full rounded-lg bg-correct px-6 py-3 text-base font-semibold text-on-accent transition hover:bg-correct-strong"
    >
      {state === "copied"
        ? "Copied!"
        : state === "shared"
          ? "Shared!"
          : "Share result"}
    </button>
  );
}
