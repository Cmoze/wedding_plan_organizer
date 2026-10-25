"use client";

import { Check, Send, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  FormMessage,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/wedding/ui";
import {
  ACTION_KIND_LABEL,
  applyAssistantAction,
  type AssistantAction,
} from "@/lib/ai/assistant-actions";
import { createClient } from "@/lib/db/supabase/browser";

type ActionItem = {
  action: AssistantAction;
  state: "open" | "saving" | "added" | "dismissed";
};
type Turn = {
  role: "user" | "assistant";
  content: string;
  actions?: ActionItem[];
};

const STARTERS = [
  "What should we do this week?",
  "Who hasn't RSVP'd yet?",
  "How much of our budget is left?",
];

/**
 * Piper the Planner, the site assistant: a floating chat that looks things up in the plan and offers changes as
 * buttons. Accepted changes are saved here with the user's own client, so RLS applies.
 */
export function AssistantChat({ weddingId }: { weddingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns, loading]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const history: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(history);
    setDraft("");
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Piper couldn't answer that.");
      setTurns([
        ...history,
        {
          role: "assistant",
          content: (data.reply as string) || "Here's what I can do:",
          actions: (data.actions as AssistantAction[]).map((action) => ({
            action,
            state: "open",
          })),
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Piper couldn't answer that.",
      );
    } finally {
      setLoading(false);
    }
  }

  const setActionState = (
    turnIndex: number,
    actionIndex: number,
    state: ActionItem["state"],
  ) =>
    setTurns((prev) =>
      prev.map((t, i) =>
        i === turnIndex
          ? {
              ...t,
              actions: t.actions?.map((a, j) =>
                j === actionIndex ? { ...a, state } : a,
              ),
            }
          : t,
      ),
    );

  async function accept(turnIndex: number, actionIndex: number) {
    const item = turns[turnIndex].actions?.[actionIndex];
    if (!item) return;
    setActionState(turnIndex, actionIndex, "saving");
    setError(undefined);
    try {
      await applyAssistantAction(createClient(), weddingId, item.action);
      setActionState(turnIndex, actionIndex, "added");
      startTransition(() => router.refresh());
    } catch (err) {
      setActionState(turnIndex, actionIndex, "open");
      setError(err instanceof Error ? err.message : "Couldn't save that.");
    }
  }

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#6f1d37] py-1.5 pr-5 pl-1.5 text-base font-bold text-white shadow-lg hover:bg-[#4b2734] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c3c58] sm:right-6 sm:bottom-6"
      >
        <PiperAvatar size={44} className="border-2 border-white" />
        Ask Piper
      </button>
    );

  return (
    <section
      aria-label="Chat with Piper the Planner"
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col rounded-t-3xl border border-[#eadfe2] bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[640px] sm:max-h-[calc(100dvh-3rem)] sm:w-[420px] sm:rounded-3xl"
    >
      <header className="flex items-center gap-3 border-b border-[#f0e8ea] px-5 py-4">
        <PiperAvatar size={48} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#35151f]">
            Piper the Planner
          </h2>
          <p className="text-sm text-[#695b60]">
            Your AI wedding planner. Ask about your plan, or ask Piper to do
            something.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Piper"
          className={quietButtonClass}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {turns.length === 0 && (
          <div className="space-y-2">
            <Image
              src="/piper/piper.webp"
              alt="Piper the Planner at a desk with a laptop, thinking about calendars, checklists, rings and flowers"
              width={1308}
              height={1203}
              sizes="240px"
              priority
              className="mx-auto h-auto w-56"
            />
            <p className="pb-2 text-center text-base text-[#35151f]">
              Hi, I&apos;m Piper! I can look things up in your plan and help you
              get things done.
            </p>
            <p className="text-base text-[#695b60]">Try asking:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="block w-full rounded-2xl border border-[#eadfe2] px-4 py-3 text-left text-base font-semibold text-[#6f1d37] hover:bg-[#fbf3f5]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={
              turn.role === "user"
                ? "flex justify-end"
                : "flex items-start gap-2"
            }
          >
            {turn.role === "assistant" && <PiperAvatar size={32} />}
            <div
              className={
                turn.role === "user" ? "contents" : "min-w-0 flex-1 space-y-2"
              }
            >
              <p
                className={`rounded-2xl px-4 py-3 text-base leading-relaxed whitespace-pre-wrap ${
                  turn.role === "user"
                    ? "max-w-[85%] bg-[#6f1d37] text-white"
                    : "bg-[#fbf3f5] text-[#35151f]"
                }`}
              >
                {turn.content}
              </p>
              {turn.actions?.map(
                ({ action, state }, j) =>
                  state !== "dismissed" && (
                    <div
                      key={j}
                      className="rounded-2xl border border-[#eadfe2] p-4"
                    >
                      <p className="text-sm font-bold tracking-[0.1em] text-[#8c3c58] uppercase">
                        {ACTION_KIND_LABEL[action.kind]}
                      </p>
                      <p className="mt-1 text-base font-semibold text-[#35151f]">
                        {action.label}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {state === "added" ? (
                          <p
                            role="status"
                            className="inline-flex min-h-12 items-center text-base font-semibold text-[#24553f]"
                          >
                            <Check
                              className="mr-2 h-5 w-5"
                              aria-hidden="true"
                            />
                            Done
                          </p>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => accept(i, j)}
                              disabled={state === "saving"}
                              className={primaryButtonClass}
                            >
                              {state === "saving" ? "Saving..." : "Yes, do it"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionState(i, j, "dismissed")}
                              disabled={state === "saving"}
                              className={quietButtonClass}
                            >
                              No thanks
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <PiperAvatar size={32} />
            <p
              role="status"
              className="animate-pulse text-base text-[#695b60] italic"
            >
              Piper is looking that up...
            </p>
          </div>
        )}
        <FormMessage error={error} />
        <div ref={bottom} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-[#f0e8ea] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Message Piper
        </label>
        <textarea
          ref={input}
          id="assistant-input"
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder="Ask Piper anything about your wedding"
          className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border border-[#ddcbd1] bg-white px-4 py-3 text-base text-[#35151f] placeholder:text-[#99868d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c3c58]"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          aria-label="Send"
          className={primaryButtonClass}
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

/** Piper's face, cropped from public/piper/piper.webp for small round avatars. */
export function PiperAvatar({
  size,
  className = "",
}: {
  size: number;
  className?: string;
}) {
  return (
    <Image
      src="/piper/piper-face.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-[#f6e9ed] object-cover ${className}`}
    />
  );
}
