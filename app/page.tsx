import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LandingPage } from "@/components/wedding/landing-page";
import type { WeddingContext } from "@/components/wedding/context";
import { weddingTitle } from "@/components/wedding/format";
import { BudgetSection } from "@/components/wedding/sections/budget";
import { CalendarSection } from "@/components/wedding/sections/calendar";
import { ChecklistSection } from "@/components/wedding/sections/checklist";
import { GuestsSection } from "@/components/wedding/sections/guests";
import { IdeasSection } from "@/components/wedding/sections/ideas";
import { InboxSection } from "@/components/wedding/sections/inbox";
import { HomeSection } from "@/components/wedding/sections/home";
import { RegistrySection } from "@/components/wedding/sections/registry";
import { TeamSection } from "@/components/wedding/sections/team";
import { ACTIVE_WEDDING_COOKIE } from "@/lib/active-wedding";
import { getCurrentUser } from "@/lib/db/auth";
import { toDateString } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import { canEdit, getMembers, getMyWeddings } from "@/lib/db/weddings";

const sections = [
  "home",
  "tasks",
  "calendar",
  "budget",
  "guests",
  "ideas",
  "inbox",
  "registry",
  "team",
] as const;

type Section = (typeof sections)[number];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<WorkspaceShell activeSection="home" />}>
      <SectionWorkspace searchParams={searchParams} />
    </Suspense>
  );
}

async function SectionWorkspace({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const param = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined;
  const section = param("section");
  const activeSection =
    section && sections.includes(section as Section)
      ? (section as Section)
      : "home";

  await connection();
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return <LandingPage />;
  const weddings = await getMyWeddings(db);
  const activeId = (await cookies()).get(ACTIVE_WEDDING_COOKIE)?.value;
  const wedding = weddings.find((w) => w.id === activeId) ?? weddings[0];
  if (!wedding) redirect("/new-wedding");
  const members = await getMembers(db, wedding.id);
  const me = members.find((m) => m.user_id === user.id)!;

  const ctx: WeddingContext = {
    db,
    wedding,
    me,
    members,
    canEdit: canEdit(me.role),
    today: toDateString(new Date()),
  };

  const content: Partial<Record<Section, ReactNode>> = {
    home: <HomeSection ctx={ctx} />,
    tasks: <ChecklistSection ctx={ctx} show={param("show")} />,
    calendar: (
      <CalendarSection ctx={ctx} month={param("month")} day={param("day")} />
    ),
    budget: <BudgetSection ctx={ctx} />,
    guests: <GuestsSection ctx={ctx} />,
    ideas: <IdeasSection ctx={ctx} boardId={param("board")} />,
    inbox: <InboxSection ctx={ctx} emailId={param("email")} />,
    registry: <RegistrySection ctx={ctx} />,
    team: <TeamSection ctx={ctx} weddings={weddings} />,
  };

  return (
    <WorkspaceShell
      activeSection={activeSection}
      account={{
        weddingTitle: weddingTitle(wedding),
        weddingDate: wedding.wedding_date,
        userName: me.display_name,
      }}
    >
      {content[activeSection]}
    </WorkspaceShell>
  );
}
