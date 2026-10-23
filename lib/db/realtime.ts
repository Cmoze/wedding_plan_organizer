import type { Db } from "@/lib/db/shared";

export type RealtimeTable = "tasks" | "comments" | "activity";

/**
 * Calls `onChange` whenever a task, comment or activity row in the wedding changes, so
 * screens can refetch. Use from a Client Component (browser client) inside useEffect and
 * return the unsubscribe function as the cleanup.
 */
export function subscribeToWedding(
  db: Db,
  weddingId: string,
  onChange: (change: {
    table: RealtimeTable;
    type: "INSERT" | "UPDATE" | "DELETE";
  }) => void,
  tables: RealtimeTable[] = ["tasks", "comments", "activity"],
): () => void {
  let channel = db.channel(`wedding:${weddingId}:${crypto.randomUUID()}`);
  for (const table of tables) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `wedding_id=eq.${weddingId}`,
      },
      (payload) => onChange({ table, type: payload.eventType }),
    );
  }
  channel.subscribe();
  return () => {
    void db.removeChannel(channel);
  };
}
