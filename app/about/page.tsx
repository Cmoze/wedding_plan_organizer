import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Gift,
  Home,
  ListChecks,
  Mail,
  MessageCircleHeart,
  PiggyBank,
  ShieldCheck,
  Smartphone,
  Store,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { SiteHeader } from "@/components/wedding/site-header";

// Copy follows gtm/positioning.md: say "the people helping you", never assume family.
export const metadata: Metadata = {
  title: "About",
  description:
    "Together gives the couple and whoever is helping them one shared wedding plan, with their own logins and Piper, an AI planner that knows the plan.",
};

const differences = [
  {
    icon: <UserRoundPlus className="h-5 w-5" aria-hidden="true" />,
    title: "Everyone signs in as themselves",
    text: "Invite as many people as you like, each with their own login and a role. The couple has full control, planners can change everything, and helpers update the tasks assigned to them. No one shares a password.",
  },
  {
    icon: <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />,
    title: "Piper knows your plan",
    text: "Ask Piper, the AI planner, “What's left for the reception?” or “Who hasn't RSVP'd?” and get an answer from your own tasks, budget, and guest list. Piper suggests changes and you tap “Yes, do it.” It never changes the plan on its own.",
  },
  {
    icon: <Mail className="h-5 w-5" aria-hidden="true" />,
    title: "One inbox for the wedding",
    text: "Your wedding gets its own email address. Forward a vendor's email to it, and Piper offers to add the deposit, the due date, or the to-do.",
  },
  {
    icon: <Store className="h-5 w-5" aria-hidden="true" />,
    title: "A planner, not a storefront",
    text: "No vendor ads in your plan. Together is there to help you plan, not to sell you things.",
  },
  {
    icon: <Smartphone className="h-5 w-5" aria-hidden="true" />,
    title: "Easy for anyone you invite",
    text: "Large text, plain labels, and big buttons, on a phone or a computer, so people who don't live in apps can still pitch in.",
  },
];

const features = [
  {
    icon: <Home className="h-5 w-5" aria-hidden="true" />,
    title: "Home",
    text: "A countdown, Piper's “What should we do this week?”, what's overdue, and where the budget stands.",
  },
  {
    icon: <ListChecks className="h-5 w-5" aria-hidden="true" />,
    title: "Tasks",
    text: "A ready-made checklist, biggest decisions first. Finishing a task can record the vendor and the cost.",
  },
  {
    icon: <CalendarDays className="h-5 w-5" aria-hidden="true" />,
    title: "Calendar",
    text: "Task due dates, payment due dates, and events in one place.",
  },
  {
    icon: <PiggyBank className="h-5 w-5" aria-hidden="true" />,
    title: "Budget",
    text: "Categories, estimated and actual costs, and what's paid and still due.",
  },
  {
    icon: <UsersRound className="h-5 w-5" aria-hidden="true" />,
    title: "Guests",
    text: "Guests grouped by household, with addresses, RSVPs, and meal choices. Import a spreadsheet, and share an RSVP link or QR code.",
  },
  {
    icon: <Mail className="h-5 w-5" aria-hidden="true" />,
    title: "Inbox",
    text: "The wedding's own email address, with Piper's suggestions on each email.",
  },
  {
    icon: <Gift className="h-5 w-5" aria-hidden="true" />,
    title: "Registry and gifts",
    text: "Links to your registries at any store, plus gift tracking and thank-you cards.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
    title: "Team",
    text: "Invite people by email with a role, and change roles or remove people any time.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfb] text-[#35151f]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-5 pt-10 pb-14 sm:px-8 sm:pt-14 sm:pb-16 lg:px-12">
        <p className="text-sm font-bold tracking-[0.16em] text-[#916173] uppercase">
          About Together
        </p>
        <h1 className="font-heading mt-4 text-4xl leading-[1.1] tracking-[-0.035em] text-[#35151f] sm:text-5xl lg:text-6xl">
          One plan for everyone{" "}
          <span className="text-[#8c3c58] italic">helping with your day.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#695b60] sm:text-xl sm:leading-9">
          A wedding is rarely planned by one person. Together gives the couple
          and whoever is helping them one shared plan, so nothing important
          lives only in someone&apos;s notebook, inbox, or text thread.
        </p>
      </section>

      <section className="border-y border-[#f0e7e8] bg-[#fcf8f7]">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-14 lg:px-12">
          <h2 className="font-heading text-3xl text-[#35151f] sm:text-4xl">
            Who it&apos;s for
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-8 text-[#5f5156]">
            <p>
              Couples planning a wedding, and the people helping them. You run
              the plan. Whoever you bring in, whether that&apos;s a parent, a
              friend, a planner, or your wedding party, gets their own login and
              a role that fits what they&apos;re doing.
            </p>
            <p>
              Someone paying for things or booking vendors can change the plan.
              Someone helping with a few jobs can check off what&apos;s theirs.
              Planning on your own? You get the same plan, and you can invite
              people whenever you want.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <h2 className="font-heading text-3xl text-[#35151f] sm:text-4xl">
          What makes it different
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {differences.map((item) => (
            <Card key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="border-y border-[#f0e7e8] bg-[#fcf8f7]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
          <h2 className="font-heading text-3xl text-[#35151f] sm:text-4xl">
            Everything in one place
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <Feature key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-8 sm:py-16 lg:px-12">
        <h2 className="font-heading text-3xl text-[#35151f] sm:text-4xl">
          Start your plan
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[#695b60]">
          It takes a minute to set up. Invite the people helping you now or
          later.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#6f1d37] px-7 text-base font-bold text-white shadow-md shadow-[#6f1d37]/15 transition hover:-translate-y-0.5 hover:bg-[#58172c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f1d37]"
          >
            Create your wedding
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#d9c4cb] bg-white px-7 text-base font-semibold text-[#633246] transition hover:bg-[#fbf5f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f1d37]"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

function Card({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadfe2] bg-white p-6 shadow-[0_18px_50px_-36px_rgba(78,32,49,0.3)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4e7eb] text-[#6f1d37]">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-[#35151f]">{title}</h3>
      <p className="mt-2 text-base leading-7 text-[#695b60]">{text}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4e7eb] text-[#6f1d37]">
        {icon}
      </span>
      <div>
        <h3 className="font-bold text-[#35151f]">{title}</h3>
        <p className="mt-1 text-base leading-7 text-[#77676d]">{text}</p>
      </div>
    </div>
  );
}
