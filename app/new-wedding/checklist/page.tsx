import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AuthLayout } from "@/components/wedding/auth-layout";
import { SuggestionPicker } from "@/components/wedding/suggestion-picker";
import { getCurrentUser } from "@/lib/db/auth";
import {
  getChecklistTemplates,
  groupSuggestions,
} from "@/lib/db/checklist-suggestions";
import { createClient } from "@/lib/db/supabase/server";
import { getTasks } from "@/lib/db/tasks";
import { canEdit, getMyMembership, getWedding } from "@/lib/db/weddings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** "Pick your to-dos": the step after creating a wedding (spec 003). */
export default function PickChecklistPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AuthLayout
      title="Pick your to-dos"
      description="Here's what most couples plan. Add what fits yours, and write your own. You can add more any time from Tasks."
    >
      <Suspense
        fallback={<p className="text-base text-[#695b60]">Loading ideas…</p>}
      >
        <Picker searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function Picker({ searchParams }: { searchParams: SearchParams }) {
  const weddingId = (await searchParams).wedding;
  if (typeof weddingId !== "string") redirect("/");
  await connection();
  const db = await createClient();
  if (!(await getCurrentUser(db))) redirect("/login");
  const me = await getMyMembership(db, weddingId).catch(() => null);
  if (!me || !canEdit(me.role)) redirect("/");

  const [templates, tasks, wedding] = await Promise.all([
    getChecklistTemplates(db),
    getTasks(db, weddingId),
    getWedding(db, weddingId),
  ]);
  const groups = groupSuggestions(
    templates,
    tasks.map((t) => t.template_id),
    { hasWeddingDate: !!wedding.wedding_date },
  ).map(({ phase, items }) => ({
    key: phase.key,
    label: phase.label,
    items: items.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
    })),
  }));

  return (
    <SuggestionPicker weddingId={weddingId} groups={groups} mode="setup" />
  );
}
