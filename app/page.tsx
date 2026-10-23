import { Suspense } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";

const sections = [
  "home",
  "tasks",
  "calendar",
  "budget",
  "guests",
  "ideas",
  "inbox",
] as const;

type Section = (typeof sections)[number];

type SearchParams = Promise<{ section?: string | string[] }>;

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
  const { section } = await searchParams;
  const activeSection =
    typeof section === "string" && sections.includes(section as Section)
      ? (section as Section)
      : "home";

  return <WorkspaceShell activeSection={activeSection} />;
}
