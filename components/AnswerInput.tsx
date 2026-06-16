"use client";

import { useEffect, useRef, useState } from "react";
import type { Feedback } from "@/hooks/useGame";

interface AnswerInputProps {
  onSubmit: (value: string) => void;
  onReveal: () => void;
  onEngage: () => void;
  /** Disable all controls (round over). */
  disabled: boolean;
  /** True on the giveaway clue: the reveal control becomes "give up". */
  isGiveaway: boolean;
  /** Whether the last answer prompted (shows a "be specific" affordance). */
  prompting: boolean;
  /** Latest feedback to announce inline. */
  feedback: Feedback | null;
  /** Changes whenever a new clue appears, to re-focus the input. */
  focusKey: number;
}

const FEEDBACK_TONE: Record<Feedback["kind"], string> = {
  neg: "text-neg",
  prompt: "text-accent-strong",
  win: "text-correct-strong",
  lose: "text-fg-muted",
};

export function AnswerInput({
  onSubmit,
  onReveal,
  onEngage,
  disabled,
  isGiveaway,
  prompting,
  feedback,
  focusKey,
}: AnswerInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Return focus to the input whenever a new clue is revealed.
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [focusKey, disabled]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }

  const shake = feedback?.kind === "neg";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="answer" className="sr-only">
          Your answer
        </label>
        <input
          id="answer"
          ref={inputRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="send"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onEngage();
          }}
          placeholder={prompting ? "Be more specific…" : "Type your answer…"}
          aria-describedby="answer-help"
          className={`focus-ring min-w-0 flex-1 rounded-lg border bg-bg-inset px-4 py-3 text-base text-fg placeholder:text-fg-faint disabled:opacity-50 ${
            prompting ? "border-accent" : "border-border-strong"
          } ${shake ? "animate-shake" : ""}`}
        />
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          className="focus-ring shrink-0 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-bg transition enabled:hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buzz
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReveal}
          disabled={disabled}
          className="focus-ring rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-fg-muted transition enabled:hover:border-fg-faint enabled:hover:text-fg disabled:opacity-40"
        >
          {isGiveaway ? "Give up & reveal answer" : "Reveal next clue →"}
        </button>
        <p id="answer-help" className="text-xs text-fg-faint">
          Enter to buzz · → for next clue
        </p>
      </div>

      {/* Inline, assertive feedback for negs / prompts. */}
      <p
        aria-live="assertive"
        className={`min-h-5 text-sm ${
          feedback ? FEEDBACK_TONE[feedback.kind] : ""
        }`}
      >
        {feedback && feedback.kind !== "win" && feedback.kind !== "lose"
          ? feedback.message
          : ""}
      </p>
    </form>
  );
}
