import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Heart,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/wedding/brand-mark";

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfb] text-[#35151f]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3 rounded-xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6f1d37] text-white">
            <BrandMark className="h-8 w-8" />
          </span>
          <span>
            <span className="block text-base leading-5 font-bold">
              Together
            </span>
            <span className="block text-sm leading-5 text-[#76666b]">
              Wedding planning
            </span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2">
          <Link
            href="/find-event"
            className="hidden min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#603344] hover:bg-[#f8eef1] sm:inline-flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Find an event
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-[#603344] hover:bg-[#f8eef1]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-full bg-[#6f1d37] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#58172c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f1d37]"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-12 pb-16 sm:px-8 sm:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-12 lg:pt-20 lg:pb-24">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#eadde1] bg-white px-4 py-2 text-sm font-semibold text-[#754254] shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Your day, thoughtfully planned
          </p>
          <h1 className="font-heading mt-7 max-w-2xl text-5xl leading-[1.08] tracking-[-0.045em] text-[#35151f] sm:text-6xl lg:text-[4.25rem]">
            A beautiful day,
            <br />
            <span className="text-[#8c3c58] italic">held together.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#695b60] sm:text-xl sm:leading-9">
            Bring the people, plans, and little details into one calm place.
            Make progress together, and leave more room to enjoy the good part.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#6f1d37] px-7 text-base font-bold text-white shadow-md shadow-[#6f1d37]/15 transition hover:-translate-y-0.5 hover:bg-[#58172c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f1d37]"
            >
              Create your wedding
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/find-event"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#d9c4cb] bg-white px-7 text-base font-semibold text-[#633246] transition hover:bg-[#fbf5f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f1d37]"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              Find an event
            </Link>
          </div>
          <p className="mt-5 text-sm text-[#77696e]">
            Already have an account?{" "}
            <Link
              className="font-bold text-[#6f1d37] underline underline-offset-4"
              href="/login"
            >
              Log in
            </Link>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
          <div className="absolute -top-10 left-10 h-40 w-40 rounded-full bg-[#f8e9ed] blur-3xl" />
          <div className="absolute -right-8 bottom-3 h-48 w-48 rounded-full bg-[#f5e5d8] blur-3xl" />
          <div className="relative rounded-[2rem] border border-[#eadfe2] bg-[#fbf6f4] p-4 shadow-[0_30px_80px_-38px_rgba(78,32,49,0.32)] sm:p-6">
            <div className="flex items-center justify-between px-2 pb-4 sm:px-3">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#916173] uppercase">
                  A little look inside
                </p>
                <p className="font-heading mt-1 text-xl text-[#35151f] sm:text-2xl">
                  Made for your kind of day
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#8c3c58] shadow-sm">
                <Heart className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-[#eadfe2] bg-white">
              <div className="relative min-h-[250px] overflow-hidden bg-[radial-gradient(ellipse_at_72%_18%,#f7e9e3_0%,transparent_35%),linear-gradient(135deg,#f4e5e7,#fffaf6_54%,#e9d8d4)] px-6 py-8 sm:min-h-[310px] sm:px-10 sm:py-10">
                <span className="absolute top-4 right-5 h-28 w-28 rounded-full border border-white/70 sm:top-8 sm:right-10 sm:h-40 sm:w-40" />
                <span className="absolute top-10 right-12 h-20 w-20 rounded-full border border-white/60 sm:top-16 sm:right-20 sm:h-28 sm:w-28" />
                <div className="relative flex h-full min-h-[194px] flex-col justify-between sm:min-h-[230px]">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#8c3c58] uppercase">
                    The wedding of
                  </p>
                  <div>
                    <p className="font-heading text-4xl leading-tight text-[#4b2533] sm:text-6xl">
                      Maya <span className="text-[#a86478] italic">&amp;</span>
                      <br /> Jordan
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#735560]">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      October 17, 2027 · Portland, Oregon
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#8c3c58] uppercase">
                    <span className="h-px w-8 bg-[#caaab5]" />
                    Our next chapter
                    <span className="h-px w-8 bg-[#caaab5]" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-[#eee5e7] px-2 py-4 sm:px-5 sm:py-5">
                {[
                  { label: "Days to go", value: "357" },
                  { label: "To do", value: "18" },
                  { label: "People", value: "126" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-heading text-2xl text-[#6f1d37] sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#78676d] sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-2xl border border-[#eadfe2] bg-white px-4 py-3 shadow-lg sm:-left-8 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7edf0] text-[#6f1d37]">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold text-[#35151f]">
                  One plan, shared
                </span>
                <span className="block text-xs text-[#796a70]">
                  Everyone knows what comes next
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#f0e7e8] bg-[#fcf8f7]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-3 sm:px-8 sm:py-12 lg:px-12">
          <Feature
            icon={<Check className="h-5 w-5" aria-hidden="true" />}
            title="A clear next step"
            text="A thoughtful checklist keeps the big plans and small details moving."
          />
          <Feature
            icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
            title="Dates in one place"
            text="See deadlines, appointments, and wedding events together."
          />
          <Feature
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            title="Your people, included"
            text="Invite family and friends to share the work and the excitement."
          />
        </div>
      </section>
    </main>
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
        <h2 className="font-bold text-[#35151f]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#77676d]">{text}</p>
      </div>
    </div>
  );
}
