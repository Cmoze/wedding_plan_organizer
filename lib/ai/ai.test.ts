import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const generateStructured = vi.fn();
vi.mock("@/lib/ai/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/client")>()),
  generateStructured: (...args: unknown[]) => generateStructured(...args),
}));

const { AiError } = await import("@/lib/ai/client");
const { buildEmailPrompt, cleanEmailSuggestions, suggestEmailActions } =
  await import("@/lib/ai/email-actions");
const { cleanChecklistSuggestions } = await import("@/lib/ai/checklist");
const { buildInboxPrompt, summarizeInbox } =
  await import("@/lib/ai/inbox-summary");
const { fallbackWeeklySummary, getWeeklySummary } =
  await import("@/lib/ai/weekly-summary");
const { takeRateLimit } = await import("@/lib/ai/rate-limit");
const { cleanDate, findByName } = await import("@/lib/ai/suggestions");

beforeEach(() => {
  generateStructured.mockReset();
});

async function failAi(): Promise<never> {
  throw new AiError("down", "unavailable");
}

const email = {
  from_address: "hello@bloomandvine.example",
  from_name: "Priya at Bloom & Vine",
  subject: "Florals quote",
  received_at: "2026-10-20T15:00:00Z",
  body_text: "Our quote is $2,500, with a $500 deposit due within two weeks.",
  body_html: null,
};
const context = {
  today: "2026-10-23",
  wedding: {
    partner1_name: "Maya",
    partner2_name: "Sam",
    wedding_date: "2027-06-12",
  },
  vendors: [{ name: "Willow Creek Barn", type: "Venue" }],
  budgetItems: [],
  openTasks: [{ title: "Book florist", due_date: "2026-11-01" }],
  households: [
    {
      name: "The Millers",
      guests: [
        { first_name: "Sue", last_name: "Miller" },
        { first_name: "Tom", last_name: null },
      ],
    },
  ],
  registries: [{ store_name: "Zola" }],
};

describe("email → actions", () => {
  it("puts the email inside <email> tags with the planner context", () => {
    const prompt = buildEmailPrompt(email, context);
    expect(prompt).toContain("Today is 2026-10-23");
    expect(prompt).toContain("Willow Creek Barn (Venue)");
    expect(prompt).toContain("Book florist (due 2026-11-01)");
    expect(prompt).toMatch(/<email>[\s\S]*\$500 deposit[\s\S]*<\/email>/);
    expect(prompt).toContain("Received: 2026-10-20");
  });

  it("falls back to stripped HTML when there's no plain text", () => {
    const prompt = buildEmailPrompt(
      {
        ...email,
        body_text: null,
        body_html: "<p>Deposit &amp; balance</p><script>x()</script>",
      },
      context,
    );
    expect(prompt).toContain("Deposit & balance");
    expect(prompt).not.toContain("x()");
  });

  it("drops suggestions with broken dates and keeps the rest", () => {
    const base = { label: "?", reason: "r" };
    const cleaned = cleanEmailSuggestions([
      {
        ...base,
        kind: "budget_item",
        category: "Flowers",
        description: "Deposit",
        amount: 500,
        due_date: "Nov 3",
        vendor_name: "Bloom & Vine",
      },
      {
        ...base,
        kind: "event",
        title: "Tasting",
        date: "not a date",
        start_time: null,
        location: null,
      },
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]).toMatchObject({ kind: "budget_item", due_date: null });
  });

  it("lists households and registries so gifts can be matched", () => {
    const prompt = buildEmailPrompt(email, context);
    expect(prompt).toContain("The Millers (Sue Miller, Tom)");
    expect(prompt).toMatch(/Registries:\n- Zola/);
  });

  it("keeps gifts with a giver and an item, cleaning the date", () => {
    const base = {
      kind: "gift" as const,
      label: "?",
      reason: "r",
      household_name: "The Millers",
      store_name: "Zola",
    };
    const cleaned = cleanEmailSuggestions([
      {
        ...base,
        giver_name: "Sue Miller",
        description: "Stand mixer",
        received_on: "yesterday",
      },
      { ...base, giver_name: " ", description: "Towels", received_on: null },
    ]);
    expect(cleaned).toEqual([
      expect.objectContaining({ giver_name: "Sue Miller", received_on: null }),
    ]);
  });

  it("passes AI errors through so the route can show them", async () => {
    generateStructured.mockImplementation(failAi);
    const error = await suggestEmailActions(email, context).catch((e) => e);
    expect(error).toMatchObject({ name: "AiError", code: "unavailable" });
  });
});

describe("ask your inbox", () => {
  const inbox = [
    { ...email, id: "e1" },
    {
      ...email,
      id: "e2",
      subject: "Gift for you",
      body_text: "Sue Miller bought you a stand mixer from your Zola registry.",
    },
  ];
  const mixer = {
    kind: "gift" as const,
    label: "Record a stand mixer from Sue Miller?",
    reason: "bought you a stand mixer",
    giver_name: "Sue Miller",
    household_name: "The Millers",
    description: "Stand mixer",
    store_name: "Zola",
    received_on: null,
  };

  it("puts every email in its own tagged block, with the question", () => {
    const prompt = buildInboxPrompt(inbox, context, "Any gifts?");
    expect(prompt).toContain('<email id="e1">');
    expect(prompt).toMatch(/<email id="e2">[\s\S]*stand mixer[\s\S]*<\/email>/);
    expect(prompt).toMatch(/<question>\nAny gifts\?\n<\/question>/);
    expect(prompt).toContain("Willow Creek Barn (Venue)");
  });

  it("asks for a general summary when no question is given", () => {
    expect(buildInboxPrompt(inbox, context, "  ")).toContain(
      "what we should do next",
    );
  });

  it("keeps several suggestions and drops made-up email ids", async () => {
    generateStructured.mockResolvedValue({
      summary: "Bloom & Vine sent a quote and Sue sent a gift.",
      suggestions: [
        { email_id: "e2", suggestion: mixer },
        { email_id: "nope", suggestion: { ...mixer, description: "Towels" } },
        { email_id: "e1", suggestion: { ...mixer, giver_name: " " } },
      ],
    });
    const result = await summarizeInbox(inbox, context, "");
    expect(result.summary).toContain("Sue sent a gift");
    expect(result.suggestions).toEqual([
      { emailId: "e2", suggestion: mixer },
      { emailId: null, suggestion: { ...mixer, description: "Towels" } },
    ]);
  });

  it("skips the AI call for an empty inbox", async () => {
    const result = await summarizeInbox([], context, "");
    expect(result.suggestions).toEqual([]);
    expect(generateStructured).not.toHaveBeenCalled();
  });
});

describe("weekly summary", () => {
  const input = {
    today: "2026-10-23",
    weddingDate: "2026-11-02",
    overdue: [
      {
        id: "t1",
        title: "Send invites",
        due_date: "2026-10-01",
        assignee_id: null,
      },
    ],
    upcoming: [
      {
        id: "t2",
        title: "Final fitting",
        due_date: "2026-10-30",
        assignee_id: null,
      },
    ],
    paymentsDue: [
      {
        description: "Venue balance",
        estimated: 8000,
        actual: null,
        paid: 1500,
        due_date: "2026-10-28",
      },
    ],
    memberNames: {},
  };

  it("builds a plain summary without AI, overdue first", () => {
    const summary = fallbackWeeklySummary(input);
    expect(summary.source).toBe("fallback");
    expect(summary.headline).toContain("10 days to go");
    expect(summary.items.map((i) => i.title)).toEqual([
      "Send invites",
      "Pay Venue balance",
      "Final fitting",
    ]);
    expect(summary.items[1].detail).toBe("$6500 due 2026-10-28.");
  });

  it("falls back when the AI is down", async () => {
    generateStructured.mockImplementation(failAi);
    expect((await getWeeklySummary(input)).source).toBe("fallback");
  });

  it("drops task ids the AI made up", async () => {
    generateStructured.mockResolvedValue({
      headline: "Ten days left!",
      items: [
        { title: "Invites", detail: "Late", task_id: "t1" },
        { title: "Other", detail: "?", task_id: "nope" },
      ],
    });
    const summary = await getWeeklySummary(input);
    expect(summary.source).toBe("ai");
    expect(summary.items.map((i) => i.taskId)).toEqual(["t1", null]);
  });

  it("skips the AI call when there's nothing to do", async () => {
    const summary = await getWeeklySummary({
      ...input,
      overdue: [],
      upcoming: [],
      paymentsDue: [],
    });
    expect(summary.headline).toContain("Nothing urgent");
    expect(generateStructured).not.toHaveBeenCalled();
  });
});

describe("personalized checklist", () => {
  it("drops unknown task ids and moves into the past", () => {
    const input = {
      today: "2026-10-23",
      wedding: {
        wedding_date: "2026-12-12",
        budget_total: 15000,
        guest_count_estimate: 200,
      },
      tasks: [
        {
          id: "a",
          title: "Book venue",
          category: null,
          due_date: "2026-01-01",
        },
      ],
      doneTitles: [],
    };
    const base = { label: "?", reason: "r" };
    const cleaned = cleanChecklistSuggestions(
      [
        { ...base, kind: "move_task", task_id: "a", due_date: "2026-10-30" },
        { ...base, kind: "move_task", task_id: "a", due_date: "2026-10-01" },
        { ...base, kind: "remove_task", task_id: "zzz" },
        {
          ...base,
          kind: "add_task",
          title: "Hotel room block",
          category: null,
          due_date: "soon",
          notes: null,
        },
      ],
      input,
    );
    expect(cleaned).toEqual([
      { ...base, kind: "move_task", task_id: "a", due_date: "2026-10-30" },
      {
        ...base,
        kind: "add_task",
        title: "Hotel room block",
        category: null,
        due_date: null,
        notes: null,
      },
    ]);
  });
});

describe("helpers", () => {
  it("rate limits per key within the window", () => {
    const limit = { max: 2, windowMs: 1000 };
    expect(takeRateLimit("u", 0, limit)).toBe(true);
    expect(takeRateLimit("u", 10, limit)).toBe(true);
    expect(takeRateLimit("u", 20, limit)).toBe(false);
    expect(takeRateLimit("other", 20, limit)).toBe(true);
    expect(takeRateLimit("u", 1500, limit)).toBe(true);
  });

  it("matches vendors loosely by name", () => {
    const vendors = [
      { id: "1", name: "Bloom & Vine Florals" },
      { id: "2", name: "Willow Creek Barn" },
    ];
    expect(findByName(vendors, "bloom and vine")?.id).toBe("1");
    expect(findByName(vendors, "Willow Creek Barn")?.id).toBe("2");
    expect(findByName(vendors, "Lens Studio")).toBeNull();
    expect(findByName(vendors, null)).toBeNull();
  });

  it("only accepts real YYYY-MM-DD dates", () => {
    expect(cleanDate("2026-11-03")).toBe("2026-11-03");
    expect(cleanDate("2026-13-40")).toBeNull();
    expect(cleanDate("Nov 3")).toBeNull();
    expect(cleanDate(null)).toBeNull();
  });
});
