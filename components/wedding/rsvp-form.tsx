"use client";

import { useActionState } from "react";
import { rsvpAction, type RsvpFormState } from "@/app/rsvp/actions";
import {
  Field,
  FormMessage,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import type { RsvpGuest } from "@/lib/db/rsvp";

const fullName = (g: Pick<RsvpGuest, "first_name" | "last_name">) =>
  [g.first_name, g.last_name].filter(Boolean).join(" ");

/** Public RSVP: find your invitation by name, then answer for everyone on it. */
export function RsvpForm({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState<RsvpFormState, FormData>(
    rsvpAction,
    {},
  );
  const { invitation } = state;

  if (invitation && state.saved) {
    const coming = invitation.guests.filter((g) => g.rsvp === "attending");
    return (
      <div className="space-y-5">
        <div
          role="status"
          className="rounded-2xl bg-[#e3efe6] px-5 py-4 text-[#24553f]"
        >
          <p className="text-lg font-semibold">
            Thank you! Your RSVP is saved.
          </p>
          <p className="mt-1 text-base">
            {coming.length === 0
              ? "We'll miss you."
              : `We can't wait to celebrate with ${coming.map((g) => g.first_name).join(" & ")}.`}
          </p>
        </div>
        <ul className="space-y-2">
          {invitation.guests.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap justify-between gap-2 rounded-xl bg-[#f8f8f4] px-4 py-3 text-base"
            >
              <span className="font-semibold">{fullName(g)}</span>
              <span className="text-[#52635a]">
                {g.rsvp === "attending"
                  ? `Coming${g.meal_choice ? ` · ${g.meal_choice}` : ""}`
                  : "Not coming"}
              </span>
            </li>
          ))}
        </ul>
        <form action={action}>
          <NameFields weddingId={weddingId} state={state} hidden />
          <button type="submit" className={`${secondaryButtonClass} w-full`}>
            Change my answer
          </button>
        </form>
      </div>
    );
  }

  if (invitation) {
    return (
      <form action={action} className="space-y-5">
        <NameFields weddingId={weddingId} state={state} hidden />
        <input type="hidden" name="step" value="save" />
        <p className="text-base text-[#52635a]">
          We found your invitation:{" "}
          <strong className="text-[#20352f]">{invitation.householdName}</strong>
        </p>
        {invitation.guests.map((g) => (
          <GuestAnswer key={g.id} guest={g} />
        ))}
        <FormMessage error={state.error} />
        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} w-full`}
        >
          {pending ? "Sending..." : "Send RSVP"}
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <NameFields weddingId={weddingId} state={state} />
      <FormMessage error={state.error} />
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClass} w-full`}
      >
        {pending ? "Looking..." : "Find my invitation"}
      </button>
    </form>
  );
}

function NameFields({
  weddingId,
  state,
  hidden = false,
}: {
  weddingId: string;
  state: RsvpFormState;
  hidden?: boolean;
}) {
  if (hidden) {
    return (
      <>
        <input type="hidden" name="weddingId" value={weddingId} />
        <input type="hidden" name="firstName" value={state.firstName ?? ""} />
        <input type="hidden" name="lastName" value={state.lastName ?? ""} />
      </>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="weddingId" value={weddingId} />
      <Field label="First name">
        <input
          name="firstName"
          defaultValue={state.firstName}
          required
          autoComplete="given-name"
          className={inputClass}
        />
      </Field>
      <Field label="Last name">
        <input
          name="lastName"
          defaultValue={state.lastName}
          autoComplete="family-name"
          className={inputClass}
        />
      </Field>
    </div>
  );
}

function GuestAnswer({ guest }: { guest: RsvpGuest }) {
  const name = fullName(guest);
  const choice = guest.rsvp === "pending" ? undefined : guest.rsvp;
  return (
    <fieldset className="space-y-3 rounded-2xl border border-[#e2e4dc] p-4">
      <legend className="px-1 text-lg font-semibold">{name}</legend>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["attending", "Joyfully accepts"],
            ["declined", "Regretfully declines"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-[#cfd8d0] px-3 text-base font-semibold text-[#294b40] has-checked:border-[#315b4b] has-checked:bg-[#e3efe6]"
          >
            <input
              type="radio"
              name={`rsvp-${guest.id}`}
              value={value}
              required
              defaultChecked={choice === value}
              className="h-5 w-5 accent-[#315b4b]"
            />
            {label}
          </label>
        ))}
      </div>
      <Field
        label="Meal choice or dietary needs"
        hint="Optional. Only used if they're coming."
      >
        <input
          name={`meal-${guest.id}`}
          defaultValue={guest.meal_choice ?? ""}
          maxLength={200}
          autoComplete="off"
          className={inputClass}
          placeholder="Vegetarian, no nuts..."
        />
      </Field>
    </fieldset>
  );
}
