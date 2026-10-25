import { Trash2 } from "lucide-react";
import {
  addGuestAction,
  removeGuestAction,
  setGuestRsvpAction,
} from "@/app/actions";
import type { WeddingContext } from "@/components/wedding/context";
import { RsvpQr } from "@/components/wedding/rsvp-qr";
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  Field,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/wedding/ui";
import { getGifts, thankYouCards, type ThankYouCard } from "@/lib/db/gifts";
import {
  countGuests,
  getGuestList,
  type Guest,
  type HouseholdWithGuests,
} from "@/lib/db/guests";

const RSVP_OPTIONS: { value: Guest["rsvp"]; label: string }[] = [
  { value: "attending", label: "Coming" },
  { value: "declined", label: "Not coming" },
  { value: "pending", label: "No reply" },
];

export async function GuestsSection({ ctx }: { ctx: WeddingContext }) {
  const [households, gifts] = await Promise.all([
    getGuestList(ctx.db, ctx.wedding.id),
    getGifts(ctx.db, ctx.wedding.id),
  ]);
  const giftCards = new Map(
    thankYouCards(gifts, households).map((c) => [c.household?.id, c]),
  );
  const counts = countGuests(households);
  const { partner1_name, partner2_name } = ctx.wedding;
  const sideLabel = {
    partner1: `${partner1_name}'s side`,
    partner2: partner2_name ? `${partner2_name}'s side` : "Partner's side",
    both: "Both",
  };

  return (
    <div className="mt-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invited" value={counts.invited} />
        <Stat label="Coming" value={counts.attending} />
        <Stat label="No reply yet" value={counts.pending} />
        <Stat label="Not coming" value={counts.declined} />
      </div>

      {ctx.canEdit && (
        <Card>
          <CardTitle>RSVP QR code</CardTitle>
          <p className="mt-1 text-base text-[#52635a]">
            Print this on your invitations. Guests scan it, find their name and
            answer for everyone on their invitation. Their replies show up here.
          </p>
          <RsvpQr weddingId={ctx.wedding.id} />
        </Card>
      )}

      {ctx.canEdit && (
        <Card>
          <CardTitle>Add a guest</CardTitle>
          <p className="mt-1 text-base text-[#52635a]">
            Add each person. Couples and families can share one invitation.
          </p>
          <form
            action={addGuestAction}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="weddingId" value={ctx.wedding.id} />
            <Field label="First name">
              <input
                name="firstName"
                required
                autoComplete="off"
                className={inputClass}
                placeholder="Maya"
              />
            </Field>
            <Field label="Last name">
              <input
                name="lastName"
                autoComplete="off"
                className={inputClass}
                placeholder="Lopez"
              />
            </Field>
            <Field label="Email" hint="Optional.">
              <input
                name="email"
                type="email"
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field label="Phone" hint="Optional.">
              <input
                name="phone"
                type="tel"
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field
              label="Invitation"
              hint="Pick someone already on the list to send them one invitation together."
            >
              <select name="householdId" defaultValue="" className={inputClass}>
                <option value="">Their own invitation</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    With {h.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Whose side?" hint="Only used for a new invitation.">
              <select name="side" defaultValue="both" className={inputClass}>
                {(["partner1", "partner2", "both"] as const).map((s) => (
                  <option key={s} value={s}>
                    {sideLabel[s]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <Checkbox name="plusOne" label="Can bring a plus-one" />
              <Checkbox name="child" label="Child" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className={primaryButtonClass}>
                Add guest
              </button>
            </div>
          </form>
        </Card>
      )}

      {households.length === 0 ? (
        <EmptyState title="No guests yet">
          {ctx.canEdit
            ? "Add your first guest above."
            : "The couple hasn't added guests yet."}
        </EmptyState>
      ) : (
        <Card>
          <CardTitle>
            {counts.households}{" "}
            {counts.households === 1 ? "invitation" : "invitations"}
          </CardTitle>
          <ul className="mt-3 divide-y divide-[#eceee8]">
            {households.map((h) => (
              <HouseholdRow
                key={h.id}
                household={h}
                side={sideLabel[h.side]}
                giftCard={giftCards.get(h.id)}
                ctx={ctx}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function HouseholdRow({
  household,
  side,
  giftCard,
  ctx,
}: {
  household: HouseholdWithGuests;
  side: string;
  /** Their gifts, for the thank-you badge; tracked in the Registry section. */
  giftCard?: ThankYouCard;
  ctx: WeddingContext;
}) {
  return (
    <li className="py-4">
      <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
        {household.name}
        {household.side !== "both" && <Badge>{side}</Badge>}
        {giftCard && (
          <Badge tone={giftCard.sent ? "good" : "warn"}>
            {giftCard.sent ? "🎁 Thank-you sent" : "🎁 Thank-you to send"}
          </Badge>
        )}
      </p>
      <ul className="mt-2 space-y-2">
        {household.guests.map((g) => (
          <GuestRow key={g.id} guest={g} ctx={ctx} />
        ))}
      </ul>
    </li>
  );
}

function GuestRow({ guest, ctx }: { guest: Guest; ctx: WeddingContext }) {
  const name = [guest.first_name, guest.last_name].filter(Boolean).join(" ");
  const current = RSVP_OPTIONS.find((o) => o.value === guest.rsvp)!;
  const contact = [guest.email, guest.phone].filter(Boolean).join(" · ");

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-[#f8f8f4] px-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-base font-semibold">
          {name}
          {guest.is_child && <Badge>Child</Badge>}
          {guest.plus_one_allowed && <Badge tone="info">+1</Badge>}
        </p>
        {contact && (
          <p className="text-sm break-all text-[#66756c]">{contact}</p>
        )}
        {guest.rsvp === "attending" && guest.meal_choice && (
          <p className="text-sm text-[#66756c]">Meal: {guest.meal_choice}</p>
        )}
      </div>
      {ctx.canEdit ? (
        <div
          role="group"
          aria-label={`RSVP for ${name}`}
          className="flex flex-wrap gap-1"
        >
          {RSVP_OPTIONS.map((o) => (
            <form key={o.value} action={setGuestRsvpAction}>
              <input type="hidden" name="guestId" value={guest.id} />
              <input type="hidden" name="rsvp" value={o.value} />
              <button
                type="submit"
                aria-pressed={o.value === guest.rsvp}
                className={`min-h-11 rounded-full px-3 text-sm font-semibold ${
                  o.value === guest.rsvp
                    ? "bg-[#315b4b] text-white"
                    : "border border-[#cfd8d0] bg-white text-[#294b40] hover:bg-[#f1f3ee]"
                }`}
              >
                {o.label}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <Badge
          tone={
            guest.rsvp === "attending"
              ? "good"
              : guest.rsvp === "declined"
                ? "warn"
                : "neutral"
          }
        >
          {current.label}
        </Badge>
      )}
      {ctx.canEdit && (
        <form action={removeGuestAction}>
          <input type="hidden" name="guestId" value={guest.id} />
          <button
            type="submit"
            aria-label={`Remove ${name}`}
            className={quietButtonClass}
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-[#e2e4dc] bg-white p-5">
      <p className="text-base text-[#52635a]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-base font-semibold text-[#2d4a3f]">
      <input type="checkbox" name={name} className="h-5 w-5 accent-[#315b4b]" />
      {label}
    </label>
  );
}
