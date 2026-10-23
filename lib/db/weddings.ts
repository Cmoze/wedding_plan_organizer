import { getCurrentUser } from "@/lib/db/auth";
import {
  DbError,
  unwrap,
  type Db,
  type Enums,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export type Wedding = Tables<"weddings">;
export type Member = Tables<"members">;
export type MemberRole = Enums<"member_role">;

/** Creates the wedding, makes the current user `couple` and copies in the checklist. */
export async function createWedding(
  db: Db,
  input: {
    partner1Name: string;
    partner2Name?: string;
    weddingDate?: string;
    budgetTotal?: number;
    guestCountEstimate?: number;
    displayName?: string;
  },
): Promise<Wedding> {
  return unwrap(
    await db
      .rpc("create_wedding", {
        _partner1_name: input.partner1Name,
        _partner2_name: input.partner2Name,
        _wedding_date: input.weddingDate,
        _budget_total: input.budgetTotal,
        _guest_count_estimate: input.guestCountEstimate,
        _display_name: input.displayName,
      })
      .single(),
  );
}

/** Weddings the current user belongs to, with their role in each. */
export async function getMyWeddings(
  db: Db,
): Promise<(Wedding & { role: MemberRole })[]> {
  const user = await getCurrentUser(db);
  if (!user) return [];
  const rows = unwrap(
    await db
      .from("members")
      .select("role, weddings!inner(*)")
      .eq("user_id", user.id)
      .order("created_at"),
  );
  return rows.map((r) => ({ ...r.weddings, role: r.role }));
}

export async function getWedding(db: Db, weddingId: string): Promise<Wedding> {
  return unwrap(
    await db.from("weddings").select("*").eq("id", weddingId).single(),
  );
}

export async function updateWedding(
  db: Db,
  weddingId: string,
  patch: Omit<RowPatch<"weddings">, "email_slug" | "created_by">,
): Promise<Wedding> {
  return unwrap(
    await db
      .from("weddings")
      .update(patch)
      .eq("id", weddingId)
      .select()
      .single(),
  );
}

/** Couple only. Deletes everything in the wedding. */
export async function deleteWedding(db: Db, weddingId: string): Promise<void> {
  unwrap(await db.from("weddings").delete().eq("id", weddingId));
}

export async function getMembers(db: Db, weddingId: string): Promise<Member[]> {
  return unwrap(
    await db
      .from("members")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at"),
  );
}

/** The current user's membership (use `role` to show or hide edit buttons), or null. */
export async function getMyMembership(
  db: Db,
  weddingId: string,
): Promise<Member | null> {
  const user = await getCurrentUser(db);
  if (!user) return null;
  return unwrap(
    await db
      .from("members")
      .select("*")
      .eq("wedding_id", weddingId)
      .eq("user_id", user.id)
      .maybeSingle(),
  );
}

export function canEdit(role: MemberRole | null | undefined): boolean {
  return role === "couple" || role === "planner";
}

/** Couple only. */
export async function updateMember(
  db: Db,
  memberId: string,
  patch: { role?: MemberRole; display_name?: string },
): Promise<Member> {
  const rows = unwrap(
    await db.from("members").update(patch).eq("id", memberId).select(),
  );
  if (rows.length === 0)
    throw new DbError("Only the couple can change members", "42501");
  return rows[0];
}

/** Couple can remove anyone; anyone can remove themselves (leave). */
export async function removeMember(db: Db, memberId: string): Promise<void> {
  unwrap(await db.from("members").delete().eq("id", memberId));
}

/** Server-side lookup for the inbound email webhook (use with the admin client). */
export async function getWeddingByEmailSlug(
  db: Db,
  slug: string,
): Promise<Wedding | null> {
  return unwrap(
    await db
      .from("weddings")
      .select("*")
      .eq("email_slug", slug.toLowerCase())
      .maybeSingle(),
  );
}
