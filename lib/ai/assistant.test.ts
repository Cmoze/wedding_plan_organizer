import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/tasks", () => ({
  OPEN_STATUSES: ["todo", "in_progress"],
  getTasks: async () => [
    {
      id: "t1",
      title: "Book the florist",
      status: "todo",
      due_date: "2026-11-01",
      category: "Flowers",
      notes: null,
    },
    {
      id: "t2",
      title: "Order invitations",
      status: "todo",
      due_date: null,
      category: "Stationery",
      notes: null,
    },
  ],
}));
vi.mock("@/lib/db/guests", () => ({
  getGuestList: async () => [
    {
      id: "h1",
      name: "The Millers",
      side: "partner1",
      guests: [
        {
          id: "g1",
          first_name: "Sue",
          last_name: "Miller",
          rsvp: "pending",
          meal_choice: null,
          email: null,
          phone: null,
        },
      ],
    },
  ],
}));
vi.mock("@/lib/db/gifts", () => ({
  getGifts: async () => [
    {
      id: "gift1",
      giver_name: "The Millers",
      description: "Stand mixer",
      received_on: null,
      thank_you_sent_at: null,
    },
  ],
}));

const { buildAssistantTools, checkAction, trimHistory } =
  await import("@/lib/ai/assistant");

const ctx = {
  db: {} as never,
  weddingId: "w1",
  canEdit: true,
  today: "2026-10-25",
};
const base = { label: "?", reason: "asked" };

function tool(tools: { name: string }[], name: string) {
  const found = tools.find((t) => t.name === name) as
    { run: (input: unknown) => Promise<string> } | undefined;
  if (!found) throw new Error(`no tool ${name}`);
  return found;
}

describe("site assistant", () => {
  it("only offers propose_action to people who can edit", () => {
    const names = (canEdit: boolean) =>
      buildAssistantTools({ ...ctx, canEdit }).tools.map((t) => t.name);
    expect(names(true)).toContain("propose_action");
    expect(names(false)).not.toContain("propose_action");
    expect(names(false)).toContain("list_tasks");
  });

  it("searches tasks by text", async () => {
    const { tools } = buildAssistantTools(ctx);
    const result = JSON.parse(
      await tool(tools, "list_tasks").run({ search: "florist" }),
    );
    expect(result).toEqual([expect.objectContaining({ id: "t1" })]);
  });

  it("finds guests by name with their ids", async () => {
    const { tools } = buildAssistantTools(ctx);
    const result = JSON.parse(
      await tool(tools, "find_guests").run({ search: "sue" }),
    );
    expect(result[0].guests).toEqual([
      expect.objectContaining({
        id: "g1",
        name: "Sue Miller",
        rsvp: "pending",
      }),
    ]);
  });

  it("collects valid proposals without saving them", async () => {
    const { tools, actions } = buildAssistantTools(ctx);
    const propose = tool(tools, "propose_action");
    expect(
      await propose.run({
        action: { ...base, kind: "complete_task", task_id: "t1" },
      }),
    ).toContain("button");
    expect(
      await propose.run({
        action: {
          ...base,
          kind: "set_rsvp",
          guest_id: "nope",
          rsvp: "attending",
        },
      }),
    ).toContain("Unknown guest_id");
    expect(actions).toEqual([
      { ...base, kind: "complete_task", task_id: "t1" },
    ]);
  });

  it("checks ids and cleans new items", async () => {
    expect(
      await checkAction(ctx, {
        ...base,
        kind: "mark_thank_you_sent",
        gift_id: "gift1",
      }),
    ).toMatchObject({ gift_id: "gift1" });
    expect(
      await checkAction(ctx, {
        ...base,
        kind: "task",
        title: "Call the DJ",
        due_date: "next week",
        category: null,
        notes: null,
      }),
    ).toMatchObject({ title: "Call the DJ", due_date: null });
    expect(
      await checkAction(ctx, {
        ...base,
        kind: "event",
        title: "Tasting",
        date: "soon",
        start_time: null,
        location: null,
      }),
    ).toEqual(expect.any(String));
  });

  it("adds guests, but not duplicates or to unknown households", async () => {
    const guest = {
      ...base,
      kind: "add_guest" as const,
      first_name: "Tom",
      last_name: "Miller",
      email: null,
      phone: null,
      plus_one_allowed: false,
      rsvp: "pending" as const,
      household_id: "h1",
      side: null,
      address_line1: null,
      city: null,
      region: null,
      postal_code: null,
      is_different_person: false,
    };
    expect(await checkAction(ctx, guest)).toEqual(guest);
    expect(
      await checkAction(ctx, { ...guest, household_id: "nope" }),
    ).toContain("Unknown household_id");
    const sue = { ...guest, first_name: "sue", household_id: null };
    expect(await checkAction(ctx, sue)).toContain(
      "Sue Miller is already on the guest list",
    );
    expect(
      await checkAction(ctx, { ...sue, is_different_person: true }),
    ).toMatchObject({ first_name: "sue" });
    expect(await checkAction(ctx, { ...guest, first_name: " " })).toContain(
      "first name",
    );
  });

  it("keeps recent history and starts with a user turn", () => {
    const turns = [
      { role: "assistant" as const, content: "Hi!" },
      { role: "user" as const, content: "x".repeat(5000) },
      { role: "assistant" as const, content: " " },
    ];
    const trimmed = trimHistory(turns);
    expect(trimmed).toHaveLength(1);
    expect(trimmed[0]).toMatchObject({ role: "user" });
    expect((trimmed[0].content as string).length).toBe(4000);
  });
});
