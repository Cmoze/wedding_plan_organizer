"use client";

import {
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Minus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  addEventAction,
  addFamilyAction,
  addGiftAction,
  addGuestAction,
  addIdeaBoardAction,
  addIdeaItemAction,
  addRegistryLinkAction,
  addTaskAction,
  deleteIdeaBoardAction,
  deleteTaskAction,
  deleteWeddingAction,
  setTaskStatusAction,
  setTaskDueDateAction,
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
import {
  familyName,
  listFirstNames,
  MAX_FAMILY_SIZE,
  placeholderName,
  sharedLastName,
} from "@/lib/db/household-form";
import { uploadIdeaPhoto } from "@/lib/db/ideas";
import { createClient } from "@/lib/db/supabase/browser";
import { formatTimeInZone } from "@/lib/time-zone";

/**
 * Shows an ISO timestamp's time in the viewer's time zone (`ctx.timeZone`). The zone is
 * passed in, not read from the browser, so the server and browser render the same text;
 * formatting on the server without it showed UTC times.
 */
export function LocalTime({
  iso,
  timeZone,
  allDay = false,
  short = false,
}: {
  iso: string;
  timeZone: string;
  allDay?: boolean;
  /** "2p" / "2:30p", for month-grid chips. Nothing for all-day events. */
  short?: boolean;
}) {
  if (short) {
    if (allDay) return null;
    return (
      <time
        dateTime={iso}
      >{`${formatTimeInZone(iso, timeZone, { short: true })} `}</time>
    );
  }
  return (
    <time dateTime={iso}>
      {allDay ? "All day" : formatTimeInZone(iso, timeZone)}
    </time>
  );
}

export function EventForm({
  weddingId,
  defaultDate,
}: {
  weddingId: string;
  /** `YYYY-MM-DD` */
  defaultDate?: string;
}) {
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
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultDate}
          className={inputClass}
        />
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
          className={`${inputClass} py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-[#f4e7eb] file:px-3 file:py-1.5 file:font-semibold`}
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
          <span className="inline-flex items-center gap-1.5 text-[#695b60]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving...
          </span>
        ) : state.error ? (
          <span className="text-[#8a3f1d]">{state.error}</span>
        ) : state.message ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#6f1d37]">
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
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-[#f4e7eb] px-4 py-3 text-base text-[#6f1d37]"
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

export function TaskForm({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, form) =>
      (await Promise.all([addTaskAction(prev, form), atLeast(600)]))[0],
    {},
  );
  return (
    <form action={action} className="mt-4 space-y-4">
      <input type="hidden" name="weddingId" value={weddingId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <Field label="What needs doing?">
          <input
            name="title"
            required
            className={inputClass}
            placeholder="Order favors"
          />
        </Field>
        <Field label="Due date">
          <input name="dueDate" type="date" className={inputClass} />
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
            {pending ? "Adding..." : "Add task"}
          </button>
        </div>
      </div>
      {!pending && state.error && <FormMessage error={state.error} />}
      {!pending && state.message && <SuccessMessage text={state.message} />}
    </form>
  );
}

/** Changes a task's due date as soon as a new day is picked. Clearing it leaves the task undated. */
export function TaskDueDate({
  taskId,
  dueDate,
}: {
  taskId: string;
  /** `YYYY-MM-DD`, or null when the task has no date. */
  dueDate: string | null;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(form) => startTransition(() => setTaskDueDateAction(form))}
      className="inline-flex items-center gap-2"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <label className="inline-flex items-center gap-2 text-base text-[#695b60]">
        Due
        <input
          key={dueDate ?? "none"}
          name="dueDate"
          type="date"
          defaultValue={dueDate ?? ""}
          aria-label="Due date"
          disabled={pending}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="min-h-11 rounded-xl border border-[#ddcbd1] bg-white px-3 text-base text-[#35151f]"
        />
      </label>
      {pending && (
        <Loader2
          className="h-5 w-5 animate-spin text-[#6f1d37]"
          aria-label="Saving"
        />
      )}
    </form>
  );
}

function SuccessMessage({ text }: { text: string }) {
  return (
    <p
      role="status"
      className="flex items-center gap-1.5 rounded-xl bg-[#e3efe6] px-4 py-3 text-base font-semibold text-[#24553f]"
    >
      <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
      {text}
    </p>
  );
}

type Notice = { text: string; error?: boolean };

const NoticeContext = createContext<(notice: Notice) => void>(() => {});

/** Shows short notices at the bottom of the screen, for actions whose row disappears (like deleting). */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice & { key: number }>();
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(undefined), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <NoticeContext value={(n) => setNotice({ ...n, key: Date.now() })}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {notice && (
          <p
            key={notice.key}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl px-5 py-3 text-base font-semibold shadow-lg ${
              notice.error
                ? "bg-[#fbeae5] text-[#8e3f1e]"
                : "bg-[#24553f] text-white"
            }`}
          >
            {!notice.error && (
              <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            {notice.text}
          </p>
        )}
      </div>
    </NoticeContext>
  );
}

/**
 * The checkbox a viewer sees on a task they can't update (a helper, on someone else's
 * task). Looks disabled and says why on hover, tap, or focus, so "not mine" doesn't look
 * like "broken".
 */
export function LockedTaskCheckbox({
  title,
  finished,
  reason,
}: {
  title: string;
  finished: boolean;
  reason: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button
        type="button"
        role="checkbox"
        aria-checked={finished}
        aria-disabled="true"
        aria-label={`“${title}” is ${finished ? "done" : "not done"}. ${reason}`}
        title={reason}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className={`flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl border-2 border-dashed ${
          finished
            ? "border-[#cbb9c0] bg-[#e6dade] text-white"
            : "border-[#e1d5d9] bg-[#f6f1f2] text-transparent"
        }`}
      >
        <Check className="h-6 w-6" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="status"
          className="absolute top-12 left-0 z-10 w-64 rounded-xl border border-[#eadfe2] bg-white p-3 text-sm leading-5 text-[#4b2734] shadow-lg"
        >
          {reason}
        </span>
      )}
    </span>
  );
}

export function TaskStatusButton({
  taskId,
  title,
  finished,
}: {
  taskId: string;
  title: string;
  finished: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const notify = useContext(NoticeContext);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const nextStatus = finished ? "todo" : "done";
  // Show the new state as soon as the change is confirmed, and hold it until the
  // refreshed page arrives (or snap back if the save fails). Without this the "Task
  // checked off." notice appeared while the box was still empty for about a second
  // (spec 002 row 2).
  const [shownFinished, setShownFinished] = useOptimistic(finished);

  useEffect(() => {
    if (confirmOpen) confirmButtonRef.current?.focus();
  }, [confirmOpen]);

  function confirmChange() {
    const form = new FormData();
    form.set("taskId", taskId);
    form.set("status", nextStatus);
    setConfirmOpen(false);
    startTransition(async () => {
      setShownFinished(!finished);
      try {
        const result = await setTaskStatusAction(form);
        notify(
          result.error
            ? { text: result.error, error: true }
            : {
                text:
                  result.message ??
                  (nextStatus === "done"
                    ? "Task checked off."
                    : "Task reopened."),
              },
        );
      } catch (err) {
        notify({
          text:
            err instanceof Error ? err.message : "Couldn't update the task.",
          error: true,
        });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        role="checkbox"
        aria-checked={shownFinished}
        aria-busy={pending}
        aria-label={
          shownFinished
            ? `Mark “${title}” as not done`
            : `Mark “${title}” as done`
        }
        onClick={() => setConfirmOpen(true)}
        className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 ${
          shownFinished
            ? "border-[#6f1d37] bg-[#6f1d37] text-white"
            : "border-[#d9c4cb] bg-white text-transparent hover:border-[#6f1d37] hover:text-[#cba7b4]"
        }`}
      >
        <Check className="h-6 w-6" aria-hidden="true" />
      </button>
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#24151b]/55 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`task-confirm-title-${taskId}`}
            aria-describedby={`task-confirm-description-${taskId}`}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2
              id={`task-confirm-title-${taskId}`}
              className="font-heading text-2xl text-[#35151f]"
            >
              {finished ? "Reopen this task?" : "Check off this task?"}
            </h2>
            <p
              id={`task-confirm-description-${taskId}`}
              className="mt-3 text-base leading-7 text-[#695b60]"
            >
              {finished
                ? `Mark “${title}” as not done?`
                : `Are you sure “${title}” is complete?`}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
                className={quietButtonClass}
              >
                Cancel
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                disabled={pending}
                onClick={confirmChange}
                className={primaryButtonClass}
              >
                {pending
                  ? "Saving..."
                  : finished
                    ? "Yes, reopen task"
                    : "Yes, check it off"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function DeleteTaskButton({
  taskId,
  title,
}: {
  taskId: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  const notify = useContext(NoticeContext);
  return (
    <form
      action={(form) => {
        if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
        startTransition(async () => {
          const [result] = await Promise.all([
            deleteTaskAction(form),
            atLeast(600),
          ]);
          notify(
            result.error
              ? { text: result.error, error: true }
              : { text: `Deleted "${title}".` },
          );
        });
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Delete "${title}"`}
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

export function DeleteWeddingButton({
  weddingId,
  title,
}: {
  weddingId: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");
  const ready = confirmText.trim() === title;
  return (
    <form
      action={(form) => {
        if (!ready) return;
        if (
          !window.confirm(
            `Delete ${title}'s wedding and everything in it — guests, budget, tasks, the inbox, all of it? This can't be undone.`,
          )
        )
          return;
        startTransition(() => {
          deleteWeddingAction(form);
        });
      }}
      className="space-y-3"
    >
      <input type="hidden" name="weddingId" value={weddingId} />
      <label className="block text-sm font-semibold text-[#6b4a3a]">
        Type &quot;{title}&quot; to confirm
        <input
          className={`${inputClass} mt-1`}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={title}
          autoComplete="off"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !ready}
        className={quietButtonClass}
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          "Delete this wedding"
        )}
      </button>
    </form>
  );
}

type GuestSide = "partner1" | "partner2" | "both";

export function GuestForm({
  weddingId,
  households,
  sideLabel,
}: {
  weddingId: string;
  households: { id: string; name: string }[];
  sideLabel: Record<GuestSide, string>;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, form) =>
      (await Promise.all([addGuestAction(prev, form), atLeast(600)]))[0],
    {},
  );
  const [householdId, setHouseholdId] = useState("");
  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="weddingId" value={weddingId} />
      <Field label="First name">
        <input
          name="firstName"
          required
          autoComplete="off"
          className={inputClass}
          placeholder="Maya"
        />
      </Field>
      <Field label="Last name">
        <input
          name="lastName"
          autoComplete="off"
          className={inputClass}
          placeholder="Lopez"
        />
      </Field>
      <Field label="Email" hint="Optional.">
        <input
          name="email"
          type="email"
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      <Field label="Phone" hint="Optional.">
        <input
          name="phone"
          type="tel"
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      <Field
        label="Household"
        hint="Adding someone to a family or couple already on the list sends them one invitation together, instead of their own."
      >
        <select
          name="householdId"
          value={householdId}
          onChange={(e) => setHouseholdId(e.target.value)}
          className={inputClass}
        >
          <option value="">A new household, just for them</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              Add to {h.name}&apos;s household
            </option>
          ))}
        </select>
      </Field>
      {householdId === "" && (
        <>
          <Field label="Whose side?">
            <select name="side" defaultValue="both" className={inputClass}>
              {(["partner1", "partner2", "both"] as const).map((s) => (
                <option key={s} value={s}>
                  {sideLabel[s]}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <legend className="mb-1 text-base font-semibold text-[#2d4a3f]">
              Mailing address{" "}
              <span className="font-normal text-[#66756c]">
                (optional, for sending the invitation)
              </span>
            </legend>
            <MailingAddressFields />
          </fieldset>
        </>
      )}
      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <Checkbox name="plusOne" label="Can bring a plus-one" />
      </div>
      <div className="space-y-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} gap-2`}
        >
          {pending && (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          )}
          {pending ? "Adding..." : "Add guest"}
        </button>
        {!pending && state.error && <FormMessage error={state.error} />}
        {!pending && state.message && (
          <p
            role="status"
            className="flex items-center gap-1.5 rounded-xl bg-[#f4e7eb] px-4 py-3 text-base font-semibold text-[#6f1d37]"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-base font-semibold text-[#4b2734]">
      <input type="checkbox" name={name} className="h-5 w-5 accent-[#6f1d37]" />
      {label}
    </label>
  );
}

/** Street, apt, city, state, ZIP: the household's envelope address. */
function MailingAddressFields() {
  return (
    <>
      <Field label="Street address">
        <input
          name="addressLine1"
          autoComplete="off"
          className={inputClass}
          placeholder="418 Maple Ave"
        />
      </Field>
      <Field label="Apt, suite, etc.">
        <input name="addressLine2" autoComplete="off" className={inputClass} />
      </Field>
      <Field label="City">
        <input name="city" autoComplete="off" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="State">
          <input name="region" autoComplete="off" className={inputClass} />
        </Field>
        <Field label="ZIP code">
          <input
            name="postalCode"
            autoComplete="off"
            inputMode="numeric"
            className={inputClass}
          />
        </Field>
      </div>
    </>
  );
}

/**
 * The "Add guests" card's body: a switch between one person (`GuestForm`) and a family or
 * group (`FamilyForm`), so "how do I add a family?" has a visible answer (spec 002 row 8).
 */
export function AddGuests({
  weddingId,
  households,
  sideLabel,
}: {
  weddingId: string;
  households: { id: string; name: string }[];
  sideLabel: Record<GuestSide, string>;
}) {
  const [kind, setKind] = useState<"one" | "family">("one");
  const tab = (value: "one" | "family", label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={kind === value}
      onClick={() => setKind(value)}
      className={`min-h-11 rounded-lg px-4 text-base font-semibold ${
        kind === value ? "bg-[#6f1d37] text-white" : "text-[#6f1d37]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <>
      <div
        role="radiogroup"
        aria-label="Who are you adding?"
        className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-[#f4e7eb] p-1"
      >
        {tab("one", "One person")}
        {tab("family", "A family or group")}
      </div>
      {kind === "one" ? (
        <GuestForm
          weddingId={weddingId}
          households={households}
          sideLabel={sideLabel}
        />
      ) : (
        <FamilyForm weddingId={weddingId} sideLabel={sideLabel} />
      )}
    </>
  );
}

type FamilyRow = { first: string; last: string };
const emptyRows = (): FamilyRow[] => [
  { first: "", last: "" },
  { first: "", last: "" },
];

/** Several people on one invitation: typed names, or a name plus how many others. */
function FamilyForm({
  weddingId,
  sideLabel,
}: {
  weddingId: string;
  sideLabel: Record<GuestSide, string>;
}) {
  const [mode, setMode] = useState<"names" | "count">("names");
  const [rows, setRows] = useState<FamilyRow[]>(emptyRows);
  const [others, setOthers] = useState(1);
  const [customName, setCustomName] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, form) => {
      const [result] = await Promise.all([
        addFamilyAction(prev, form),
        atLeast(600),
      ]);
      if (!result.error) {
        setRows(emptyRows());
        setOthers(1);
        setCustomName(null);
        setMode("names");
        setFormKey((k) => k + 1);
      }
      return result;
    },
    {},
  );

  const typed = (mode === "names" ? rows : rows.slice(0, 1))
    .filter((r) => r.first.trim())
    .map((r) => ({ first_name: r.first.trim(), last_name: r.last.trim() }));
  const autoName = familyName(typed);
  const name = customName ?? autoName;
  const people =
    mode === "names" ? typed.length : (typed.length > 0 ? 1 : 0) + others;
  const shared = sharedLastName(typed);
  const firstName = rows[0].first.trim();

  const setRow = (i: number, patch: Partial<FamilyRow>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((prev) =>
      prev.length >= MAX_FAMILY_SIZE
        ? prev
        : [...prev, { first: "", last: prev[prev.length - 1]?.last ?? "" }],
    );

  return (
    <form key={formKey} action={action} className="mt-5 grid gap-5">
      <input type="hidden" name="weddingId" value={weddingId} />
      <input type="hidden" name="mode" value={mode} />
      {customName !== null && (
        <input type="hidden" name="householdName" value={customName} />
      )}
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start">
        <div>
          {mode === "names" ? (
            <fieldset>
              <legend className="mb-2 text-base font-semibold text-[#4b2734]">
                Who&apos;s in it?
              </legend>
              <div className="grid gap-2">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2"
                  >
                    <input
                      name="firstName"
                      value={row.first}
                      onChange={(e) => setRow(i, { first: e.target.value })}
                      required={i === 0}
                      autoComplete="off"
                      aria-label={`Person ${i + 1}: first name`}
                      placeholder={i === 0 ? "Maria" : "First name"}
                      className={inputClass}
                    />
                    <input
                      name="lastName"
                      value={row.last}
                      onChange={(e) => setRow(i, { last: e.target.value })}
                      autoComplete="off"
                      aria-label={`Person ${i + 1}: last name`}
                      placeholder={i === 0 ? "Lopez" : "Last name"}
                      className={inputClass}
                    />
                    {i > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setRows((prev) => prev.filter((_, j) => j !== i))
                        }
                        aria-label={`Remove person ${i + 1}`}
                        className={quietButtonClass}
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-sm text-[#806c74]">
                The first person&apos;s name is required. Last names carry down.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#ddcbd1] bg-white px-3 text-base font-semibold text-[#6f1d37] hover:bg-[#fbf3f5]"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  Add another person
                </button>
                <button
                  type="button"
                  onClick={() => setMode("count")}
                  className="min-h-11 text-base font-semibold text-[#6f1d37] underline underline-offset-4"
                >
                  Don&apos;t know everyone&apos;s names yet?
                </button>
              </div>
            </fieldset>
          ) : (
            <fieldset>
              <legend className="mb-2 text-base font-semibold text-[#4b2734]">
                Who&apos;s the main contact?
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="firstName"
                  value={rows[0].first}
                  onChange={(e) => setRow(0, { first: e.target.value })}
                  required
                  autoComplete="off"
                  aria-label="First name"
                  placeholder="Maria"
                  className={inputClass}
                />
                <input
                  name="lastName"
                  value={rows[0].last}
                  onChange={(e) => setRow(0, { last: e.target.value })}
                  autoComplete="off"
                  aria-label="Last name"
                  placeholder="Lopez"
                  className={inputClass}
                />
              </div>
              <p
                id="family-others-label"
                className="mt-4 mb-2 text-base font-semibold text-[#4b2734]"
              >
                How many others are coming with {firstName || "them"}?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOthers((n) => Math.max(1, n - 1))}
                  aria-label="Fewer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#ddcbd1] bg-white text-[#6f1d37]"
                >
                  <Minus className="h-5 w-5" aria-hidden="true" />
                </button>
                <input
                  name="others"
                  type="number"
                  min={1}
                  max={MAX_FAMILY_SIZE - 1}
                  value={others}
                  onChange={(e) =>
                    setOthers(
                      Math.min(
                        MAX_FAMILY_SIZE - 1,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    )
                  }
                  aria-labelledby="family-others-label"
                  className={`${inputClass} w-20! text-center font-semibold`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setOthers((n) => Math.min(MAX_FAMILY_SIZE - 1, n + 1))
                  }
                  aria-label="More"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#ddcbd1] bg-white text-[#6f1d37]"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-sm text-[#806c74]">
                They&apos;ll show as &ldquo;
                {placeholderName(rows[0].last, 2)}
                {others > 1 ? ` to ${others + 1}` : ""}&rdquo; until you add
                their names.
              </p>
              <button
                type="button"
                onClick={() => setMode("names")}
                className="mt-2 min-h-11 text-base font-semibold text-[#6f1d37] underline underline-offset-4"
              >
                Type their names instead
              </button>
            </fieldset>
          )}
        </div>

        <FamilyEnvelope
          name={name}
          names={
            mode === "names"
              ? listFirstNames(typed.map((t) => t.first_name))
              : `${firstName || "Someone"} and ${others} ${others === 1 ? "other" : "others"}`
          }
          people={people}
          customName={customName}
          onRename={(value) => setCustomName(value)}
          autoName={autoName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Whose side?">
          <select name="side" defaultValue="both" className={inputClass}>
            {(["partner1", "partner2", "both"] as const).map((s) => (
              <option key={s} value={s}>
                {sideLabel[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-base font-semibold text-[#6f1d37]">
          <ChevronDown
            className="h-5 w-5 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
          Mailing address{" "}
          <span className="font-normal text-[#806c74]">(optional)</span>
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <MailingAddressFields />
        </div>
      </details>

      <div className="space-y-4">
        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} gap-2`}
        >
          {pending && (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          )}
          {pending
            ? "Adding..."
            : shared
              ? `Add the ${shared} family`
              : `Add ${people} ${people === 1 ? "person" : "people"}`}
        </button>
        {!pending && state.error && <FormMessage error={state.error} />}
        {!pending && state.message && (
          <p
            role="status"
            className="flex items-center gap-1.5 rounded-xl bg-[#f4e7eb] px-4 py-3 text-base font-semibold text-[#6f1d37]"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

/** The envelope preview beside the family form: the name that will be saved, and who's on it. */
function FamilyEnvelope({
  name,
  names,
  people,
  customName,
  autoName,
  onRename,
}: {
  name: string;
  names: string;
  people: number;
  customName: string | null;
  autoName: string;
  onRename: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div
      aria-live="polite"
      className="rounded-2xl border border-dashed border-[#d9c4cb] bg-[#fffaf8] px-4 py-5 text-center"
    >
      <Mail className="mx-auto h-6 w-6 text-[#6f1d37]" aria-hidden="true" />
      {editing ? (
        <div className="mt-2 grid gap-2">
          <input
            value={customName ?? autoName}
            onChange={(e) => onRename(e.target.value)}
            aria-label="Name on the invitation"
            className={inputClass}
            autoFocus
          />
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-11 text-base font-semibold text-[#6f1d37] underline underline-offset-4"
            >
              Done
            </button>
            {customName !== null && (
              <button
                type="button"
                onClick={() => {
                  onRename(null);
                  setEditing(false);
                }}
                className="min-h-11 text-base font-semibold text-[#6f1d37] underline underline-offset-4"
              >
                Use the automatic name
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="font-heading mt-2 text-xl text-[#35151f]">
            {name || "Your family or group"}
          </p>
          {names && <p className="text-sm text-[#695b60]">{names}</p>}
          <p className="mt-1 text-sm text-[#806c74]">
            {people} {people === 1 ? "person" : "people"} · 1 invitation
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 min-h-11 text-sm font-semibold text-[#6f1d37] underline underline-offset-4"
          >
            Edit name
          </button>
        </>
      )}
    </div>
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
