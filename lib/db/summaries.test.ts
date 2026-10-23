import { describe, expect, it } from "vitest";
import { describeActivity } from "@/lib/db/activity";
import { summarizeBudget } from "@/lib/db/budget";
import { mergeCalendarItems } from "@/lib/db/calendar";
import { groupTasksByTimeframe, type Task } from "@/lib/db/tasks";

describe("summarizeBudget", () => {
  it("uses actual cost when known, else the estimate, and totals by category", () => {
    const summary = summarizeBudget(20000, [
      { category: "Venue", estimated: 8000, actual: 8500, paid: 2000 },
      { category: "Flowers", estimated: 1200, actual: null, paid: 0 },
      { category: "Venue", estimated: 500, actual: null, paid: 500 },
    ]);
    expect(summary).toMatchObject({
      budgetTotal: 20000,
      estimated: 9700,
      committed: 10200,
      paid: 2500,
      remaining: 9800,
    });
    expect(summary.byCategory[0]).toEqual({
      category: "Venue",
      estimated: 8500,
      committed: 9000,
      paid: 2500,
    });
  });

  it("has no remaining amount without a budget", () => {
    expect(summarizeBudget(null, []).remaining).toBeNull();
  });
});

describe("mergeCalendarItems", () => {
  it("merges tasks, events and payments in date order", () => {
    const items = mergeCalendarItems(
      [
        {
          id: "t1",
          title: "Book florist",
          due_date: "2027-03-01",
          status: "booked",
        },
        { id: "t2", title: "No date", due_date: null, status: "todo" },
      ],
      [
        {
          id: "e1",
          title: "Shower",
          starts_at: "2027-02-10T18:00:00Z",
          ends_at: null,
          all_day: false,
        },
      ],
      [
        {
          id: "b1",
          category: "Venue",
          description: "Deposit",
          due_date: "2027-01-15",
          estimated: 1000,
          actual: null,
          paid: 0,
        },
      ],
    );
    expect(items.map((i) => [i.kind, i.id, i.done])).toEqual([
      ["payment", "b1", false],
      ["event", "e1", false],
      ["task", "t1", true],
    ]);
    expect(items[0].title).toBe("Payment due: Deposit");
  });
});

describe("groupTasksByTimeframe", () => {
  const task = (
    id: string,
    months_before: number | null,
    due_date: string | null = null,
  ) => ({ id, months_before, due_date }) as Task;

  it("groups by checklist offset, falling back to due date vs. wedding date", () => {
    const groups = groupTasksByTimeframe(
      [
        task("a", 12),
        task("b", 0.5),
        task("c", null, "2027-04-01"),
        task("d", null),
      ],
      "2027-06-01",
    );
    expect(groups.map((g) => [g.label, g.tasks.map((t) => t.id)])).toEqual([
      ["12+ months out", ["a"]],
      ["1 to 3 months out", ["c"]],
      ["Final month", ["b"]],
      ["No date", ["d"]],
    ]);
  });
});

describe("describeActivity", () => {
  it("reads naturally", () => {
    expect(
      describeActivity({
        actor_name: "Pat",
        action: "completed",
        entity_type: "tasks",
        summary: "Book the florist",
      }),
    ).toBe('Pat completed task "Book the florist"');
    expect(
      describeActivity({
        actor_name: null,
        action: "created",
        entity_type: "members",
        summary: "Lou",
      }),
    ).toBe("Lou joined");
  });
});
