import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckSquare,
  Gift,
  Heart,
  Home,
  Inbox,
  LogOut,
  Menu,
  MoreHorizontal,
  UserPlus,
  UsersRound,
  Wallet,
} from "lucide-react";
import { signOutAction } from "@/app/actions";
import { BrandMark } from "@/components/wedding/brand-mark";

const sections = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "guests", label: "Guests", icon: UsersRound },
  { id: "ideas", label: "Ideas", icon: Heart },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "registry", label: "Registry", icon: Gift },
  { id: "team", label: "Team", icon: UserPlus },
] as const;

type SectionId = (typeof sections)[number]["id"];
const primarySections = new Set<SectionId>([
  "home",
  "tasks",
  "calendar",
  "guests",
  "budget",
]);

const sectionCopy: Record<SectionId, { title: string; description: string }> = {
  home: {
    title: "Your wedding, planned together.",
    description:
      "Keep the details in one calm place, so you can spend more time enjoying this season.",
  },
  tasks: {
    title: "Tasks",
    description: "A shared checklist for the next steps, big and small.",
  },
  calendar: {
    title: "Calendar",
    description: "See wedding tasks, events, and payment dates together.",
  },
  budget: {
    title: "Budget",
    description: "Keep estimates, payments, and vendor costs easy to follow.",
  },
  guests: {
    title: "Guest list",
    description: "Organize invitations by household and keep RSVPs in view.",
  },
  ideas: {
    title: "Ideas",
    description: "Save inspiration and share notes with your wedding team.",
  },
  inbox: {
    title: "Wedding inbox",
    description: "Keep vendor emails close to the plans they belong to.",
  },
  registry: {
    title: "Gift registry",
    description:
      "Keep every registry link in one place, ready to share with guests.",
  },
  team: {
    title: "Your wedding team",
    description:
      "Invite family and friends by email so they can add ideas and help with the plan.",
  },
};

export function WorkspaceShell({
  activeSection,
  account,
  children,
}: {
  activeSection: SectionId;
  /** Shown in the header once the wedding has loaded. */
  account?: {
    weddingTitle: string;
    weddingDate?: string | null;
    userName: string;
  };
  /** The section's content; without it the section shows its placeholder. */
  children?: ReactNode;
}) {
  const current = sectionCopy[activeSection];

  return (
    <div className="min-h-screen bg-[#faf7f4] text-[#35151f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#eadfe2] bg-[#fffdfb] px-5 py-7 lg:flex">
          <Brand />
          <p className="mt-10 mb-3 px-3 text-xs font-bold tracking-[0.12em] text-[#8a6f79] uppercase">
            Plan together
          </p>
          <Navigation activeSection={activeSection} />
          <div className="mt-auto rounded-2xl border border-[#eadfe2] bg-[#fbf3f5] p-4">
            <p className="text-sm font-semibold">Planning is a team effort</p>
            <p className="mt-1 text-sm leading-5 text-[#75666c]">
              Share the little jobs and celebrate each thing you finish.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-20 items-center justify-between gap-2 border-b border-[#eadfe2] bg-[#fffdfb] px-3 sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <details className="group relative">
                <summary
                  aria-label="Open workspace navigation"
                  className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-xl border border-[#ddcbd1] text-[#6f1d37] hover:bg-[#fbf3f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c3c58] [&::-webkit-details-marker]:hidden"
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </summary>
                <div className="absolute top-14 left-0 z-20 w-64 rounded-2xl border border-[#eadfe2] bg-white p-3 shadow-xl">
                  <Brand compact />
                  <Navigation activeSection={activeSection} />
                </div>
              </details>
              <Brand compact />
            </div>
            <p className="hidden text-sm font-medium text-[#806c74] lg:block">
              A little progress, shared by everyone.
            </p>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="flex min-h-12 min-w-0 shrink items-center gap-2 rounded-full border border-[#eadfe2] bg-white px-2.5 py-1.5 text-sm font-semibold sm:gap-3 sm:px-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4e7eb] text-xs font-bold text-[#6f1d37]">
                  {(account?.userName || "W").charAt(0).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="max-w-[22vw] truncate text-[#492734] sm:max-w-[min(38vw,280px)]">
                    {account?.weddingTitle ?? "Wedding team"}
                  </span>
                  {account?.weddingDate && (
                    <span className="hidden text-xs font-normal text-[#806c74] sm:block">
                      {new Date(
                        `${account.weddingDate}T12:00:00`,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {account?.userName && (
                    <span className="hidden text-xs font-normal text-[#806c74] sm:block">
                      {account.userName}
                    </span>
                  )}
                </span>
              </div>
              {account && (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    aria-label="Log out"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#eadfe2] bg-white text-[#6f1d37] hover:bg-[#fbf3f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c3c58] sm:h-12 sm:w-12"
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                  </button>
                </form>
              )}
            </div>
          </header>

          <main className="w-full flex-1 px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
            <div className="mx-auto max-w-5xl">
              {activeSection !== "home" && (
                <>
                  <p className="text-sm font-bold tracking-[0.12em] text-[#956779] uppercase">
                    Wedding Plan Organizer
                  </p>
                  <h1 className="font-heading mt-3 max-w-3xl text-4xl leading-tight font-semibold tracking-[-0.035em] text-[#35151f] sm:text-5xl">
                    {current.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-[#695b60]">
                    {current.description}
                  </p>
                </>
              )}

              {children ??
                (activeSection === "home" ? (
                  <HomeWelcome />
                ) : (
                  <SectionWelcome section={activeSection} />
                ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/?section=home"
      className={`flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8c3c58] ${compact ? "mb-4 px-2 py-2" : "px-3"}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#6f1d37] text-white ${compact ? "h-10 w-10 sm:h-11 sm:w-11" : "h-11 w-11"}`}
      >
        <BrandMark className="h-8 w-8" />
      </span>
      <span className={compact ? "hidden sm:block" : undefined}>
        <span className="block text-base leading-5 font-bold">Together</span>
        <span className="block text-sm leading-5 text-[#806c74]">
          Wedding planning
        </span>
      </span>
    </Link>
  );
}

function Navigation({ activeSection }: { activeSection: SectionId }) {
  const primary = sections.filter(({ id }) => primarySections.has(id));
  const more = sections.filter(({ id }) => !primarySections.has(id));
  const activeIsMore = more.some(({ id }) => id === activeSection);

  return (
    <nav aria-label="Wedding workspace">
      <ul className="space-y-1">
        {primary.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeSection;
          return (
            <li key={id}>
              <Link
                href={`/?section=${id}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c3c58] ${
                  isActive
                    ? "bg-[#f4e7eb] text-[#6f1d37]"
                    : "text-[#65555c] hover:bg-[#fbf3f5] hover:text-[#35151f]"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <details className="group" open={activeIsMore}>
            <summary
              className={`flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors hover:bg-[#fbf3f5] [&::-webkit-details-marker]:hidden ${activeIsMore ? "text-[#6f1d37]" : "text-[#65555c]"}`}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden="true" />
              More
              <span
                className="ml-auto text-xs text-[#806c74] group-open:rotate-180"
                aria-hidden="true"
              >
                ⌄
              </span>
            </summary>
            <ul className="mt-1 ml-4 space-y-1 border-l border-[#eadfe2] pl-2">
              {more.map(({ id, label, icon: Icon }) => {
                const isActive = id === activeSection;
                return (
                  <li key={id}>
                    <Link
                      href={`/?section=${id}`}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c3c58] ${
                        isActive
                          ? "bg-[#f4e7eb] text-[#6f1d37]"
                          : "text-[#65555c] hover:bg-[#fbf3f5] hover:text-[#35151f]"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        </li>
      </ul>
    </nav>
  );
}

function HomeWelcome() {
  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-[28px] bg-[#6f1d37] p-7 text-white shadow-sm sm:p-9">
        <p className="text-sm font-bold tracking-[0.12em] text-[#f0dce3] uppercase">
          One place for all the details
        </p>
        <h2 className="mt-4 max-w-xl text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-4xl">
          Make room for the moments that matter.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-8 text-[#f3e8ec]">
          Bring your people, plans, and important dates together. Start with one
          next step and build from there.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <QuickLink href="/?section=tasks" label="See the checklist" />
          <QuickLink
            href="/?section=guests"
            label="Open guest list"
            secondary
          />
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-[28px] border border-[#eadfe2] bg-white p-7 sm:p-8">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbf3f5] text-[#8c3c58]">
            <UsersRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-bold">Better, together</h2>
          <p className="mt-2 text-base leading-7 text-[#695b60]">
            Invite family and friends to help. Everyone can see the plan and
            know what comes next.
          </p>
        </div>
        <Link
          href="/?section=team"
          className="mt-6 inline-flex min-h-12 items-center font-bold text-[#6f1d37] underline decoration-[#cba7b4] decoration-2 underline-offset-4 hover:text-[#4c172c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8c3c58]"
        >
          Invite your people
        </Link>
      </div>
    </section>
  );
}

function QuickLink({
  href,
  label,
  secondary = false,
}: {
  href: string;
  label: string;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        secondary
          ? "border border-white/60 bg-transparent text-white hover:bg-white/10"
          : "bg-white text-[#6f1d37] hover:bg-[#edf3ee]"
      }`}
    >
      {label}
    </Link>
  );
}

function SectionWelcome({ section }: { section: SectionId }) {
  const titles: Record<Exclude<SectionId, "home">, string> = {
    tasks: "Your checklist will live here",
    calendar: "Your dates will come together here",
    budget: "Your budget will be easy to follow here",
    guests: "Your guest list will start here",
    ideas: "Your inspiration will have a home here",
    inbox: "Your wedding emails will be here",
    registry: "Your registry links will be here",
    team: "Your wedding team will be here",
  };

  return (
    <section className="mt-10 rounded-[28px] border border-dashed border-[#d9c4cb] bg-white/70 px-6 py-12 text-center sm:px-12">
      <p className="text-sm font-bold tracking-[0.12em] text-[#956779] uppercase">
        Getting ready for you
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#4b2734]">
        {titles[section as Exclude<SectionId, "home">]}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#695b60]">
        This part of the shared wedding workspace is just getting started. Your
        plans will stay connected with the rest of the team.
      </p>
    </section>
  );
}
