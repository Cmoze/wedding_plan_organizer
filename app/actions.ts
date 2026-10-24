"use server";

import { refresh, revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_WEDDING_COOKIE } from "@/lib/active-wedding";
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
import {
  acceptInvite,
  createInvite,
  deleteInvite,
  type Invite,
} from "@/lib/db/invites";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import {
  createTask,
  deleteTask,
  updateTaskStatus,
  type TaskStatus,
} from "@/lib/db/tasks";
import {
  createWedding,
  removeMember,
  updateMember,
  type MemberRole,
} from "@/lib/db/weddings";

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The invite page to return to after logging in or signing up, if the form came from one. */
const invitePath = (form: FormData) => {
  const token = text(form, "invite");
  return token && UUID.test(token) ? `/invite/${token}` : null;
};

async function rememberWedding(weddingId: string) {
  (await cookies()).set(ACTIVE_WEDDING_COOKIE, weddingId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

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
  redirect(invitePath(form) ?? "/");
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
  redirect(invitePath(form) ?? "/new-wedding");
}

/** With an `invite` field, comes back to that invite's login page (for "wrong account" on the invite page). */
export async function signOutAction(form?: FormData) {
  await signOut(await createClient());
  forgetCachedPages();
  const invite = form ? invitePath(form) : null;
  redirect(invite ? `/login?invite=${invite.split("/").pop()}` : "/login");
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

/** Opens another wedding the user belongs to. */
export async function switchWeddingAction(form: FormData) {
  await signedInDb();
  await rememberWedding(required(form, "weddingId"));
  forgetCachedPages();
  redirect("/?section=home");
}

// team ------------------------------------------------------------------------

export type InviteFormState = FormState & {
  invite?: Pick<Invite, "token" | "email" | "role" | "expires_at">;
};

export async function createInviteAction(
  _prev: InviteFormState,
  form: FormData,
): Promise<InviteFormState> {
  const db = await signedInDb();
  const email = text(form, "email");
  if (!email) return { error: "Enter the email address to invite." };
  try {
    const invite = await createInvite(
      db,
      required(form, "weddingId"),
      (text(form, "role") as MemberRole | undefined) ?? "helper",
      { email },
    );
    refresh();
    return { invite };
  } catch (e) {
    return { error: friendly(e) };
  }
}

export async function deleteInviteAction(form: FormData) {
  const db = await signedInDb();
  await deleteInvite(db, required(form, "inviteId"));
  refresh();
}

export async function updateMemberRoleAction(form: FormData) {
  const db = await signedInDb();
  await updateMember(db, required(form, "memberId"), {
    role: required(form, "role") as MemberRole,
  });
  refresh();
}

export async function removeMemberAction(form: FormData) {
  const db = await signedInDb();
  await removeMember(db, required(form, "memberId"));
  refresh();
}

export async function acceptInviteAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const db = await signedInDb();
  try {
    const weddingId = await acceptInvite(
      db,
      required(form, "invite"),
      text(form, "displayName"),
    );
    await rememberWedding(weddingId);
  } catch (e) {
    return { error: friendly(e) };
  }
  forgetCachedPages();
  return { redirectTo: "/?section=ideas" };
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
