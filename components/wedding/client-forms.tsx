"use client";

import { Check, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  addEventAction,
  addGiftAction,
  addGuestAction,
  addIdeaBoardAction,
  addIdeaItemAction,
  addRegistryLinkAction,
  addTaskAction,
  deleteIdeaBoardAction,
  deleteTaskAction,
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
  const notify = useContext(NoticeContext);

  return (
    <form
      action={(form) => {
        const nextStatus = finished ? "todo" : "done";
        const prompt = finished
          ? `Mark “${title}” as not done?`
          : `Mark “${title}” as done?`;
        if (!window.confirm(prompt)) return;
        startTransition(async () => {
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
        });
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={finished ? "todo" : "done"} />
      <button
        type="submit"
        disabled={pending}
        aria-label={
          finished ? `Mark “${title}” as not done` : `Mark “${title}” as done`
        }
        className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 ${
          finished
            ? "border-[#6f1d37] bg-[#6f1d37] text-white"
            : "border-[#d9c4cb] bg-white text-transparent hover:border-[#6f1d37] hover:text-[#cba7b4]"
        }`}
      >
        <Check className="h-6 w-6" aria-hidden="true" />
      </button>
    </form>
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
        label="Invitation"
        hint="Pick someone already on the list to send them one invitation together."
      >
        <select
          name="householdId"
          value={householdId}
          onChange={(e) => setHouseholdId(e.target.value)}
          className={inputClass}
        >
          <option value="">Their own invitation</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              With {h.name}
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
            <Field label="Street address">
              <input
                name="addressLine1"
                autoComplete="off"
                className={inputClass}
                placeholder="418 Maple Ave"
              />
            </Field>
            <Field label="Apt, suite, etc.">
              <input
                name="addressLine2"
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field label="City">
              <input name="city" autoComplete="off" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State">
                <input
                  name="region"
                  autoComplete="off"
                  className={inputClass}
                />
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
