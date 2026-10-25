"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  Card,
  CardTitle,
  Field,
  FormMessage,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import {
  applyEmailSuggestion,
  type EmailSuggestion,
} from "@/lib/ai/suggestions";
import { createClient } from "@/lib/db/supabase/browser";
import { emailHtmlDocument } from "@/lib/email/display";

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
              <SuggestionCard
                key={i}
                suggestion={suggestion}
                state={state}
                onAccept={() => accept(i)}
                onDismiss={() => setState(i, null)}
              />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/** One AI suggestion with "Yes, add it" / "No thanks". `children` goes under the buttons. */
function SuggestionCard({
  suggestion,
  state,
  onAccept,
  onDismiss,
  children,
}: {
  suggestion: EmailSuggestion;
  state: Item["state"];
  onAccept: () => void;
  onDismiss: () => void;
  children?: ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-[#e2e4dc] bg-[#fbfbf8] p-4">
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
              onClick={onAccept}
              disabled={state === "saving"}
              className={primaryButtonClass}
            >
              {state === "saving" ? "Adding..." : "Yes, add it"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={state === "saving"}
              className={quietButtonClass}
            >
              No thanks
            </button>
          </>
        )}
      </div>
      {children}
    </li>
  );
}

type InboxItem = Item & { emailId: string | null };

const QUICK_QUESTIONS = [
  "What payments are coming up?",
  "Did anyone send us a gift?",
  "What do our vendors need from us?",
];

/**
 * "Ask your inbox": one AI read of the newest emails that answers a question and suggests
 * several actions at once. Accepted ones are saved with the user's own client. Couple/planner only.
 */
export function InboxQuery({
  weddingId,
  emailSubjects,
}: {
  weddingId: string;
  /** email id → subject, to show where each suggestion came from. */
  emailSubjects: Record<string, string>;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  async function ask(text: string) {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/ai/inbox-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId, question: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || "The AI helper couldn't read the inbox.");
      setSummary(data.summary as string);
      setItems(
        (
          data.suggestions as {
            emailId: string | null;
            suggestion: EmailSuggestion;
          }[]
        ).map((s) => ({ ...s, state: "open" })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The AI helper couldn't read the inbox.",
      );
    } finally {
      setLoading(false);
    }
  }

  const setState = (index: number, state: Item["state"] | null) =>
    setItems((prev) =>
      state === null
        ? prev.filter((_, i) => i !== index)
        : prev.map((it, i) => (i === index ? { ...it, state } : it)),
    );

  async function accept(index: number) {
    const item = items[index];
    setState(index, "saving");
    setError(undefined);
    try {
      await applyEmailSuggestion(
        createClient(),
        weddingId,
        item.suggestion,
        item.emailId ?? undefined,
      );
      setState(index, "added");
      startTransition(() => router.refresh());
    } catch (err) {
      setState(index, "open");
      setError(err instanceof Error ? err.message : "Couldn't save that.");
    }
  }

  async function acceptAll() {
    for (let i = 0; i < items.length; i++)
      if (items[i].state === "open") await accept(i);
  }

  const openCount = items.filter((it) => it.state === "open").length;

  return (
    <Card>
      <CardTitle>
        <Sparkles
          className="mr-2 inline h-5 w-5 align-[-2px] text-[#785e35]"
          aria-hidden="true"
        />
        Ask your inbox
      </CardTitle>
      <p className="mt-2 text-base text-[#52635a]">
        The helper reads your newest emails together, sums them up and suggests
        what to add to your plan. Nothing is saved until you say yes.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <Field label="Your question (optional)">
          <input
            className={inputClass}
            value={question}
            maxLength={500}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should we do next?"
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            className={primaryButtonClass}
          >
            {loading ? "Reading your emails..." : "Summarize my inbox"}
          </button>
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuestion(q);
                ask(q);
              }}
              className={secondaryButtonClass}
            >
              {q}
            </button>
          ))}
        </div>
      </form>

      <div className="mt-4 space-y-3">
        <FormMessage error={error} />

        {summary !== null && (
          <>
            <p
              aria-live="polite"
              className="rounded-2xl bg-[#f6f7f1] p-4 text-lg leading-relaxed text-[#20352f]"
            >
              {summary}
            </p>

            {items.length === 0 ? (
              <p className="text-base text-[#52635a]">
                Nothing new to add to your plan.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-[#2d4a3f]">
                    {items.length} suggestion{items.length === 1 ? "" : "s"}
                  </p>
                  {openCount > 1 && (
                    <button
                      type="button"
                      onClick={acceptAll}
                      className={secondaryButtonClass}
                    >
                      Add all {openCount}
                    </button>
                  )}
                </div>
                <ul className="space-y-3">
                  {items.map(({ suggestion, state, emailId }, i) => (
                    <SuggestionCard
                      key={i}
                      suggestion={suggestion}
                      state={state}
                      onAccept={() => accept(i)}
                      onDismiss={() => setState(i, null)}
                    >
                      {emailId && emailSubjects[emailId] !== undefined && (
                        <p className="mt-2 text-sm text-[#66756c]">
                          From{" "}
                          <Link
                            href={`/?section=inbox&email=${emailId}`}
                            className="font-semibold text-[#315b4b] underline"
                          >
                            {emailSubjects[emailId] || "(no subject)"}
                          </Link>
                        </p>
                      )}
                    </SuggestionCard>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/**
 * An email's HTML (logos, layout) in a sandboxed frame that grows to fit it. No scripts or forms
 * can run inside; allow-same-origin only lets this page measure the height.
 */
export function EmailHtmlFrame({ html }: { html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      const doc = el.contentDocument;
      if (!doc?.body) return;
      setHeight(Math.max(120, doc.documentElement.scrollHeight));
      observer?.disconnect();
      // Images load after the page, so keep fitting as the email grows.
      observer = new ResizeObserver(() =>
        setHeight(Math.max(120, doc.documentElement.scrollHeight)),
      );
      observer.observe(doc.body);
    };
    el.addEventListener("load", fit);
    fit();
    return () => {
      el.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, [html]);

  return (
    <iframe
      ref={frame}
      title="Email message"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={emailHtmlDocument(html)}
      style={{ height }}
      className="w-full rounded-xl border border-[#eceee8] bg-white"
    />
  );
}
