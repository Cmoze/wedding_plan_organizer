"use client";

import { Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useActionState, useEffect, useState } from "react";
import { addChecklistAction, type FormState } from "@/app/actions";
import { formatDate } from "@/components/wedding/format";
import {
  FormMessage,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/wedding/ui";

export type SuggestionGroup = {
  key: string;
  label: string;
  items: { id: string; title: string; category: string }[];
};

/**
 * Pick from the suggested checklist (spec 003). Everything starts unchecked; "Add all in this
 * phase" checks a phase; "Add your own" adds a custom to-do. `mode="setup"` is the step after
 * creating a wedding (pinned footer, Skip goes Home); `mode="panel"` sits on Tasks.
 */
export function SuggestionPicker({
  weddingId,
  groups,
  mode,
}: {
  weddingId: string;
  groups: SuggestionGroup[];
  mode: "setup" | "panel";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addChecklistAction,
    {},
  );
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<{ title: string; due: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [draftDue, setDraftDue] = useState("");

  // After a successful add (panel mode), start fresh. Done while rendering, not in an
  // effect: React's pattern for resetting state when a value changes.
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.message) {
      setPicked(new Set());
      setCustom([]);
    }
  }

  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePhase = (ids: string[]) =>
    setPicked((prev) => {
      const next = new Set(prev);
      const allIn = ids.every((id) => next.has(id));
      for (const id of ids) {
        if (allIn) next.delete(id);
        else next.add(id);
      }
      return next;
    });

  const addOwn = () => {
    const title = draft.trim();
    if (!title) return;
    setCustom((prev) => [...prev, { title, due: draftDue }]);
    setDraft("");
    setDraftDue("");
  };

  const count = picked.size + custom.length;
  const busy = pending || !!state.redirectTo;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="weddingId" value={weddingId} />
      {mode === "setup" && <input type="hidden" name="then" value="home" />}
      {[...picked].map((id) => (
        <input key={id} type="hidden" name="template" value={id} />
      ))}
      {/* Same order in both lists: the action pairs custom[i] with customDue[i]. */}
      {custom.map(({ title, due }, i) => (
        <Fragment key={`${i}-${title}`}>
          <input type="hidden" name="custom" value={title} />
          <input type="hidden" name="customDue" value={due} />
        </Fragment>
      ))}

      <section>
        <h3 className="text-lg font-bold text-[#35151f]">Add your own</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOwn();
              }
            }}
            className={`${inputClass} min-w-0 basis-full`}
            placeholder="Book the cake tasting"
            aria-label="Your own to-do"
          />
          <label className="flex min-w-0 flex-1 items-center gap-2 text-base text-[#695b60]">
            <span className="shrink-0">Due</span>
            <input
              type="date"
              value={draftDue}
              onChange={(e) => setDraftDue(e.target.value)}
              className={`${inputClass} min-w-0`}
              aria-label="Due date for your own to-do (optional)"
            />
          </label>
          <button
            type="button"
            onClick={addOwn}
            className={`${quietButtonClass} shrink-0`}
          >
            <Plus className="h-5 w-5" aria-hidden="true" /> Add
          </button>
        </div>
        {custom.length > 0 && (
          <ul className="mt-3 space-y-2">
            {custom.map(({ title, due }, i) => (
              <li
                key={`${i}-${title}`}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-[#6f1d37] bg-[#f9eef1] px-3"
              >
                <Check className="h-5 w-5 text-[#6f1d37]" aria-hidden="true" />
                <span className="flex-1 text-base">
                  {title}
                  {due && (
                    <span className="block text-sm text-[#695b60]">
                      Due {formatDate(due)}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCustom((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label={`Remove “${title}”`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-[#695b60] hover:bg-white"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {groups.map((group) => {
        const ids = group.items.map((i) => i.id);
        const allIn = ids.every((id) => picked.has(id));
        return (
          <section key={group.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold text-[#35151f]">
                {group.label}
              </h3>
              <button
                type="button"
                onClick={() => togglePhase(ids)}
                className="min-h-11 text-base font-semibold text-[#6f1d37] underline underline-offset-4"
              >
                {allIn ? "Clear this phase" : "Add all in this phase"}
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => {
                const on = picked.has(item.id);
                return (
                  <li key={item.id}>
                    <label
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${
                        on
                          ? "border-[#6f1d37] bg-[#f9eef1]"
                          : "border-[#e6d9dd] bg-white hover:bg-[#fbf5f7]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(item.id)}
                        className="h-5 w-5 accent-[#6f1d37]"
                      />
                      <span className="flex-1 text-base">{item.title}</span>
                      <span className="text-sm text-[#806c74]">
                        {item.category}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div
        className={
          mode === "setup"
            ? "sticky bottom-0 -mx-7 space-y-3 border-t border-[#eadfe2] bg-white px-7 py-4 sm:-mx-9 sm:px-9"
            : "space-y-3"
        }
      >
        <FormMessage error={state.error} message={state.message} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy || count === 0}
            className={`${primaryButtonClass} flex-1`}
          >
            {busy
              ? "Adding..."
              : count === 0
                ? "Pick to-dos to add"
                : `Add ${count} ${count === 1 ? "to-do" : "to-dos"}`}
          </button>
          {mode === "setup" && (
            <Link href="/" className={quietButtonClass}>
              Skip for now
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
