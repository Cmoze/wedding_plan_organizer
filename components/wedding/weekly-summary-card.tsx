"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PiperAvatar } from "@/components/wedding/assistant-chat";
import type { WeeklySummary } from "@/lib/ai/weekly-summary";

/**
 * "What should we do this week?" on Home. Loads after the page (an AI call can take a few seconds)
 * from GET /api/ai/weekly-summary, which caches per day and falls back to a plain summary when AI is
 * off. Hidden if the request fails, since the rest of Home already shows the same tasks.
 */
export function WeeklySummaryCard({ weddingId }: { weddingId: string }) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai/weekly-summary?weddingId=${encodeURIComponent(weddingId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: WeeklySummary) => !cancelled && setSummary(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [weddingId]);

  if (failed) return null;

  return (
    <section
      aria-busy={!summary}
      className="rounded-[1.75rem] border border-[#eadfe2] bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-start gap-4">
        {summary?.source === "ai" ? (
          <PiperAvatar size={48} />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fbf3f5] text-[#8c3c58]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.15em] text-[#956779] uppercase">
            {summary?.source === "ai" ? "From Piper" : "This week"}
          </p>
          <h2 className="font-heading mt-1 text-2xl text-[#35151f] sm:text-3xl">
            What should we do this week?
          </h2>
          {summary ? (
            <p className="mt-2 text-lg text-[#492734]">{summary.headline}</p>
          ) : (
            <p
              role="status"
              className="mt-2 animate-pulse text-base text-[#796a70] italic"
            >
              Piper is looking over your week...
            </p>
          )}
        </div>
      </div>

      {summary && summary.items.length > 0 && (
        <ol className="mt-5 space-y-3">
          {summary.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-2xl bg-[#fcf8f7] px-4 py-4 sm:px-5"
            >
              <span className="font-heading flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6f1d37] text-base text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#3b2029]">{item.title}</p>
                <p className="mt-1 text-base text-[#695b60]">{item.detail}</p>
                {item.taskId && (
                  <Link
                    href="/?section=tasks"
                    className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-bold text-[#6f1d37] hover:underline"
                  >
                    Open in checklist
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
