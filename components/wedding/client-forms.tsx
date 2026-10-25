"use client";

import { Check, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import {
  addEventAction,
  addGiftAction,
  addIdeaBoardAction,
  addIdeaItemAction,
  addRegistryLinkAction,
  deleteIdeaBoardAction,
  finishTaskAction,
  updateMemberRoleAction,
  type FormState,
} from "@/app/actions";
import {
  Field,
  FormMessage,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/wedding/ui";
import { uploadIdeaPhoto } from "@/lib/db/ideas";
import { createClient } from "@/lib/db/supabase/browser";

/** Shows an ISO timestamp in the viewer's own time zone. */
export function LocalTime({
  iso,
  allDay = false,
}: {
  iso: string;
  allDay?: boolean;
}) {
  const date = new Date(iso);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {allDay
        ? "All day"
        : date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
    </time>
  );
}

export function EventForm({ weddingId }: { weddingId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const date = String(form.get("date") ?? "");
        const time = String(form.get("time") ?? "");
        const title = String(form.get("title") ?? "").trim();
        if (!title || !date) return setError("Add a name and a date.");
        // Built in the browser so the time is in the viewer's time zone, not the server's.
        const startsAt = new Date(`${date}T${time || "12:00"}`).toISOString();
        setError(undefined);
        startTransition(async () => {
          try {
            await addEventAction({
              weddingId,
              title,
              startsAt,
              location: String(form.get("location") ?? "").trim(),
              allDay: !time,
            });
            formRef.current?.reset();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Couldn't save the event.",
            );
          }
        });
      }}
    >
      <Field label="Event">
        <input
          name="title"
          required
          className={inputClass}
          placeholder="Cake tasting"
        />
      </Field>
      <Field label="Date">
        <input name="date" type="date" required className={inputClass} />
      </Field>
      <Field label="Time" hint="Leave blank for all day.">
        <input name="time" type="time" className={inputClass} />
      </Field>
      <Field label="Where">
        <input
          name="location"
          className={inputClass}
          placeholder="Sweet Bakery"
        />
      </Field>
      <div className="sm:col-span-2 lg:col-span-4">
        <FormMessage error={error} />
        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} mt-2`}
        >
          {pending ? "Saving..." : "Add event"}
        </button>
      </div>
    </form>
  );
}

export function IdeaItemForm({
  weddingId,
  boardId,
}: {
  weddingId: string;
  boardId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="mt-4 grid gap-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const file = form.get("photo");
        const photo = file instanceof File && file.size > 0 ? file : null;
        const caption = String(form.get("caption") ?? "").trim();
        const linkUrl = String(form.get("linkUrl") ?? "").trim();
        if (!photo && !caption && !linkUrl)
          return setError("Add a photo, a link or a note.");
        setError(undefined);
        startTransition(async () => {
          try {
            const photoPath = photo
              ? await uploadIdeaPhoto(createClient(), weddingId, photo)
              : undefined;
            await addIdeaItemAction({
              weddingId,
              boardId,
              photoPath,
              caption,
              linkUrl,
            });
            formRef.current?.reset();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Couldn't save the idea.",
            );
          }
        });
      }}
    >
      <Field label="Photo">
        <input
          name="photo"
          type="file"
          accept="image/*"
          className={`${inputClass} py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e6eee8] file:px-3 file:py-1.5 file:font-semibold`}
        />
      </Field>
      <Field label="Note">
        <input
          name="caption"
          className={inputClass}
          placeholder="Love these colors"
        />
      </Field>
      <Field label="Link">
        <input
          name="linkUrl"
          type="url"
          className={inputClass}
          placeholder="https://..."
        />
      </Field>
      <div className="sm:col-span-3">
        <FormMessage error={error} />
        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} mt-2`}
        >
          {pending ? "Saving..." : "Add idea"}
        </button>
      </div>
    </form>
  );
}

export function TaskDetailsForm({
  taskId,
  submitLabel,
  defaults,
  totalBudget = false,
}: {
  taskId: string;
  submitLabel: string;
  defaults: { name?: string; cost?: number; link?: string; notes?: string };
  /** For "Set the overall budget": asks only for the total. */
  totalBudget?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    finishTaskAction,
    {},
  );
  return (
    <form action={action} className="mt-3 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="taskId" value={taskId} />
      {!totalBudget && (
        <Field
          label="What did you choose?"
          hint="A venue, a vendor, a store..."
        >
          <input
            name="name"
            defaultValue={defaults.name}
            className={inputClass}
            placeholder="The Grand Barn"
          />
        </Field>
      )}
      <Field
        label={totalBudget ? "Total budget ($)" : "Cost ($)"}
        hint={
          totalBudget
            ? "Your spending is measured against this."
            : "Added to your budget."
        }
      >
        <input
          name="cost"
          inputMode="decimal"
          defaultValue={defaults.cost}
          className={inputClass}
          placeholder={totalBudget ? "30000" : "4500"}
        />
      </Field>
      {!totalBudget && (
        <Field label="Website or link">
          <input
            name="link"
            defaultValue={defaults.link}
            className={inputClass}
            placeholder="grandbarn.com"
          />
        </Field>
      )}
      <Field label="Notes">
        <input
          name="notes"
          defaultValue={defaults.notes}
          className={inputClass}
          placeholder="Deposit due in March"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : submitLabel}
        </button>
        <FormMessage error={state.error} />
      </div>
    </form>
  );
}

const popularStores = [
  "Amazon",
  "Target",
  "Zola",
  "The Knot",
  "Crate & Barrel",
  "Williams Sonoma",
  "Pottery Barn",
  "Bed Bath & Beyond",
  "Honeyfund",
];

/** Keeps what was typed when saving fails; clears it after a save. */
export function RegistryLinkForm({ weddingId }: { weddingId: string }) {
  const empty = { storeName: "", url: "", notes: "" };
  const [values, setValues] = useState(empty);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, form) => {
      const result = await addRegistryLinkAction(prev, form);
      if (!result.error) setValues(empty);
      return result;
    },
    {},
  );
  const field =
    (key: keyof typeof empty) => (e: ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="weddingId" value={weddingId} />
      <Field label="Store" hint="Pick one or type your own.">
        <input
          name="storeName"
          required
          list="registry-stores"
          value={values.storeName}
          onChange={field("storeName")}
          className={inputClass}
          placeholder="Zola"
        />
        <datalist id="registry-stores">
          {popularStores.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>
      <Field label="Registry link" hint="Copy it from the store's website.">
        <input
          name="url"
          required
          inputMode="url"
          value={values.url}
          onChange={field("url")}
          className={inputClass}
          placeholder="zola.com/registry/..."
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes (optional)">
          <input
            name="notes"
            value={values.notes}
            onChange={field("notes")}
            className={inputClass}
            placeholder="Kitchen things and the honeymoon fund"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : "Add registry"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}

/** "Who is it from?" picks a household from the guest list; anyone else is typed in. */
export function GiftForm({
  weddingId,
  today,
  households,
  registries,
}: {
  weddingId: string;
  today: string;
  households: { id: string; name: string }[];
  registries: { id: string; store_name: string }[];
}) {
  const empty = {
    householdId: "",
    giverName: "",
    description: "",
    registryLinkId: "",
    receivedOn: today,
    notes: "",
  };
  const [values, setValues] = useState(empty);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, form) => {
      const result = await addGiftAction(prev, form);
      if (!result.error) setValues(empty);
      return result;
    },
    {},
  );
  const field =
    (key: keyof typeof empty) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="weddingId" value={weddingId} />
      <Field label="Who is it from?">
        <select
          name="householdId"
          value={values.householdId}
          onChange={field("householdId")}
          className={inputClass}
        >
          <option value="">Someone not on the guest list</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </Field>
      {values.householdId === "" && (
        <Field label="Their name">
          <input
            name="giverName"
            required
            value={values.giverName}
            onChange={field("giverName")}
            className={inputClass}
            placeholder="Aunt Rose"
          />
        </Field>
      )}
      <Field label="What did they give?">
        <input
          name="description"
          required
          value={values.description}
          onChange={field("description")}
          className={inputClass}
          placeholder="Stand mixer"
        />
      </Field>
      <Field label="From which registry?">
        <select
          name="registryLinkId"
          value={values.registryLinkId}
          onChange={field("registryLinkId")}
          className={inputClass}
        >
          <option value="">Not from a registry</option>
          {registries.map((r) => (
            <option key={r.id} value={r.id}>
              {r.store_name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date received">
        <input
          name="receivedOn"
          type="date"
          value={values.receivedOn}
          onChange={field("receivedOn")}
          className={inputClass}
        />
      </Field>
      <Field label="Notes (optional)">
        <input
          name="notes"
          value={values.notes}
          onChange={field("notes")}
          className={inputClass}
          placeholder="Mention the card she wrote"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : "Add gift"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}

/** Saves as soon as a new role is picked. */
export function RoleSelect({
  memberId,
  memberName,
  role,
  options,
}: {
  memberId: string;
  memberName: string;
  role: string;
  options: { value: string; label: string }[];
}) {
  // Not a <form>: React resets forms after their action, which would snap the select back.
  const [value, setValue] = useState(role);
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const save = (next: string) => {
    setValue(next);
    startTransition(async () => {
      const form = new FormData();
      form.set("memberId", memberId);
      form.set("role", next);
      const result = await updateMemberRoleAction({}, form);
      setState(result);
      if (result.error) setValue(role);
    });
  };
  const id = `role-${memberId}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={id}>
        Role for {memberName}
      </label>
      <select
        id={id}
        value={value}
        aria-busy={pending}
        onChange={(e) => save(e.target.value)}
        className={`${inputClass} w-auto`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span role="status" className="min-w-16 text-base">
        {pending ? (
          <span className="inline-flex items-center gap-1.5 text-[#52635a]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving...
          </span>
        ) : state.error ? (
          <span className="text-[#8a3f1d]">{state.error}</span>
        ) : state.message ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#24553f]">
            <Check className="h-4 w-4" aria-hidden="true" />
            {state.message}
          </span>
        ) : null}
      </span>
    </div>
  );
}

const atLeast = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function IdeaBoardForm({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, form) =>
      (await Promise.all([addIdeaBoardAction(prev, form), atLeast(600)]))[0],
    {},
  );
  return (
    <form action={action} className="mt-4 space-y-4">
      <input type="hidden" name="weddingId" value={weddingId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Board name">
          <input
            name="title"
            required
            className={inputClass}
            placeholder="Table settings"
          />
        </Field>
        <Field label="Category">
          <input name="category" className={inputClass} placeholder="Decor" />
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className={`${primaryButtonClass} gap-2`}
          >
            {pending && (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            )}
            {pending ? "Creating..." : "Create board"}
          </button>
        </div>
      </div>
      {!pending && state.error && <FormMessage error={state.error} />}
      {!pending && state.message && state.id && (
        <p
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-[#e3efe6] px-4 py-3 text-base text-[#24553f]"
        >
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Check className="h-5 w-5" aria-hidden="true" />
            {state.message}
          </span>
          <Link
            href={`/?section=ideas&board=${state.id}`}
            className="font-semibold underline underline-offset-4"
          >
            Open it
          </Link>
        </p>
      )}
    </form>
  );
}

export function DeleteIdeaBoardButton({
  boardId,
  title,
  ideaCount,
  className,
}: {
  boardId: string;
  title: string;
  ideaCount: number;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const ideas =
    ideaCount === 0
      ? ""
      : ` and its ${ideaCount} ${ideaCount === 1 ? "idea" : "ideas"}`;
  return (
    <form
      className={className}
      action={(form) => {
        if (!window.confirm(`Delete "${title}"${ideas}? This can't be undone.`))
          return;
        startTransition(() => deleteIdeaBoardAction(form));
      }}
    >
      <input type="hidden" name="boardId" value={boardId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Delete board "${title}"`}
        className={quietButtonClass}
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
