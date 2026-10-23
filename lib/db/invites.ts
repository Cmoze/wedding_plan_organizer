import { unwrap, type Db, type Enums, type Tables } from "@/lib/db/shared";

export type Invite = Tables<"invites">;

export type InvitePreview = {
  weddingId: string;
  partner1Name: string;
  partner2Name: string | null;
  weddingDate: string | null;
  role: Enums<"member_role">;
  expired: boolean;
};

/** Couple/planner. Only the couple can invite another `couple`. */
export async function createInvite(
  db: Db,
  weddingId: string,
  role: Enums<"member_role"> = "helper",
  expiresInDays = 14,
): Promise<Invite> {
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  return unwrap(
    await db
      .from("invites")
      .insert({ wedding_id: weddingId, role, expires_at: expiresAt })
      .select()
      .single(),
  );
}

/** The link to share, e.g. inviteUrl(window.location.origin, invite.token). */
export function inviteUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/invite/${token}`;
}

export async function listInvites(
  db: Db,
  weddingId: string,
): Promise<Invite[]> {
  return unwrap(
    await db
      .from("invites")
      .select("*")
      .eq("wedding_id", weddingId)
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
  const rows = unwrap(await db.rpc("get_invite", { _token: token }));
  const row = rows[0];
  if (!row) return null;
  return {
    weddingId: row.wedding_id,
    partner1Name: row.partner1_name,
    partner2Name: row.partner2_name,
    weddingDate: row.wedding_date,
    role: row.role,
    expired: row.expired,
  };
}

/** Joins the wedding with the invite's role. Returns the wedding id. Safe to call twice. */
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
