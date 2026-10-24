// Signs in as each role in the seeded demo wedding and checks what RLS allows and blocks.
// Runs against the shared dev project, so it is skipped by `npm test`. Run it with:
//   npm run db:seed -- --reset && npm run test:db

import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  deleteBudgetItem,
  getBudgetItems,
  getBudgetSummary,
} from "@/lib/db/budget";
import { getCalendarItems } from "@/lib/db/calendar";
import { addComment, deleteComment } from "@/lib/db/comments";
import { getEmails } from "@/lib/db/emails";
import { addGuest, getGuestList, removeGuest } from "@/lib/db/guests";
import {
  IDEA_PHOTOS_BUCKET,
  createIdeaItem,
  deleteIdeaItem,
  getIdeaBoards,
  getIdeaItems,
  uploadIdeaPhoto,
} from "@/lib/db/ideas";
import {
  acceptInvite,
  createInvite,
  deleteInvite,
  getInvitePreview,
  listInvites,
} from "@/lib/db/invites";
import type { Db } from "@/lib/db/shared";
import {
  createTask,
  deleteTask,
  finishTaskWithDetails,
  getTasks,
  updateTask,
} from "@/lib/db/tasks";
import { createVendor, deleteVendor } from "@/lib/db/vendors";
import {
  getMembers,
  getMyMembership,
  getMyWeddings,
  getWedding,
  removeMember,
  updateMember,
  updateWedding,
} from "@/lib/db/weddings";
import type { Database } from "@/lib/db/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PASSWORD = "demo-password-123";
const OUTSIDER = "outsider@demo.wedding";

const newClient = () =>
  createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as Db;

async function signIn(email: string): Promise<Db> {
  const db = newClient();
  const { error } = await db.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error)
    throw new Error(`${email}: ${error.message} (run npm run db:seed first)`);
  return db;
}

describe.skipIf(!process.env.RUN_DB_TESTS)(
  "permissions in the demo wedding",
  () => {
    let couple: Db, planner: Db, helper: Db, outsider: Db;
    let weddingId: string;
    let outsiderId: string;
    // Created in beforeAll, not here: describe bodies run even when skipped, and
    // createClient throws without a URL (so `npm test` failed on machines without .env values).
    let admin: Db;

    beforeAll(async () => {
      admin = createClient<Database>(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }) as Db;
      [couple, planner, helper] = await Promise.all([
        signIn("couple@demo.wedding"),
        signIn("planner@demo.wedding"),
        signIn("helper@demo.wedding"),
      ]);
      weddingId = (await getMyWeddings(couple))[0].id;
      const { data, error } = await admin.auth.admin.createUser({
        email: OUTSIDER,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      outsiderId = data.user.id;
      outsider = await signIn(OUTSIDER);
    });

    afterAll(async () => {
      if (outsiderId) await admin.auth.admin.deleteUser(outsiderId);
    });

    describe("outsider (not a member)", () => {
      it("sees nothing", async () => {
        expect(await getMyWeddings(outsider)).toEqual([]);
        expect(await getTasks(outsider, weddingId)).toEqual([]);
        expect(await getGuestList(outsider, weddingId)).toEqual([]);
        expect(await getEmails(outsider, weddingId)).toEqual([]);
        await expect(getWedding(outsider, weddingId)).rejects.toThrow();
      });

      it("can't write", async () => {
        await expect(
          createTask(outsider, weddingId, { title: "Sneaky" }),
        ).rejects.toThrow();
      });

      it("signed-out visitors see nothing either", async () => {
        expect(await getTasks(newClient(), weddingId)).toEqual([]);
      });
    });

    describe("helper", () => {
      it("can read the wedding", async () => {
        expect((await getMyMembership(helper, weddingId))?.role).toBe("helper");
        expect((await getTasks(helper, weddingId)).length).toBeGreaterThan(40);
        expect((await getGuestList(helper, weddingId)).length).toBeGreaterThan(
          0,
        );
        expect(
          (await getBudgetSummary(helper, weddingId)).byCategory.length,
        ).toBeGreaterThan(0);
      });

      it("can update status and notes on their own task, nothing else", async () => {
        const me = (await getMyMembership(helper, weddingId))!;
        const [mine] = await getTasks(helper, weddingId, { assigneeId: me.id });
        expect(mine).toBeDefined();
        const updated = await updateTask(helper, mine.id, {
          status: "done",
          notes: "Called the hotel",
        });
        expect(updated.completed_at).not.toBeNull();
        await updateTask(helper, mine.id, { status: "in_progress" });
        await expect(
          updateTask(helper, mine.id, { title: "Renamed" }),
        ).rejects.toThrow(/only change the status and notes/);
      });

      it("can't update other people's tasks, add tasks or vendors, or invite", async () => {
        const [unassigned] = await getTasks(helper, weddingId, {
          assigneeId: null,
        });
        await expect(
          updateTask(helper, unassigned.id, { status: "done" }),
        ).rejects.toThrow();
        await expect(
          createTask(helper, weddingId, { title: "Nope" }),
        ).rejects.toThrow();
        await expect(
          createVendor(helper, weddingId, { name: "Nope" }),
        ).rejects.toThrow();
        await expect(createInvite(helper, weddingId)).rejects.toThrow();
      });

      it("can comment", async () => {
        const [task] = await getTasks(helper, weddingId);
        const comment = await addComment(
          helper,
          weddingId,
          { taskId: task.id },
          "On it!",
        );
        await deleteComment(helper, comment.id);
      });

      it("can add ideas and photos, and delete their own but not others'", async () => {
        const [board] = await getIdeaBoards(helper, weddingId);
        const file = new File(["x"], "pic.png", { type: "image/png" });
        const path = await uploadIdeaPhoto(helper, weddingId, file);
        const mine = await createIdeaItem(helper, weddingId, {
          board_id: board.id,
          photo_path: path,
          caption: "Helper idea",
        });
        await deleteIdeaItem(helper, mine.id);
        const { error } = await helper.storage
          .from(IDEA_PHOTOS_BUCKET)
          .remove([path]);
        expect(error).toBeNull();

        const theirs = await createIdeaItem(couple, weddingId, {
          board_id: board.id,
          caption: "Couple idea",
        });
        await deleteIdeaItem(helper, theirs.id);
        const items = await getIdeaItems(couple, board.id);
        expect(items.some((i) => i.id === theirs.id)).toBe(true);
        await deleteIdeaItem(couple, theirs.id);
      });
    });

    describe("planner", () => {
      it("can add and delete tasks", async () => {
        const task = await createTask(planner, weddingId, {
          title: "Order favors",
        });
        await deleteTask(planner, task.id);
      });

      it("finishes a task with details that land in the budget once", async () => {
        const task = await createTask(planner, weddingId, {
          title: "Book the photographer",
          category: "Vendors",
        });
        const all = await getTasks(planner, weddingId);
        expect(Math.max(...all.map((t) => t.sort_order))).toBe(task.sort_order);

        const done = await finishTaskWithDetails(planner, task.id, {
          name: "Lens & Light",
          cost: 3200,
          link: "https://example.com",
        });
        expect(done.status).toBe("done");
        expect(done.vendor_id).not.toBeNull();
        await finishTaskWithDetails(planner, task.id, {
          name: "Lens & Light",
          cost: 3500,
        });
        const items = (await getBudgetItems(planner, weddingId)).filter(
          (b) => b.task_id === task.id,
        );
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
          category: "Photography",
          description: "Lens & Light",
          actual: 3500,
          vendor_id: done.vendor_id,
        });

        await deleteBudgetItem(planner, items[0].id);
        await deleteTask(planner, task.id);
        await deleteVendor(planner, done.vendor_id!);
      });

      it("adds guests, sharing an invitation, and removes the empty invitation", async () => {
        const alex = await addGuest(planner, weddingId, {
          first_name: "Alex",
          last_name: "Testguest",
        });
        const sam = await addGuest(
          planner,
          weddingId,
          { first_name: "Sam", last_name: "Testguest" },
          { id: alex.household_id },
        );
        const household = () =>
          getGuestList(planner, weddingId).then((list) =>
            list.find((h) => h.id === alex.household_id),
          );
        expect((await household())?.name).toBe("Alex & Sam Testguest");
        expect((await household())?.guests).toHaveLength(2);

        await removeGuest(planner, alex.id);
        expect(await household()).toMatchObject({
          name: "Sam Testguest",
          guests: [{ id: sam.id }],
        });
        await removeGuest(planner, sam.id);
        expect(await household()).toBeUndefined();
      });

      it("saves 'Set the overall budget' as the total budget, not an expense", async () => {
        const before = (await getWedding(planner, weddingId)).budget_total;
        const task = await createTask(planner, weddingId, {
          title: "Set the overall budget",
        });
        const done = await finishTaskWithDetails(planner, task.id, {
          cost: 31000,
        });
        expect(done.status).toBe("done");
        expect((await getWedding(planner, weddingId)).budget_total).toBe(31000);
        expect(
          (await getBudgetItems(planner, weddingId)).filter(
            (b) => b.task_id === task.id,
          ),
        ).toEqual([]);

        await updateWedding(planner, weddingId, { budget_total: before });
        await deleteTask(planner, task.id);
      });

      it("can invite helpers but not the couple, and can't change roles", async () => {
        const invite = await createInvite(planner, weddingId, "helper");
        await deleteInvite(planner, invite.id);
        await expect(
          createInvite(planner, weddingId, "couple"),
        ).rejects.toThrow();
        const helperMember = (await getMembers(planner, weddingId)).find(
          (m) => m.role === "helper",
        )!;
        await expect(
          updateMember(planner, helperMember.id, { role: "planner" }),
        ).rejects.toThrow();
      });
    });

    describe("couple", () => {
      it("gets dashboard data", async () => {
        const summary = await getBudgetSummary(couple, weddingId);
        expect(summary.budgetTotal).toBe(30000);
        const calendar = await getCalendarItems(couple, weddingId);
        expect(new Set(calendar.map((i) => i.kind))).toEqual(
          new Set(["task", "event", "payment"]),
        );
        expect((await getIdeaBoards(couple, weddingId)).length).toBe(3);
      });

      it("can upload and read idea photos", async () => {
        const file = new File(["x"], "pic.png", { type: "image/png" });
        const path = await uploadIdeaPhoto(couple, weddingId, file);
        expect(path.startsWith(`${weddingId}/`)).toBe(true);
        const { error } = await couple.storage
          .from(IDEA_PHOTOS_BUCKET)
          .remove([path]);
        expect(error).toBeNull();
      });
    });

    describe("invite flow", () => {
      it("lets a new person preview, join with the invite's role, and leave", async () => {
        const invite = await createInvite(couple, weddingId, "helper");
        const preview = await getInvitePreview(newClient(), invite.token);
        expect(preview).toMatchObject({
          partner1Name: "Maya",
          role: "helper",
          expired: false,
        });

        expect(await acceptInvite(outsider, invite.token, "Guest Helper")).toBe(
          weddingId,
        );
        expect(await acceptInvite(outsider, invite.token)).toBe(weddingId);
        const me = (await getMyMembership(outsider, weddingId))!;
        expect(me).toMatchObject({
          role: "helper",
          display_name: "Guest Helper",
        });

        await removeMember(outsider, me.id);
        expect(await getMyMembership(outsider, weddingId)).toBeNull();
        await deleteInvite(couple, invite.id);
      });

      it("only lets the invited email accept, and only once", async () => {
        const invite = await createInvite(couple, weddingId, "helper", {
          email: ` ${OUTSIDER.toUpperCase()} `,
        });
        expect(invite.email).toBe(OUTSIDER);
        expect(await getInvitePreview(newClient(), invite.token)).toMatchObject(
          { email: OUTSIDER, accepted: false },
        );

        const forHelper = await createInvite(couple, weddingId, "planner", {
          email: "someone-else@demo.wedding",
        });
        await expect(acceptInvite(outsider, forHelper.token)).rejects.toThrow(
          /sent to someone-else@demo.wedding/,
        );
        await deleteInvite(couple, forHelper.id);

        expect(await acceptInvite(outsider, invite.token)).toBe(weddingId);
        expect(await acceptInvite(outsider, invite.token)).toBe(weddingId);
        expect(await getInvitePreview(newClient(), invite.token)).toMatchObject(
          { accepted: true },
        );
        await expect(acceptInvite(helper, invite.token)).rejects.toThrow(
          /already been used/,
        );
        expect(
          (await listInvites(couple, weddingId)).some(
            (i) => i.id === invite.id,
          ),
        ).toBe(false);

        const me = (await getMyMembership(outsider, weddingId))!;
        await removeMember(couple, me.id);
        await deleteInvite(couple, invite.id);
      });

      it("rejects unknown and expired invites", async () => {
        expect(
          await getInvitePreview(newClient(), crypto.randomUUID()),
        ).toBeNull();
        await expect(
          acceptInvite(outsider, crypto.randomUUID()),
        ).rejects.toThrow(/not valid/);
        const expired = await createInvite(couple, weddingId, "helper", {
          expiresInDays: -1,
        });
        await expect(acceptInvite(outsider, expired.token)).rejects.toThrow(
          /expired/,
        );
        await deleteInvite(couple, expired.id);
      });
    });
  },
);
