import type { Db } from "@/lib/db/shared";
import type { Member, Wedding } from "@/lib/db/weddings";

/** What every section needs: the signed-in client, the wedding, and who is looking. */
export type WeddingContext = {
  db: Db;
  wedding: Wedding;
  me: Member;
  members: Member[];
  canEdit: boolean;
  /** Today as `YYYY-MM-DD`. */
  today: string;
};

export const memberName = (ctx: WeddingContext, memberId: string | null) =>
  ctx.members.find((m) => m.id === memberId)?.display_name || null;

export const userName = (ctx: WeddingContext, userId: string | null) =>
  ctx.members.find((m) => m.user_id === userId)?.display_name || "Someone";
