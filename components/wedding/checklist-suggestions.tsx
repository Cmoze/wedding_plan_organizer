"use client";

import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Card,
  CardTitle,
  FormMessage,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/wedding/ui";
import {
  applyChecklistSuggestion,
  type ChecklistSuggestion,
} from "@/lib/ai/suggestions";
import { createClient } from "@/lib/db/supabase/browser";

type Item = {
  suggestion: ChecklistSuggestion;
  state: "open" | "saving" | "done";
};

const KIND_LABEL: Record<ChecklistSuggestion["kind"], string> = {
  add_task: "New task",
  move_task: "New due date",
  remove_task: "Skip this",
};

const ACCEPT_LABEL: Record<ChecklistSuggestion["kind"], [string, string]> = {
  add_task: ["Yes, add it", "Added"],
  move_task: ["Yes, change the date", "Date changed"],
  remove_task: ["Yes, remove it", "Removed"],
};

/**
 * "Personalized checklist": asks the AI route how to fit the standard checklist to this wedding,
 * then saves only the changes a person accepts (with their own client, so RLS applies).
 * Couple/planner only.
 */
export function ChecklistSuggestions({
  weddingId,
  fresh,
}: {
  weddingId: string;
  /** Nothing finished yet (e.g. just created): explain the helper a bit more. */
  fresh: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/ai/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || "The AI helper couldn't look at your checklist.",
        );
      setItems(
        (data.suggestions as ChecklistSuggestion[]).map((suggestion) => ({
          suggestion,
          state: "open",
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The AI helper couldn't look at your checklist.",
      );
    } finally {
      setLoading(false);
    }
  }

  const setState = (index: number, state: Item["state"] | null) =>
    setItems(
      (prev) =>
        prev &&
        (state === null
          ? prev.filter((_, i) => i !== index)
          : prev.map((it, i) => (i === index ? { ...it, state } : it))),
    );

  async function accept(index: number) {
    if (!items) return;
    setState(index, "saving");
    setError(undefined);
    try {
      await applyChecklistSuggestion(
        createClient(),
        weddingId,
        items[index].suggestion,
      );
      setState(index, "done");
      startTransition(() => router.refresh());
    } catch (err) {
      setState(index, "open");
      setError(err instanceof Error ? err.message : "Couldn't save that.");
    }
  }

  return (
    <Card>
      <CardTitle>
        <Sparkles
          className="mr-2 inline h-5 w-5 align-[-2px] text-[#785e35]"
          aria-hidden="true"
        />
        Tailor my checklist
      </CardTitle>
      <p className="mt-2 text-base text-[#52635a]">
        {fresh
          ? "This is a standard checklist. The helper can fit it to your date, guest count and budget: adding what's missing, moving dates and skipping what doesn't apply."
          : "The helper looks at your date, guest count and budget and suggests changes to the checklist."}{" "}
        Nothing changes until you say yes.
      </p>

      <div className="mt-4 space-y-3">
        <FormMessage error={error} />

        {items === null ? (
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={primaryButtonClass}
          >
            {loading ? "Looking at your checklist..." : "Tailor my checklist"}
          </button>
        ) : items.length === 0 ? (
          <p className="text-base text-[#52635a]">
            Your checklist already fits your wedding. Nothing to change.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map(({ suggestion, state }, i) => (
              <li
                key={i}
                className="rounded-2xl border border-[#e2e4dc] bg-[#fbfbf8] p-4"
              >
                <p className="text-sm font-bold tracking-[0.1em] text-[#785e35] uppercase">
                  {KIND_LABEL[suggestion.kind]}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#20352f]">
                  {suggestion.label}
                </p>
                {suggestion.reason && (
                  <p className="mt-1 text-base text-[#66756c]">
                    {suggestion.reason}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {state === "done" ? (
                    <p
                      role="status"
                      className="inline-flex min-h-12 items-center text-base font-semibold text-[#24553f]"
                    >
                      <Check className="mr-2 h-5 w-5" aria-hidden="true" />
                      {ACCEPT_LABEL[suggestion.kind][1]}
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => accept(i)}
                        disabled={state === "saving"}
                        className={primaryButtonClass}
                      >
                        {state === "saving"
                          ? "Saving..."
                          : ACCEPT_LABEL[suggestion.kind][0]}
                      </button>
                      <button
                        type="button"
                        onClick={() => setState(i, null)}
                        disabled={state === "saving"}
                        className={quietButtonClass}
                      >
                        No thanks
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
