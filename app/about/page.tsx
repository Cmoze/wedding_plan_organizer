import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
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

export default function AboutPage() {
  // cacheComponents: reading the visitor's session is runtime data, so it must sit inside
  // Suspense or the build fails prerendering /about. The signed-out page is the static shell.
  return (
    <Suspense fallback={<AboutContent />}>
      <AboutForVisitor />
    </Suspense>
  );
}

/** Signed-in visitors get the right header (no "Log in"; "Open your wedding" if they have one). */
async function AboutForVisitor() {
  await connection();
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return <AboutContent />;
  const weddings = await getMyWeddings(db).catch(() => []);
  return <AboutContent signedIn hasWedding={weddings.length > 0} />;
}
