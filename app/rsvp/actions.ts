"use server";

import {
  findInvitation,
  saveRsvp,
  type RsvpAnswer,
  type RsvpInvitation,
} from "@/lib/db/rsvp";
import { createAdminClient } from "@/lib/db/supabase/admin";

// Guests RSVP without an account, so these use the service-role client. They only ever touch
// the invitation that matches the name the guest typed, and re-check that name on save.

export type RsvpFormState = {
  error?: string;
  invitation?: RsvpInvitation;
  /** The name they looked up, sent back with the answers. */
  firstName?: string;
  lastName?: string;
  saved?: boolean;
};

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
};

async function lookup(form: FormData) {
  const weddingId = text(form, "weddingId");
  const firstName = text(form, "firstName");
  const lastName = text(form, "lastName");
  const result = await findInvitation(
    createAdminClient(),
    weddingId,
    firstName,
    lastName,
  );
  return { weddingId, firstName, lastName, result };
}

export async function rsvpAction(
  _prev: RsvpFormState,
  form: FormData,
): Promise<RsvpFormState> {
  try {
    const { weddingId, firstName, lastName, result } = await lookup(form);
    if (result.status !== "found") {
      return {
        firstName,
        lastName,
        error:
          result.status === "ambiguous"
            ? "More than one guest has that name. Please reach out to the couple to RSVP."
            : "We couldn't find that name on the guest list. Try it the way it's written on your invitation, or reach out to the couple.",
      };
    }
    const { invitation } = result;
    if (form.get("step") !== "save") {
      return { invitation, firstName, lastName };
    }

    const answers: RsvpAnswer[] = [];
    for (const g of invitation.guests) {
      const rsvp = text(form, `rsvp-${g.id}`);
      if (rsvp !== "attending" && rsvp !== "declined") {
        return {
          invitation,
          firstName,
          lastName,
          error: `Let us know if ${g.first_name} is coming.`,
        };
      }
      answers.push({
        guestId: g.id,
        rsvp,
        mealChoice: text(form, `meal-${g.id}`).slice(0, 200) || null,
      });
    }
    await saveRsvp(createAdminClient(), weddingId, invitation, answers);
    const updated = await findInvitation(
      createAdminClient(),
      weddingId,
      firstName,
      lastName,
    );
    return {
      invitation: updated.status === "found" ? updated.invitation : invitation,
      firstName,
      lastName,
      saved: true,
    };
  } catch (e) {
    console.error("RSVP failed", e);
    return {
      error: "Something went wrong saving your RSVP. Please try again.",
    };
  }
}
