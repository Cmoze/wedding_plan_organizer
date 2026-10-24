import "server-only";

import { weddingTitle } from "@/components/wedding/format";
import { getInvitePreview } from "@/lib/db/invites";
import { createClient } from "@/lib/db/supabase/server";

/** The invite a login or sign-up page was opened from (`?invite=<token>`), if it is still usable. */
export async function inviteFromSearch(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<{ invite?: string; joining?: string; email?: string }> {
  const { invite } = await searchParams;
  if (typeof invite !== "string") return {};
  const preview = await getInvitePreview(await createClient(), invite);
  if (!preview || preview.expired || preview.accepted) return {};
  return {
    invite,
    joining: weddingTitle({
      partner1_name: preview.partner1Name,
      partner2_name: preview.partner2Name,
    }),
    email: preview.email ?? undefined,
  };
}
