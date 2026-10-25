import { Trash2 } from "lucide-react";
import Link from "next/link";
import { removeGuestAction, setGuestRsvpAction } from "@/app/actions";
import { GuestForm } from "@/components/wedding/client-forms";
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
import {
  envelopeAddress,
  getGifts,
  thankYouCards,
  type ThankYouCard,
} from "@/lib/db/gifts";
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

const RSVP_FILTERS = [
  { value: "all", label: "All replies" },
  ...RSVP_OPTIONS,
] as const;

export async function GuestsSection({
  ctx,
  search,
  rsvp,
}: {
  ctx: WeddingContext;
  search?: string;
  rsvp?: string;
}) {
  const [households, gifts] = await Promise.all([
    getGuestList(ctx.db, ctx.wedding.id),
    getGifts(ctx.db, ctx.wedding.id),
  ]);
  const giftCards = new Map(
    thankYouCards(gifts, households).map((c) => [c.household?.id, c]),
  );
  const counts = countGuests(households);
  const query = search?.trim().toLocaleLowerCase() ?? "";
  const selectedRsvp = RSVP_FILTERS.some((option) => option.value === rsvp)
    ? rsvp!
    : "all";
  const visibleHouseholds = households.flatMap((household) => {
    const householdSearchText = [household.name, ...envelopeAddress(household)]
      .join(" ")
      .toLocaleLowerCase();
    const householdMatches = query && householdSearchText.includes(query);
    const guests = household.guests.filter((guest) => {
      const matchesRsvp = selectedRsvp === "all" || guest.rsvp === selectedRsvp;
      const guestSearchText = [
        guest.first_name,
        guest.last_name,
        guest.email,
        guest.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return (
        matchesRsvp &&
        (!query || householdMatches || guestSearchText.includes(query))
      );
    });
    return guests.length > 0 ? [{ ...household, guests }] : [];
  });
  const visibleGuestCount = visibleHouseholds.reduce(
    (total, household) => total + household.guests.length,
    0,
  );
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
          <CardTitle>Add a guest</CardTitle>
          <p className="mt-1 text-base text-[#695b60]">
            Add each person. Couples and families can share one invitation.
          </p>
          <GuestForm
            weddingId={ctx.wedding.id}
            households={households.map(({ id, name }) => ({ id, name }))}
            sideLabel={sideLabel}
          />
        </Card>
      )}

      {households.length === 0 ? (
        <EmptyState title="No guests yet">
          {ctx.canEdit
            ? "Add your first guest above."
            : "The couple hasn't added guests yet."}
        </EmptyState>
      ) : (
        <>
          <Card>
            <CardTitle>Find guests</CardTitle>
            <form
              action="/"
              method="get"
              className="mt-4 grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_220px_auto_auto]"
            >
              <input type="hidden" name="section" value="guests" />
              <Field label="Search by name, household, or contact">
                <input
                  type="search"
                  name="q"
                  defaultValue={search}
                  className={inputClass}
                  placeholder="e.g. Jordan Lee"
                />
              </Field>
              <Field label="RSVP status">
                <select
                  name="rsvp"
                  defaultValue={selectedRsvp}
                  className={inputClass}
                >
                  {RSVP_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <button type="submit" className={primaryButtonClass}>
                Search
              </button>
              {(query || selectedRsvp !== "all") && (
                <Link href="/?section=guests" className={quietButtonClass}>
                  Clear
                </Link>
              )}
            </form>
          </Card>

          {visibleHouseholds.length === 0 ? (
            <EmptyState title="No guests match those filters">
              <Link
                href="/?section=guests"
                className="font-semibold text-[#6f1d37] underline underline-offset-4"
              >
                Clear search and filters
              </Link>
            </EmptyState>
          ) : (
            <Card>
              <CardTitle>
                {visibleGuestCount}{" "}
                {visibleGuestCount === 1 ? "guest" : "guests"} in{" "}
                {visibleHouseholds.length}{" "}
                {visibleHouseholds.length === 1 ? "invitation" : "invitations"}
              </CardTitle>
              <ul className="mt-3 divide-y divide-[#f0e8ea]">
                {visibleHouseholds.map((h) => (
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
        </>
      )}

      {ctx.canEdit && (
        <Card>
          <CardTitle>RSVP QR code</CardTitle>
          <p className="mt-1 text-base text-[#695b60]">
            Print this on your invitations. Guests scan it, find their name and
            answer for everyone on their invitation. Their replies show up here.
          </p>
          <RsvpQr weddingId={ctx.wedding.id} />
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
  const address = envelopeAddress(household);
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
      {address.length > 0 && (
        <p className="text-sm text-[#66756c]">{address.join(", ")}</p>
      )}
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
          {guest.plus_one_allowed && <Badge tone="info">+1</Badge>}
        </p>
        {contact && (
          <p className="text-sm break-all text-[#806c74]">{contact}</p>
        )}
        {guest.rsvp === "attending" && guest.meal_choice && (
          <p className="text-sm text-[#806c74]">Meal: {guest.meal_choice}</p>
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
                    ? "bg-[#6f1d37] text-white"
                    : "border border-[#ddcbd1] bg-white text-[#6f1d37] hover:bg-[#fbf3f5]"
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
    <div className="rounded-[20px] border border-[#eadfe2] bg-white p-5">
      <p className="text-base text-[#695b60]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
