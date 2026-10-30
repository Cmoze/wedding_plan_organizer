import Link from "next/link";
import { Search } from "lucide-react";
import { BrandMark } from "@/components/wedding/brand-mark";

/** Header for the signed-out pages (landing and about). */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <Link href="/" className="flex items-center gap-3 rounded-xl">
        <span className="flex h-11 w-11 items-center justify-center">
          <BrandMark className="h-8 w-8" />
        </span>
        <span>
          <span className="block text-base leading-5 font-bold">Together</span>
          <span className="block text-sm leading-5 text-[#76666b]">
            Wedding planning
          </span>
        </span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-2">
        <Link
          href="/about"
          className="hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold text-[#603344] hover:bg-[#f8eef1] sm:inline-flex"
        >
          About
        </Link>
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
  );
}
