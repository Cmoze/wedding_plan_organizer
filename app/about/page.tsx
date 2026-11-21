import type { Metadata } from "next";
import { connection } from "next/server";
import { AboutContent } from "@/components/wedding/about-content";
import { getCurrentUser } from "@/lib/db/auth";
import { createClient } from "@/lib/db/supabase/server";
import { getMyWeddings } from "@/lib/db/weddings";

// Copy follows gtm/positioning.md: say "the people helping you", never assume family.
export const metadata: Metadata = {
  title: "About",
  description:
    "Together gives the couple and whoever is helping them one shared wedding plan, with their own logins and Piper, an AI planner that knows the plan.",
};

export default async function AboutPage() {
  // Signed-in visitors get the right header (no "Log in"; "Open your wedding" if they have one).
  await connection();
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return <AboutContent />;
  const weddings = await getMyWeddings(db).catch(() => []);
  return <AboutContent signedIn hasWedding={weddings.length > 0} />;
}
