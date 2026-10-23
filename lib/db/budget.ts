import {
  unwrap,
  type Db,
  type NewRow,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export type BudgetItem = Tables<"budget_items">;

export type BudgetSummary = {
  budgetTotal: number | null;
  estimated: number;
  /** Actual cost where known, otherwise the estimate. */
  committed: number;
  paid: number;
  /** budgetTotal minus committed, or null when no budget is set. */
  remaining: number | null;
  byCategory: {
    category: string;
    estimated: number;
    committed: number;
    paid: number;
  }[];
};

export async function getBudgetItems(
  db: Db,
  weddingId: string,
): Promise<BudgetItem[]> {
  return unwrap(
    await db
      .from("budget_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("category")
      .order("created_at"),
  );
}

export async function createBudgetItem(
  db: Db,
  weddingId: string,
  input: NewRow<"budget_items">,
): Promise<BudgetItem> {
  return unwrap(
    await db
      .from("budget_items")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateBudgetItem(
  db: Db,
  itemId: string,
  patch: RowPatch<"budget_items">,
): Promise<BudgetItem> {
  return unwrap(
    await db
      .from("budget_items")
      .update(patch)
      .eq("id", itemId)
      .select()
      .single(),
  );
}

export async function deleteBudgetItem(db: Db, itemId: string): Promise<void> {
  unwrap(await db.from("budget_items").delete().eq("id", itemId));
}

export async function getBudgetSummary(
  db: Db,
  weddingId: string,
): Promise<BudgetSummary> {
  const [wedding, items] = await Promise.all([
    db.from("weddings").select("budget_total").eq("id", weddingId).single(),
    getBudgetItems(db, weddingId),
  ]);
  return summarizeBudget(unwrap(wedding).budget_total, items);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarizeBudget(
  budgetTotal: number | null,
  items: Pick<BudgetItem, "category" | "estimated" | "actual" | "paid">[],
): BudgetSummary {
  const categories = new Map<
    string,
    { estimated: number; committed: number; paid: number }
  >();
  for (const item of items) {
    const c = categories.get(item.category) ?? {
      estimated: 0,
      committed: 0,
      paid: 0,
    };
    c.estimated += Number(item.estimated);
    c.committed += Number(item.actual ?? item.estimated);
    c.paid += Number(item.paid);
    categories.set(item.category, c);
  }
  const byCategory = [...categories.entries()]
    .map(([category, c]) => ({
      category,
      estimated: round2(c.estimated),
      committed: round2(c.committed),
      paid: round2(c.paid),
    }))
    .sort((a, b) => b.committed - a.committed);
  const sum = (key: "estimated" | "committed" | "paid") =>
    round2(byCategory.reduce((total, c) => total + c[key], 0));
  const committed = sum("committed");
  return {
    budgetTotal: budgetTotal === null ? null : Number(budgetTotal),
    estimated: sum("estimated"),
    committed,
    paid: sum("paid"),
    remaining:
      budgetTotal === null ? null : round2(Number(budgetTotal) - committed),
    byCategory,
  };
}
