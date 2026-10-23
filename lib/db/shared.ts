import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/db/types";

export type { Enums, Tables, TablesInsert };

/** Any Supabase client: browser, server or admin. */
export type Db = SupabaseClient<Database>;

type TableName = keyof Database["public"]["Tables"];
type Managed = "id" | "wedding_id" | "created_at" | "updated_at";

/** Fields you pass when creating a row (id, wedding_id and timestamps are filled in for you). */
export type NewRow<T extends TableName> = Omit<TablesInsert<T>, Managed>;
/** Fields you can change on an existing row. */
export type RowPatch<T extends TableName> = Omit<TablesUpdate<T>, Managed>;

export class DbError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "DbError";
  }
}

/** Returns `data` or throws a DbError with Supabase's message. */
export function unwrap<T>(result: {
  data: T | null;
  error: { message: string; code?: string } | null;
}): T {
  if (result.error) throw new DbError(result.error.message, result.error.code);
  return result.data as T;
}

/** A date as `YYYY-MM-DD` in local time, the format Postgres `date` columns use. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
