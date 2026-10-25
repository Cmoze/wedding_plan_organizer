import { Check, ExternalLink, Gift, Mail, Trash2 } from "lucide-react";
import {
  deleteGiftAction,
  deleteRegistryLinkAction,
  setThankYouSentAction,
} from "@/app/actions";
import { GiftForm, RegistryLinkForm } from "@/components/wedding/client-forms";
import type { WeddingContext } from "@/components/wedding/context";
import { formatDate } from "@/components/wedding/format";
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  quietButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import {
  envelopeAddress,
  getGifts,
  thankYouCards,
  type ThankYouCard,
} from "@/lib/db/gifts";
import { getGuestList } from "@/lib/db/guests";
import { getRegistryLinks, type RegistryLink } from "@/lib/db/registry";

export async function RegistrySection({ ctx }: { ctx: WeddingContext }) {
  const [links, gifts, households] = await Promise.all([
    getRegistryLinks(ctx.db, ctx.wedding.id),
    getGifts(ctx.db, ctx.wedding.id),
    getGuestList(ctx.db, ctx.wedding.id),
  ]);
  const cards = thankYouCards(gifts, households);
  const giftCount = (linkId: string) =>
    gifts.filter((g) => g.registry_link_id === linkId).length;

  return (
    <div className="mt-10 space-y-6">
      {links.length === 0 ? (
        <EmptyState title="No registries yet">
          {ctx.canEdit
            ? "Add the link to each store's registry so guests and family can find them all here."
            : "Once the couple adds their registries, the links will show up here."}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-col rounded-[24px] border border-[#e2e4dc] bg-white p-6"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3f0e5] text-[#785e35]">
                  <Gift className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold">{link.store_name}</p>
                  <p className="truncate text-base text-[#66756c]">
                    {hostOf(link.url)}
                  </p>
                </div>
                {ctx.canEdit && (
                  <form action={deleteRegistryLinkAction}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <button
                      type="submit"
                      aria-label={`Remove ${link.store_name} registry`}
                      className={quietButtonClass}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>
              {link.notes && (
                <p className="mt-3 text-base text-[#52635a]">{link.notes}</p>
              )}
              {giftCount(link.id) > 0 && (
                <p className="mt-3">
                  <Badge tone="good">
                    {giftCount(link.id)}{" "}
                    {giftCount(link.id) === 1 ? "gift" : "gifts"} received
                  </Badge>
                </p>
              )}
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#315b4b] px-5 text-base font-bold text-white hover:bg-[#264a3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a]"
              >
                Open registry
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {ctx.canEdit && (
        <Card>
          <CardTitle>Add a registry</CardTitle>
          <RegistryLinkForm weddingId={ctx.wedding.id} />
        </Card>
      )}

      <h2 className="pt-6 text-3xl font-semibold">Gifts and thank-you cards</h2>

      {ctx.canEdit && (
        <Card>
          <CardTitle>Record a gift</CardTitle>
          <p className="mt-1 text-base text-[#52635a]">
            Note who gave what as gifts arrive, so nobody is missed when
            thank-you cards go out.
          </p>
          <GiftForm
            weddingId={ctx.wedding.id}
            today={ctx.today}
            households={households.map((h) => ({ id: h.id, name: h.name }))}
            registries={links.map((l) => ({
              id: l.id,
              store_name: l.store_name,
            }))}
          />
        </Card>
      )}

      <ThankYouList ctx={ctx} cards={cards} links={links} />
    </div>
  );
}

function ThankYouList({
  ctx,
  cards,
  links,
}: {
  ctx: WeddingContext;
  cards: ThankYouCard[];
  links: RegistryLink[];
}) {
  if (cards.length === 0) {
    return (
      <EmptyState title="No gifts recorded yet">
        Each gift you add shows up here with the address to send a thank-you
        card to.
      </EmptyState>
    );
  }
  const toSend = cards.filter((c) => !c.sent);
  const sent = cards.filter((c) => c.sent);
  const store = (id: string | null) =>
    links.find((l) => l.id === id)?.store_name;

  const cardRow = (card: ThankYouCard) => {
    const address = envelopeAddress(card.household);
    const unthanked = card.gifts.filter((g) => !g.thank_you_sent_at);
    return (
      <li
        key={card.key}
        className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start"
      >
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{card.name}</p>
          {address.length > 0 ? (
            <address className="mt-1 text-base text-[#52635a] not-italic">
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <p className="mt-1">
              <Badge tone="warn">
                {card.household
                  ? "No address on the guest list"
                  : "Not on the guest list"}
              </Badge>
            </p>
          )}
          <ul className="mt-3 space-y-1">
            {card.gifts.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center gap-x-2 text-base"
              >
                <Gift
                  className="h-4 w-4 shrink-0 text-[#785e35]"
                  aria-hidden="true"
                />
                <span className="font-semibold">{g.description}</span>
                <span className="text-[#66756c]">
                  {[store(g.registry_link_id), formatDate(g.received_on)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {ctx.canEdit && (
                  <form action={deleteGiftAction} className="ml-auto">
                    <input type="hidden" name="giftId" value={g.id} />
                    <button
                      type="submit"
                      aria-label={`Remove ${g.description} from ${card.name}`}
                      className={quietButtonClass}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </form>
                )}
                {g.notes && (
                  <span className="w-full pl-6 text-sm text-[#66756c]">
                    {g.notes}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        {ctx.canEdit && (
          <form action={setThankYouSentAction}>
            <input
              type="hidden"
              name="giftIds"
              value={(card.sent ? card.gifts : unthanked)
                .map((g) => g.id)
                .join(",")}
            />
            <input type="hidden" name="sent" value={String(!card.sent)} />
            <button type="submit" className={secondaryButtonClass}>
              {card.sent ? (
                "Not sent after all"
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" aria-hidden="true" />
                  Card sent
                </>
              )}
            </button>
          </form>
        )}
      </li>
    );
  };

  return (
    <Card>
      <CardTitle>
        <span className="inline-flex items-center gap-2">
          <Mail className="h-5 w-5" aria-hidden="true" /> Thank-you cards
        </span>
      </CardTitle>
      <p className="mt-1 text-base text-[#52635a]">
        {toSend.length === 0
          ? `All ${sent.length} sent. Nice work!`
          : `${toSend.length} to send · ${sent.length} sent`}
      </p>
      {toSend.length > 0 && (
        <ul className="mt-2 divide-y divide-[#eceee8]">
          {toSend.map(cardRow)}
        </ul>
      )}
      {sent.length > 0 && (
        <details className="mt-4 border-t border-[#eceee8] pt-4">
          <summary className="min-h-11 cursor-pointer text-base font-semibold text-[#315b4b]">
            Already sent ({sent.length})
          </summary>
          <ul className="divide-y divide-[#eceee8]">{sent.map(cardRow)}</ul>
        </details>
      )}
    </Card>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
