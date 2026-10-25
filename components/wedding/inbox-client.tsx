"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Card,
  CardTitle,
  FormMessage,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import {
  applyEmailSuggestion,
  type EmailSuggestion,
} from "@/lib/ai/suggestions";
import { createClient } from "@/lib/db/supabase/browser";

/** Shows an ISO timestamp as a date and time in the viewer's own time zone. */
export function LocalDateTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}
    </time>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={secondaryButtonClass}
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="mr-2 h-5 w-5" aria-hidden="true" />
      ) : (
        <Copy className="mr-2 h-5 w-5" aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? "Copied" : "Copy address"}</span>
    </button>
  );
}

type Item = { suggestion: EmailSuggestion; state: "open" | "saving" | "added" };

const KIND_LABEL: Record<EmailSuggestion["kind"], string> = {
  budget_item: "Budget",
  task: "Checklist",
  event: "Calendar",
  vendor: "Vendor",
  gift: "Gift",
};

/**
 * "Email → actions": asks the AI route for suggestions, then saves only the ones a person accepts
 * (with their own client, so RLS applies). Couple/planner only.
 */
export function EmailSuggestions({
  weddingId,
  emailId,
}: {
  weddingId: string;
  emailId: string;
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
      const res = await fetch("/api/ai/email-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || "The AI helper couldn't read this email.",
        );
      setItems(
        (data.suggestions as EmailSuggestion[]).map((suggestion) => ({
          suggestion,
          state: "open",
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The AI helper couldn't read this email.",
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
      await applyEmailSuggestion(
        createClient(),
        weddingId,
        items[index].suggestion,
        emailId,
      );
      setState(index, "added");
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
        Add this to your plan
      </CardTitle>
      <p className="mt-2 text-base text-[#52635a]">
        The helper reads the email and suggests costs, dates, to-dos, vendors
        and gifts. Nothing is saved until you say yes.
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
            {loading ? "Reading the email..." : "Find dates and costs"}
          </button>
        ) : items.length === 0 ? (
          <p className="text-base text-[#52635a]">
            Nothing to add from this email.
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
                  <p className="mt-1 text-base text-[#66756c] italic">
                    {/* Claude often quotes the reason itself; don't double the quotes. */}
                    &ldquo;{suggestion.reason.replace(/^["“']+|["”']+$/g, "")}
                    &rdquo;
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {state === "added" ? (
                    <p
                      role="status"
                      className="inline-flex min-h-12 items-center text-base font-semibold text-[#24553f]"
                    >
                      <Check className="mr-2 h-5 w-5" aria-hidden="true" />
                      Added
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => accept(i)}
                        disabled={state === "saving"}
                        className={primaryButtonClass}
                      >
                        {state === "saving" ? "Adding..." : "Yes, add it"}
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
