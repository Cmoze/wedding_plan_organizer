import type { Metadata } from "next";
import { AboutContent } from "@/components/wedding/about-content";

// Copy follows gtm/positioning.md: say "the people helping you", never assume family.
export const metadata: Metadata = {
  title: "About",
  description:
    "Together gives the couple and whoever is helping them one shared wedding plan, with their own logins and Piper, an AI planner that knows the plan.",
};

export default function AboutPage() {
  return <AboutContent />;
}
