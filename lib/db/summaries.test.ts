import { describe, expect, it } from "vitest";
import { describeActivity } from "@/lib/db/activity";
import { summarizeBudget } from "@/lib/db/budget";
import { mergeCalendarItems } from "@/lib/db/calendar";
import {
  budgetCategoryFor,
  setsTheBudget,
  sortTasksInPlanOrder,
} from "@/lib/db/tasks";

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

describe("sortTasksInPlanOrder", () => {
  it("follows the checklist order, then the order tasks were added", () => {
    const sorted = sortTasksInPlanOrder([
      { id: "c", sort_order: 42, created_at: "2026-10-02T00:00:00Z" },
      { id: "b", sort_order: 5, created_at: "2026-10-01T00:00:00Z" },
      { id: "d", sort_order: 42, created_at: "2026-10-03T00:00:00Z" },
      { id: "a", sort_order: 1, created_at: "2026-10-01T00:00:00Z" },
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("budgetCategoryFor", () => {
  it("files a task's cost under a budget category", () => {
    expect(
      budgetCategoryFor({
        title: "Tour and book the reception venue",
        category: "Venue",
      }),
    ).toBe("Venue");
    expect(
      budgetCategoryFor({
        title: "Book the photographer",
        category: "Vendors",
      }),
    ).toBe("Photography");
    expect(
      budgetCategoryFor({
        title: "Order the wedding cake",
        category: "Vendors",
      }),
    ).toBe("Catering");
    expect(
      budgetCategoryFor({ title: "Plan the rehearsal dinner", category: null }),
    ).toBe("Other");
  });
});

describe("setsTheBudget", () => {
  it("spots the task whose amount is the total budget", () => {
    expect(setsTheBudget({ title: "Set the overall budget" })).toBe(true);
    expect(
      setsTheBudget({ title: "Prepare final vendor payments and tips" }),
    ).toBe(false);
    expect(setsTheBudget({ title: "Book the photographer" })).toBe(false);
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
