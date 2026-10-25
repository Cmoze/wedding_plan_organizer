"use client";

import {
  useActionState,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import {
  updateBudgetItemAction,
  updateEventAction,
  updateTaskAction,
  type FormState,
} from "@/app/actions";
import type { CalendarItem } from "@/lib/db/calendar";
import type { BudgetItem } from "@/lib/db/budget";
import type { Task } from "@/lib/db/tasks";
import {
  Field,
  FormMessage,
  inputClass,
  primaryButtonClass,
} from "@/components/wedding/ui";

export function EditTaskForm({
  task,
  members,
}: {
  task: Task;
  members: { id: string; display_name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateTaskAction,
    {},
  );

  return (
    <form action={action} className="mt-3 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="taskId" value={task.id} />
      <Field label="Task name">
        <input
          name="title"
          required
          defaultValue={task.title}
          className={inputClass}
        />
      </Field>
      <Field label="Category">
        <input
          name="category"
          defaultValue={task.category ?? ""}
          className={inputClass}
          placeholder="Venue"
        />
      </Field>
      <Field label="Due date">
        <input
          name="dueDate"
          type="date"
          defaultValue={task.due_date ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Assigned to">
        <select
          name="assigneeId"
          defaultValue={task.assignee_id ?? ""}
          className={inputClass}
        >
          <option value="">No one</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.display_name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <input
          name="notes"
          defaultValue={task.notes ?? ""}
          className={inputClass}
          placeholder="Add a helpful note"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : "Save task"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}

export function EditBudgetItemForm({ item }: { item: BudgetItem }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateBudgetItemAction,
    {},
  );

  return (
    <form action={action} className="mt-3 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="itemId" value={item.id} />
      <Field label="Category">
        <input
          name="category"
          required
          defaultValue={item.category}
          className={inputClass}
        />
      </Field>
      <Field label="What is it?">
        <input
          name="description"
          defaultValue={item.description}
          className={inputClass}
        />
      </Field>
      <Field label="Estimated cost ($)">
        <input
          name="estimated"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={item.estimated}
          className={inputClass}
        />
      </Field>
      <Field label="Actual cost ($)">
        <input
          name="actual"
          type="number"
          min="0"
          step="0.01"
          defaultValue={item.actual ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Amount paid ($)">
        <input
          name="paid"
          type="number"
          min="0"
          step="0.01"
          defaultValue={item.paid}
          className={inputClass}
        />
      </Field>
      <Field label="Payment due">
        <input
          name="dueDate"
          type="date"
          defaultValue={item.due_date ?? ""}
          className={inputClass}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : "Save expense"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}

export function EditCalendarEventForm({ event }: { event: CalendarItem }) {
  const subscribe = () => () => {};
  const date = useSyncExternalStore(
    subscribe,
    () => {
      const startsAt = new Date(event.start);
      return `${startsAt.getFullYear()}-${String(startsAt.getMonth() + 1).padStart(2, "0")}-${String(startsAt.getDate()).padStart(2, "0")}`;
    },
    () => event.start.slice(0, 10),
  );
  const time = useSyncExternalStore(
    subscribe,
    () => {
      if (event.allDay) return "";
      const startsAt = new Date(event.start);
      return `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}`;
    },
    () => (event.allDay ? "" : event.start.slice(11, 16)),
  );
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const [editedDate, setEditedDate] = useState<string>();
  const [editedTime, setEditedTime] = useState<string>();
  const selectedDate = editedDate ?? date;
  const selectedTime = editedTime ?? time;

  return (
    <form
      className="mt-3 grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const title = String(form.get("title") ?? "").trim();
        if (!title || !selectedDate) {
          setState({ error: "Add an event name and date." });
          return;
        }
        setState({});
        startTransition(async () => {
          const result = await updateEventAction({
            eventId: event.id,
            title,
            startsAt: new Date(
              `${selectedDate}T${selectedTime || "12:00"}`,
            ).toISOString(),
            location: String(form.get("location") ?? ""),
            allDay: !selectedTime,
          });
          setState(result);
        });
      }}
    >
      <Field label="Event">
        <input
          name="title"
          required
          defaultValue={event.title}
          className={inputClass}
        />
      </Field>
      <Field label="Date">
        <input
          name="date"
          type="date"
          required
          value={selectedDate}
          onChange={(e) => setEditedDate(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Time" hint="Leave blank for all day.">
        <input
          name="time"
          type="time"
          value={selectedTime}
          onChange={(e) => setEditedTime(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Where">
        <input
          name="location"
          defaultValue={event.location ?? ""}
          className={inputClass}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : "Save event"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}
