// Runs Piper's eval set (piper.json) against the made-up wedding in piper-fixture.json, with the
// real prompt, tools and model. Calls the Claude API, so it is skipped by `npm test`. Run it with:
//   npm run eval:piper
// Each run is saved to results/ and should be logged in README.md.

import { mkdirSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it, vi } from "vitest";
import fixture from "./piper-fixture.json";
import evalSet from "./piper.json";
import { gradePiper, type Expectation } from "./piper-grade";

vi.mock("server-only", () => ({}));

// The database, served from the fixture. Imports inside the factories because vi.mock is hoisted.
const data = async () => (await import("./piper-fixture.json")).default;
vi.mock("@/lib/db/weddings", async (original) => ({
  ...(await original<object>()),
  getWedding: async () => (await data()).wedding,
}));
vi.mock("@/lib/db/budget", async (original) => {
  const actual = await original<typeof import("@/lib/db/budget")>();
  return {
    ...actual,
    getBudgetItems: async () => (await data()).budget_items,
    getBudgetSummary: async () => {
      const f = await data();
      return actual.summarizeBudget(f.wedding.budget_total, f.budget_items);
    },
  };
});
vi.mock("@/lib/db/tasks", async (original) => ({
  ...(await original<object>()),
  getTasks: async (
    _db: unknown,
    _id: string,
    filters: { status?: string[]; dueTo?: string } = {},
  ) =>
    (await data()).tasks
      .filter((t) => !filters.status || filters.status.includes(t.status))
      .filter(
        (t) => !filters.dueTo || (t.due_date && t.due_date <= filters.dueTo),
      )
      .sort((a, b) => (a.due_date ?? "9").localeCompare(b.due_date ?? "9")),
}));
vi.mock("@/lib/db/guests", async (original) => ({
  ...(await original<object>()),
  getGuestList: async () => (await data()).households,
}));
vi.mock("@/lib/db/gifts", async (original) => ({
  ...(await original<object>()),
  getGifts: async () => (await data()).gifts,
}));
vi.mock("@/lib/db/registry", async (original) => ({
  ...(await original<object>()),
  getRegistryLinks: async () => (await data()).registries,
}));
vi.mock("@/lib/db/vendors", async (original) => ({
  ...(await original<object>()),
  getVendors: async () => (await data()).vendors,
}));
vi.mock("@/lib/db/events", async (original) => ({
  ...(await original<object>()),
  getEvents: async (
    _db: unknown,
    _id: string,
    range: { from?: string; to?: string } = {},
  ) =>
    (await data()).events.filter(
      (e) =>
        (!range.from || e.ends_at >= range.from || e.starts_at >= range.from) &&
        (!range.to || e.starts_at <= range.to),
    ),
}));
vi.mock("@/lib/db/emails", async (original) => ({
  ...(await original<object>()),
  getEmails: async () => (await data()).emails,
  getEmail: async (_db: unknown, id: string) => {
    const email = (await data()).emails.find((e) => e.id === id);
    if (!email) throw new Error("not found");
    return { ...email, wedding_id: "w1" };
  },
}));

const { runAssistant } = await import("@/lib/ai/assistant");
const { AI_MODEL } = await import("@/lib/ai/client");

type Outcome = {
  id: string;
  category: string;
  pass: boolean;
  failures: string[];
  reply: string;
  actions: unknown[];
  seconds: number;
};
const outcomes: Outcome[] = [];

describe.skipIf(!process.env.RUN_EVALS)("Piper eval", () => {
  describe.concurrent.each(evalSet.examples)("$id ($category)", (example) => {
    it("agrees with the label", { timeout: 120_000 }, async () => {
      const started = Date.now();
      let result: { reply: string; actions: Record<string, unknown>[] };
      try {
        result = await runAssistant(
          {
            db: {} as never,
            weddingId: fixture.wedding.id,
            canEdit: example.canEdit,
            today: fixture.today,
          },
          example.turns as { role: "user" | "assistant"; content: string }[],
        );
      } catch (error) {
        result = { reply: `[error] ${String(error)}`, actions: [] };
      }
      const failures = gradePiper(result, example.expect as Expectation);
      outcomes.push({
        id: example.id,
        category: example.category,
        pass: failures.length === 0,
        failures,
        reply: result.reply,
        actions: result.actions,
        seconds: Math.round((Date.now() - started) / 100) / 10,
      });
      expect(failures).toEqual([]);
    });
  });

  afterAll(() => {
    outcomes.sort((a, b) => a.id.localeCompare(b.id));
    const passed = outcomes.filter((o) => o.pass).length;
    const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const dir = new URL("./results/", import.meta.url);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      new URL(`piper-${stamp}.json`, dir),
      `${JSON.stringify({ model: AI_MODEL, score: `${passed}/${outcomes.length}`, outcomes }, null, 2)}\n`,
    );
    console.log(
      `\nPiper eval: ${passed}/${outcomes.length} on ${AI_MODEL}. Saved results/piper-${stamp}.json`,
    );
  });
});
