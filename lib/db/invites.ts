import {
  DbError,
  unwrap,
  type Db,
  type Enums,
  type Tables,
} from "@/lib/db/shared";

export type Invite = Tables<"invites">;

export type InvitePreview = {
  weddingId: string;
  partner1Name: string;
  partner2Name: string | null;
  weddingDate: string | null;
  role: Enums<"member_role">;
  /** Only this account can accept the invite; null for an open link. */
  email: string | null;
  expired: boolean;
  accepted: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Couple/planner. Only the couple can invite another `couple`. Pass `email` to lock it to one account. */
export async function createInvite(
  db: Db,
  weddingId: string,
  role: Enums<"member_role"> = "helper",
  options: { email?: string; expiresInDays?: number } = {},
): Promise<Invite> {
  const email = options.email ? normalizeEmail(options.email) : null;
  if (email !== null && !EMAIL.test(email))
    throw new DbError("That doesn't look like an email address.");
  const expiresAt = new Date(
    Date.now() + (options.expiresInDays ?? 14) * 24 * 60 * 60 * 1000,
  ).toISOString();
  return unwrap(
    await db
      .from("invites")
      .insert({ wedding_id: weddingId, role, email, expires_at: expiresAt })
      .select()
      .single(),
  );
}

/** The link to share, e.g. inviteUrl(window.location.origin, invite.token). */
export function inviteUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/invite/${token}`;
}

/** Invites nobody has used yet (including expired ones), newest first. */
export async function listInvites(
  db: Db,
  weddingId: string,
): Promise<Invite[]> {
  return unwrap(
    await db
      .from("invites")
      .select("*")
      .eq("wedding_id", weddingId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  );
}

export async function deleteInvite(db: Db, inviteId: string): Promise<void> {
  unwrap(await db.from("invites").delete().eq("id", inviteId));
}

/** Works signed out, for the invite landing page. Null if the token doesn't exist. */
export async function getInvitePreview(
  db: Db,
  token: string,
): Promise<InvitePreview | null> {
  // Not a uuid means not an invite; Postgres would reject it with a type error.
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const rows = unwrap(await db.rpc("get_invite", { _token: token }));
  const row = rows[0];
  if (!row) return null;
  return {
    weddingId: row.wedding_id,
    partner1Name: row.partner1_name,
    partner2Name: row.partner2_name,
    weddingDate: row.wedding_date,
    role: row.role,
    email: row.email,
    expired: row.expired,
    accepted: row.accepted,
  };
}

/**
 * Joins the wedding with the invite's role. Returns the wedding id.
 * Safe to call twice; fails if the invite is for another email or was used by someone else.
 */
export async function acceptInvite(
  db: Db,
  token: string,
  displayName?: string,
): Promise<string> {
  return unwrap(
    await db.rpc("accept_invite", {
      _token: token,
      _display_name: displayName,
    }),
  );
}
