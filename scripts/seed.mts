// Demo wedding for development and the judges' demo.
//   npm run db:seed            create it (fails if it already exists)
//   npm run db:seed -- --reset delete it and create it again
// Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.
// Users are created with the service role; everything else is written as the demo users,
// so RLS and the create_wedding / accept_invite functions are exercised for real.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error(
    "Missing Supabase env vars; run with: node --env-file=.env scripts/seed.mts",
  );
  process.exit(1);
}

const DEMO_PASSWORD = "demo-password-123";
const DEMO_USERS = {
  couple: { email: "couple@demo.wedding", name: "Maya" },
  planner: { email: "planner@demo.wedding", name: "Linda (Maya's mom)" },
  helper: { email: "helper@demo.wedding", name: "Sam (maid of honor)" },
} as const;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function check<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string,
): NonNullable<R["data"]> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as NonNullable<R["data"]>;
}

const day = 86_400_000;
const dateFromToday = (days: number) =>
  new Date(Date.now() + days * day).toISOString().slice(0, 10);

async function findDemoUserIds(): Promise<string[]> {
  const { users } = check(
    await admin.auth.admin.listUsers({ perPage: 1000 }),
    "list users",
  );
  const emails = new Set<string>(Object.values(DEMO_USERS).map((u) => u.email));
  return users.filter((u) => u.email && emails.has(u.email)).map((u) => u.id);
}

async function reset() {
  const ids = await findDemoUserIds();
  if (ids.length === 0) return;
  const weddings = check(
    await admin
      .from("members")
      .select("wedding_id")
      .in("user_id", ids)
      .eq("role", "couple"),
    "find demo weddings",
  );
  const weddingIds = [...new Set(weddings.map((w) => w.wedding_id))];
  for (const id of weddingIds) {
    const files = check(
      await admin.storage.from("idea-photos").list(id),
      "list photos",
    );
    if (files.length > 0) {
      await admin.storage
        .from("idea-photos")
        .remove(files.map((f) => `${id}/${f.name}`));
    }
  }
  if (weddingIds.length > 0) {
    check(
      await admin.from("weddings").delete().in("id", weddingIds),
      "delete weddings",
    );
  }
  for (const id of ids)
    check(await admin.auth.admin.deleteUser(id), "delete user");
  console.log(
    `Reset: removed ${weddingIds.length} wedding(s) and ${ids.length} demo user(s).`,
  );
}

async function signedInAs(email: string): Promise<SupabaseClient> {
  const client = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  check(
    await client.auth.signInWithPassword({ email, password: DEMO_PASSWORD }),
    `sign in ${email}`,
  );
  return client;
}

async function seed() {
  for (const user of Object.values(DEMO_USERS)) {
    check(
      await admin.auth.admin.createUser({
        email: user.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: user.name },
      }),
      `create ${user.email} (already seeded? use --reset)`,
    );
  }

  const couple = await signedInAs(DEMO_USERS.couple.email);
  const wedding = check(
    await couple
      .rpc("create_wedding", {
        _partner1_name: "Maya",
        _partner2_name: "Jordan",
        _wedding_date: dateFromToday(240),
        _budget_total: 30000,
        _guest_count_estimate: 120,
        _display_name: DEMO_USERS.couple.name,
      })
      .single(),
    "create wedding",
  ) as { id: string; email_slug: string };
  const w = wedding.id;

  for (const role of ["planner", "helper"] as const) {
    const invite = check(
      await couple
        .from("invites")
        .insert({ wedding_id: w, role })
        .select()
        .single(),
      `invite ${role}`,
    );
    const member = await signedInAs(DEMO_USERS[role].email);
    check(
      await member.rpc("accept_invite", {
        _token: invite.token,
        _display_name: DEMO_USERS[role].name,
      }),
      `accept ${role} invite`,
    );
  }

  const members = check(
    await couple.from("members").select("id, role").eq("wedding_id", w),
    "members",
  );
  const memberId = (role: string) => members.find((m) => m.role === role)!.id;

  const vendors = check(
    await couple
      .from("vendors")
      .insert([
        {
          wedding_id: w,
          name: "Willow Creek Barn",
          type: "Venue",
          contact_name: "Dana Reyes",
          phone: "(512) 555-0142",
          email: "events@willowcreekbarn.example",
          status: "booked",
        },
        {
          wedding_id: w,
          name: "Bloom & Vine",
          type: "Florist",
          contact_name: "Priya Shah",
          email: "hello@bloomandvine.example",
          status: "contacted",
        },
        {
          wedding_id: w,
          name: "Golden Hour Photo",
          type: "Photographer",
          contact_name: "Marcus Lee",
          phone: "(512) 555-0199",
          status: "booked",
        },
        {
          wedding_id: w,
          name: "Smokey's BBQ Catering",
          type: "Caterer",
          phone: "(512) 555-0110",
          status: "considering",
        },
        {
          wedding_id: w,
          name: "DJ Rhythm",
          type: "DJ",
          email: "book@djrhythm.example",
          status: "considering",
        },
      ])
      .select("id, name"),
    "vendors",
  );
  const vendorId = (name: string) => vendors.find((v) => v.name === name)!.id;

  const tasks = check(
    await couple.from("tasks").select("id, title").eq("wedding_id", w),
    "tasks",
  );
  const taskId = (title: string) => tasks.find((t) => t.title === title)!.id;
  const taskUpdates: [string, Record<string, unknown>][] = [
    ["Set the overall budget", { status: "done" }],
    ["Pick a wedding date", { status: "done" }],
    [
      "Draft the guest list",
      { status: "in_progress", assignee_id: memberId("planner") },
    ],
    [
      "Tour and book the ceremony venue",
      { status: "booked", vendor_id: vendorId("Willow Creek Barn") },
    ],
    [
      "Tour and book the reception venue",
      { status: "booked", vendor_id: vendorId("Willow Creek Barn") },
    ],
    [
      "Book the photographer",
      { status: "booked", vendor_id: vendorId("Golden Hour Photo") },
    ],
    ["Book the officiant", { due_date: dateFromToday(-5) }],
    [
      "Book the caterer",
      {
        due_date: dateFromToday(-2),
        vendor_id: vendorId("Smokey's BBQ Catering"),
      },
    ],
    [
      "Reserve hotel room blocks for guests",
      { due_date: dateFromToday(3), assignee_id: memberId("helper") },
    ],
    [
      "Book the florist",
      { due_date: dateFromToday(5), vendor_id: vendorId("Bloom & Vine") },
    ],
    [
      "Shop for the wedding dress or suit",
      { due_date: dateFromToday(6), assignee_id: memberId("helper") },
    ],
  ];
  for (const [title, patch] of taskUpdates) {
    check(
      await couple.from("tasks").update(patch).eq("id", taskId(title)),
      `update task ${title}`,
    );
  }
  check(
    await couple.from("tasks").insert({
      wedding_id: w,
      title: "Plan the bridal shower",
      category: "Planning",
      due_date: dateFromToday(20),
      assignee_id: memberId("helper"),
      sort_order: 100,
    }),
    "custom task",
  );

  check(
    await couple.from("budget_items").insert([
      {
        wedding_id: w,
        category: "Venue",
        description: "Barn rental deposit",
        estimated: 4000,
        actual: 4000,
        paid: 4000,
        vendor_id: vendorId("Willow Creek Barn"),
      },
      {
        wedding_id: w,
        category: "Venue",
        description: "Barn rental balance",
        estimated: 6000,
        actual: 6500,
        paid: 0,
        due_date: dateFromToday(25),
        vendor_id: vendorId("Willow Creek Barn"),
      },
      {
        wedding_id: w,
        category: "Photography",
        description: "Photographer retainer",
        estimated: 1500,
        actual: 1500,
        paid: 1500,
        vendor_id: vendorId("Golden Hour Photo"),
      },
      {
        wedding_id: w,
        category: "Photography",
        description: "Photographer final payment",
        estimated: 2000,
        paid: 0,
        due_date: dateFromToday(225),
        vendor_id: vendorId("Golden Hour Photo"),
      },
      {
        wedding_id: w,
        category: "Catering",
        description: "Catering estimate (120 guests)",
        estimated: 7200,
        paid: 0,
      },
      {
        wedding_id: w,
        category: "Flowers",
        description: "Bouquets and centerpieces",
        estimated: 2500,
        paid: 0,
        due_date: dateFromToday(60),
        vendor_id: vendorId("Bloom & Vine"),
      },
      {
        wedding_id: w,
        category: "Attire",
        description: "Wedding dress",
        estimated: 1800,
        paid: 0,
        due_date: dateFromToday(10),
      },
      {
        wedding_id: w,
        category: "Music",
        description: "DJ",
        estimated: 1200,
        paid: 0,
      },
    ]),
    "budget",
  );

  check(
    await couple.from("events").insert([
      {
        wedding_id: w,
        title: "Engagement photos",
        starts_at: new Date(Date.now() + 12 * day).toISOString(),
        location: "Zilker Park",
      },
      {
        wedding_id: w,
        title: "Bridal shower",
        starts_at: new Date(Date.now() + 150 * day).toISOString(),
        location: "Linda's house",
      },
      {
        wedding_id: w,
        title: "Dress fitting",
        starts_at: new Date(Date.now() + 180 * day).toISOString(),
      },
      {
        wedding_id: w,
        title: "Rehearsal dinner",
        starts_at: new Date(Date.now() + 239 * day).toISOString(),
        location: "Willow Creek Barn",
      },
    ]),
    "events",
  );

  const households = [
    {
      name: "Linda & Tom Carter",
      address_line1: "418 Maple Ave",
      city: "Austin",
      region: "TX",
      postal_code: "78704",
      side: "partner1",
      guests: [
        ["Linda", "Carter", "attending"],
        ["Tom", "Carter", "attending"],
      ],
    },
    {
      name: "The Nguyen Family",
      address_line1: "77 Lakeview Dr",
      city: "Dallas",
      region: "TX",
      postal_code: "75201",
      side: "partner2",
      guests: [
        ["Hoa", "Nguyen", "attending"],
        ["Minh", "Nguyen", "pending"],
        ["Lily", "Nguyen", "pending", true],
      ],
    },
    {
      name: "Sam Patel",
      address_line1: "9 Elm St, Apt 3",
      city: "Austin",
      region: "TX",
      postal_code: "78701",
      side: "partner1",
      guests: [["Sam", "Patel", "attending"]],
    },
    {
      name: "Grandma Rose Carter",
      address_line1: "12 Oak Ln",
      city: "San Antonio",
      region: "TX",
      postal_code: "78205",
      side: "partner1",
      guests: [["Rose", "Carter", "attending"]],
    },
    {
      name: "Chris & Alex Romero",
      address_line1: "305 Pine Ct",
      city: "Houston",
      region: "TX",
      postal_code: "77002",
      side: "partner2",
      guests: [
        ["Chris", "Romero", "declined"],
        ["Alex", "Romero", "declined"],
      ],
    },
    {
      name: "Jordan's college friends",
      side: "partner2",
      guests: [
        ["Taylor", "Brooks", "pending"],
        ["Riley", "Kim", "pending"],
      ],
    },
  ] satisfies {
    guests: [string, string, string, boolean?][];
    [field: string]: unknown;
  }[];
  const householdIds = new Map<string, string>();
  for (const { guests, ...household } of households) {
    const h = check(
      await couple
        .from("households")
        .insert({ ...household, wedding_id: w })
        .select("id")
        .single(),
      `household ${household.name}`,
    );
    householdIds.set(household.name, h.id);
    check(
      await couple.from("guests").insert(
        guests.map(([first_name, last_name, rsvp, is_child]) => ({
          wedding_id: w,
          household_id: h.id,
          first_name,
          last_name,
          rsvp,
          is_child: Boolean(is_child),
          meal_choice: rsvp === "attending" ? "Brisket" : null,
        })),
      ),
      "guests",
    );
  }

  const board = check(
    await couple
      .from("idea_boards")
      .insert({ wedding_id: w, title: "Flowers", category: "Decor" })
      .select("id")
      .single(),
    "idea board",
  );
  check(
    await couple.from("idea_boards").insert([
      { wedding_id: w, title: "Cake", category: "Food" },
      { wedding_id: w, title: "Dresses", category: "Attire" },
    ]),
    "idea boards",
  );
  const ideas = check(
    await couple
      .from("idea_items")
      .insert([
        {
          wedding_id: w,
          board_id: board.id,
          caption: "Wildflower bouquets",
          link_url:
            "https://www.pinterest.com/search/pins/?q=wildflower%20bouquet",
        },
        {
          wedding_id: w,
          board_id: board.id,
          caption: "Mason jar centerpieces",
          link_url:
            "https://www.pinterest.com/search/pins/?q=mason%20jar%20centerpiece",
        },
      ])
      .select("id"),
    "ideas",
  );
  const helper = await signedInAs(DEMO_USERS.helper.email);
  const planner = await signedInAs(DEMO_USERS.planner.email);
  check(
    await helper.from("comments").insert({
      wedding_id: w,
      idea_item_id: ideas[0].id,
      body: "Love these! Sunflowers too?",
    }),
    "comment",
  );
  check(
    await planner.from("comments").insert({
      wedding_id: w,
      task_id: taskId("Draft the guest list"),
      body: "I added Dad's side, still waiting on Jordan's.",
    }),
    "task comment",
  );
  for (const client of [helper, planner]) {
    check(
      await client
        .from("reactions")
        .insert({ wedding_id: w, idea_item_id: ideas[0].id }),
      "reaction",
    );
  }
  check(
    await helper
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId("Reserve hotel room blocks for guests")),
    "helper updates own task",
  );

  const [amazon, target] = check(
    await couple
      .from("registry_links")
      .insert([
        {
          wedding_id: w,
          store_name: "Amazon",
          url: "https://www.amazon.com/wedding",
        },
        {
          wedding_id: w,
          store_name: "Target",
          url: "https://www.target.com/gift-registry",
        },
      ])
      .select("id"),
    "registry",
  );

  check(
    await couple.from("gifts").insert([
      {
        wedding_id: w,
        household_id: householdIds.get("Grandma Rose Carter"),
        giver_name: "Grandma Rose Carter",
        description: "Hand-stitched quilt",
        received_on: dateFromToday(-20),
        thank_you_sent_at: new Date(Date.now() - 10 * day).toISOString(),
      },
      {
        wedding_id: w,
        household_id: householdIds.get("The Nguyen Family"),
        giver_name: "The Nguyen Family",
        description: "Stand mixer",
        registry_link_id: amazon.id,
        received_on: dateFromToday(-8),
      },
      {
        wedding_id: w,
        household_id: householdIds.get("The Nguyen Family"),
        giver_name: "The Nguyen Family",
        description: "Set of wine glasses",
        registry_link_id: target.id,
        received_on: dateFromToday(-8),
      },
      {
        wedding_id: w,
        giver_name: "Maya's coworkers",
        description: "Restaurant gift card",
        received_on: dateFromToday(-3),
        notes: "Card signed by the whole design team",
      },
    ]),
    "gifts",
  );

  check(
    await admin.from("emails").insert([
      {
        wedding_id: w,
        provider_message_id: `demo-${w}-1`,
        from_address: "events@willowcreekbarn.example",
        from_name: "Dana at Willow Creek Barn",
        to_address: `${wedding.email_slug}@example.resend.app`,
        subject: "Your balance is due soon",
        body_text: `Hi Maya, a friendly reminder that the remaining balance of $6,500 is due ${dateFromToday(25)}. Thanks! Dana`,
        received_at: new Date(Date.now() - 2 * day).toISOString(),
      },
      {
        wedding_id: w,
        provider_message_id: `demo-${w}-2`,
        from_address: "hello@bloomandvine.example",
        from_name: "Priya at Bloom & Vine",
        to_address: `${wedding.email_slug}@example.resend.app`,
        subject: "Florals quote",
        body_text:
          "Thanks for reaching out! Our quote for bouquets and centerpieces is $2,500, with a $500 deposit due within two weeks.",
        received_at: new Date(Date.now() - 1 * day).toISOString(),
      },
    ]),
    "emails",
  );

  console.log(`Seeded wedding ${wedding.email_slug} (${w}).`);
  console.log(
    `Log in as ${Object.values(DEMO_USERS)
      .map((u) => u.email)
      .join(", ")} with password ${DEMO_PASSWORD}`,
  );
}

if (process.argv.includes("--reset")) await reset();
await seed();
