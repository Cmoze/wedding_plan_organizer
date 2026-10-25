import { unwrap, type Db, type Tables } from "@/lib/db/shared";

export type Activity = Tables<"activity"> & { actor_name: string | null };

const ENTITY_LABELS: Record<string, string> = {
  members: "member",
  tasks: "task",
  events: "event",
  vendors: "vendor",
  budget_items: "budget item",
  households: "household",
  idea_boards: "idea board",
  idea_items: "idea",
  comments: "comment",
  registry_links: "registry link",
  gifts: "gift",
};

/** Recent activity, newest first, with the actor's display name. */
export async function getActivity(
  db: Db,
  weddingId: string,
  limit = 20,
): Promise<Activity[]> {
  const [activity, members] = await Promise.all([
    db
      .from("activity")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("members")
      .select("user_id, display_name")
      .eq("wedding_id", weddingId),
  ]);
  const names = new Map(
    unwrap(members).map((m) => [m.user_id, m.display_name]),
  );
  return unwrap(activity).map((a) => ({
    ...a,
    actor_name: a.actor_id ? (names.get(a.actor_id) ?? null) : null,
  }));
}

/** A readable line, e.g. `Pat completed task "Book the florist"`. */
export function describeActivity(
  a: Pick<Activity, "actor_name" | "action" | "entity_type" | "summary">,
) {
  const who = a.actor_name || "Someone";
  if (a.entity_type === "members" && a.action === "created")
    return `${a.summary || who} joined`;
  const what = ENTITY_LABELS[a.entity_type] ?? a.entity_type;
  return `${who} ${a.action} ${what}${a.summary ? ` "${a.summary}"` : ""}`;
}
