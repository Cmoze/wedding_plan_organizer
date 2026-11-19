import type { MemberRole } from "@/lib/db/weddings";

export const ROLE_INFO: Record<
  MemberRole,
  { label: string; description: string; youCan: string }
> = {
  helper: {
    label: "Helper",
    description:
      "Adds ideas and photos, comments, and updates tasks assigned to them.",
    youCan: "add ideas and photos, comment, and update tasks assigned to you",
  },
  planner: {
    label: "Planner",
    description:
      "Can add and change everything: tasks, budget, calendar, ideas and invites.",
    youCan:
      "add and change everything: tasks, budget, calendar, ideas and invites",
  },
  couple: {
    label: "Couple",
    description: "Full access, including managing who is on the team.",
    youCan: "do everything, including managing who is on the team",
  },
};

/**
 * Roles someone may hand out: only the couple can add another member of the couple,
 * except while the wedding has no couple yet (a planner set it up), when a planner can
 * invite them. Matches the RLS policy on `invites`.
 */
export const invitableRoles = (
  myRole: MemberRole,
  weddingHasCouple = true,
): MemberRole[] =>
  myRole === "couple" || !weddingHasCouple
    ? ["helper", "planner", "couple"]
    : ["helper", "planner"];

export const hasCouple = (members: { role: MemberRole }[]) =>
  members.some((m) => m.role === "couple");
