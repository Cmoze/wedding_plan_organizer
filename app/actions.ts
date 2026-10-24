"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, signIn, signOut, signUp } from "@/lib/db/auth";
import {
  createBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
} from "@/lib/db/budget";
import { addComment } from "@/lib/db/comments";
import { deleteEmail } from "@/lib/db/emails";
import { createEvent, deleteEvent } from "@/lib/db/events";
import {
  addReaction,
  createIdeaBoard,
  createIdeaItem,
  deleteIdeaItem,
  removeReaction,
} from "@/lib/db/ideas";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import {
  createTask,
  deleteTask,
  updateTaskStatus,
  type TaskStatus,
} from "@/lib/db/tasks";
import { createWedding } from "@/lib/db/weddings";

// Every action runs as the signed-in user, so RLS decides what they may change.

export type FormState = {
  error?: string;
  message?: string;
  /** Where the form should send the browser with a full page load. */
  redirectTo?: string;
};

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
};

const money = (form: FormData, key: string) => {
  const value = text(form, key);
  if (value === undefined) return undefined;
  const n = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const required = (form: FormData, key: string) => {
  const value = text(form, key);
  if (!value) throw new DbError(`Missing ${key}`);
  return value;
};

async function signedInDb() {
  const db = await createClient();
  if (!(await getCurrentUser(db))) redirect("/login");
  return db;
}

const friendly = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

/** Pages the browser cached for the previous user (or before a wedding existed) must not be reused. */
const forgetCachedPages = () => revalidatePath("/", "layout");

// account ---------------------------------------------------------------------

export async function signInAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const email = text(form, "email");
  const password = text(form, "password");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    await signIn(await createClient(), { email, password });
  } catch (e) {
    return { error: friendly(e) };
  }
  forgetCachedPages();
  redirect("/");
}

export async function signUpAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const email = text(form, "email");
  const password = text(form, "password");
  const displayName = text(form, "displayName");
  if (!email || !password) return { error: "Enter your email and a password." };
  if (password.length < 6)
    return { error: "Use a password of at least 6 characters." };
  let needsEmailConfirmation = false;
  try {
    ({ needsEmailConfirmation } = await signUp(await createClient(), {
      email,
      password,
      displayName,
    }));
  } catch (e) {
    return { error: friendly(e) };
  }
  if (needsEmailConfirmation) {
    return {
      message:
        "Check your email for a link to confirm your account, then log in.",
    };
  }
  forgetCachedPages();
  redirect("/new-wedding");
}

export async function signOutAction() {
  await signOut(await createClient());
  forgetCachedPages();
  redirect("/login");
}

export async function createWeddingAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const db = await signedInDb();
  const partner1Name = text(form, "partner1Name");
  if (!partner1Name) return { error: "Enter at least one name." };
  try {
    await createWedding(db, {
      partner1Name,
      partner2Name: text(form, "partner2Name"),
      weddingDate: text(form, "weddingDate"),
      budgetTotal: money(form, "budgetTotal"),
      guestCountEstimate: money(form, "guestCount"),
      displayName: text(form, "displayName"),
    });
  } catch (e) {
    return { error: friendly(e) };
  }
  return { redirectTo: "/?section=tasks" };
}

// checklist -------------------------------------------------------------------

export async function setTaskStatusAction(form: FormData) {
  const db = await signedInDb();
  await updateTaskStatus(
    db,
    required(form, "taskId"),
    required(form, "status") as TaskStatus,
  );
  refresh();
}

export async function addTaskAction(form: FormData) {
  const db = await signedInDb();
  await createTask(db, required(form, "weddingId"), {
    title: required(form, "title"),
    due_date: text(form, "dueDate") ?? null,
    category: text(form, "category") ?? null,
  });
  refresh();
}

export async function deleteTaskAction(form: FormData) {
  const db = await signedInDb();
  await deleteTask(db, required(form, "taskId"));
  refresh();
}

// budget ----------------------------------------------------------------------

export async function addBudgetItemAction(form: FormData) {
  const db = await signedInDb();
  await createBudgetItem(db, required(form, "weddingId"), {
    category: required(form, "category"),
    description: text(form, "description") ?? "",
    estimated: money(form, "estimated") ?? 0,
    actual: money(form, "actual") ?? null,
    due_date: text(form, "dueDate") ?? null,
  });
  refresh();
}

export async function markBudgetItemPaidAction(form: FormData) {
  const db = await signedInDb();
  await updateBudgetItem(db, required(form, "itemId"), {
    paid: money(form, "amount") ?? 0,
  });
  refresh();
}

export async function deleteBudgetItemAction(form: FormData) {
  const db = await signedInDb();
  await deleteBudgetItem(db, required(form, "itemId"));
  refresh();
}

// calendar --------------------------------------------------------------------

export async function addEventAction(input: {
  weddingId: string;
  title: string;
  startsAt: string;
  location?: string;
  allDay: boolean;
}) {
  const db = await signedInDb();
  await createEvent(db, input.weddingId, {
    title: input.title,
    starts_at: input.startsAt,
    location: input.location || null,
    all_day: input.allDay,
  });
  refresh();
}

export async function deleteEventAction(form: FormData) {
  const db = await signedInDb();
  await deleteEvent(db, required(form, "eventId"));
  refresh();
}

// ideas -----------------------------------------------------------------------

export async function addIdeaBoardAction(form: FormData) {
  const db = await signedInDb();
  await createIdeaBoard(db, required(form, "weddingId"), {
    title: required(form, "title"),
    category: text(form, "category") ?? null,
  });
  refresh();
}

/** The photo is uploaded from the browser first (server actions cap request size at 1 MB). */
export async function addIdeaItemAction(input: {
  weddingId: string;
  boardId: string;
  photoPath?: string;
  caption?: string;
  linkUrl?: string;
}) {
  const db = await signedInDb();
  await createIdeaItem(db, input.weddingId, {
    board_id: input.boardId,
    photo_path: input.photoPath || null,
    caption: input.caption || null,
    link_url: input.linkUrl || null,
  });
  refresh();
}

export async function deleteIdeaItemAction(form: FormData) {
  const db = await signedInDb();
  await deleteIdeaItem(db, required(form, "itemId"));
  refresh();
}

export async function toggleReactionAction(form: FormData) {
  const db = await signedInDb();
  const itemId = required(form, "itemId");
  if (text(form, "mine") === "true") await removeReaction(db, itemId);
  else await addReaction(db, required(form, "weddingId"), itemId);
  refresh();
}

export async function addIdeaCommentAction(form: FormData) {
  const db = await signedInDb();
  await addComment(
    db,
    required(form, "weddingId"),
    { ideaItemId: required(form, "itemId") },
    required(form, "body"),
  );
  refresh();
}

// inbox -----------------------------------------------------------------------

export async function deleteEmailAction(form: FormData) {
  const db = await signedInDb();
  await deleteEmail(db, required(form, "emailId"));
  redirect("/?section=inbox");
}
