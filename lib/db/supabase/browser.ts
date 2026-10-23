import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";

/** Supabase client for Client Components. Uses the signed-in user's session; RLS applies. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
