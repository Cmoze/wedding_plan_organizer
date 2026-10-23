import Link from "next/link";
import {
  CalendarDays,
  CheckSquare,
  Heart,
  Home,
  Inbox,
  Menu,
  UsersRound,
  Wallet,
} from "lucide-react";

const sections = [
  { id: "home", label: "Home", icon: Home },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "guests", label: "Guests", icon: UsersRound },
  { id: "ideas", label: "Ideas", icon: Heart },
  { id: "inbox", label: "Inbox", icon: Inbox },
] as const;

type SectionId = (typeof sections)[number]["id"];

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
};

export function WorkspaceShell({
  activeSection,
}: {
  activeSection: SectionId;
}) {
  const current = sectionCopy[activeSection];

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-[#20352f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#e3e4dc] bg-[#fbfaf7] px-5 py-7 lg:flex">
          <Brand />
          <p className="mt-10 mb-3 px-3 text-xs font-bold tracking-[0.12em] text-[#68766f] uppercase">
            Your workspace
          </p>
          <Navigation activeSection={activeSection} />
          <div className="mt-auto rounded-2xl border border-[#e5e3d7] bg-[#f3f0e5] p-4">
            <p className="text-sm font-semibold">Planning is a team effort</p>
            <p className="mt-1 text-sm leading-5 text-[#596960]">
              Share the little jobs and celebrate each thing you finish.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-20 items-center justify-between border-b border-[#e3e4dc] bg-[#fbfaf7] px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <details className="group relative">
                <summary
                  aria-label="Open workspace navigation"
                  className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-xl border border-[#d8ded7] text-[#294b40] hover:bg-[#f1f3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a] [&::-webkit-details-marker]:hidden"
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </summary>
                <div className="absolute top-14 left-0 z-20 w-64 rounded-2xl border border-[#e1e3dc] bg-white p-3 shadow-xl">
                  <Brand compact />
                  <Navigation activeSection={activeSection} />
                </div>
              </details>
              <Brand compact />
            </div>
            <p className="hidden text-sm font-medium text-[#617168] lg:block">
              A little progress, shared by everyone.
            </p>
            <div className="flex h-12 items-center gap-2 rounded-full border border-[#e1e3dc] bg-white px-4 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e6eee8] text-xs text-[#294b40]">
                W
              </span>
              Wedding team
            </div>
          </header>

          <main className="w-full flex-1 px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm font-bold tracking-[0.12em] text-[#536c5f] uppercase">
                Wedding Plan Organizer
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-semibold tracking-[-0.035em] text-[#20352f] sm:text-5xl">
                {current.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#52635a]">
                {current.description}
              </p>

              {activeSection === "home" ? (
                <HomeWelcome />
              ) : (
                <SectionWelcome section={activeSection} />
              )}
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
      className={`flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#426c5a] ${compact ? "mb-4 px-2 py-2" : "px-3"}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#315b4b] text-white">
        <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-base leading-5 font-bold">Together</span>
        <span className="block text-sm leading-5 text-[#66756c]">
          Wedding planning
        </span>
      </span>
    </Link>
  );
}

function Navigation({ activeSection }: { activeSection: SectionId }) {
  return (
    <nav aria-label="Wedding workspace">
      <ul className="space-y-1">
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeSection;
          return (
            <li key={id}>
              <Link
                href={`/?section=${id}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a] ${
                  isActive
                    ? "bg-[#e6eee8] text-[#244c3d]"
                    : "text-[#506057] hover:bg-[#f0f2ed] hover:text-[#20352f]"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeWelcome() {
  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-[28px] bg-[#315b4b] p-7 text-white shadow-sm sm:p-9">
        <p className="text-sm font-bold tracking-[0.12em] text-[#d5e4d8] uppercase">
          One place for all the details
        </p>
        <h2 className="mt-4 max-w-xl text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-4xl">
          Make room for the moments that matter.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-8 text-[#edf4ee]">
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
      <div className="flex flex-col justify-between rounded-[28px] border border-[#e2e4dc] bg-white p-7 sm:p-8">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f0e5] text-[#785e35]">
            <UsersRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-bold">Better, together</h2>
          <p className="mt-2 text-base leading-7 text-[#52635a]">
            Invite family and friends to help. Everyone can see the plan and
            know what comes next.
          </p>
        </div>
        <Link
          href="/?section=ideas"
          className="mt-6 inline-flex min-h-12 items-center font-bold text-[#315b4b] underline decoration-[#9db4a3] decoration-2 underline-offset-4 hover:text-[#203f33] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#426c5a]"
        >
          Explore the workspace
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
          : "bg-white text-[#244c3d] hover:bg-[#edf3ee]"
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
  };

  return (
    <section className="mt-10 rounded-[28px] border border-dashed border-[#bdc9bf] bg-white/70 px-6 py-12 text-center sm:px-12">
      <p className="text-sm font-bold tracking-[0.12em] text-[#536c5f] uppercase">
        Getting ready for you
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#29483c]">
        {titles[section as Exclude<SectionId, "home">]}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#52635a]">
        This part of the shared wedding workspace is just getting started. Your
        plans will stay connected with the rest of the team.
      </p>
    </section>
  );
}
