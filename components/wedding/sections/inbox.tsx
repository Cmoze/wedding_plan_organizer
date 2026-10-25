import { ArrowLeft, Paperclip, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteEmailAction } from "@/app/actions";
import type { WeddingContext } from "@/components/wedding/context";
import {
  CopyButton,
  EmailHtmlFrame,
  EmailSuggestions,
  InboxQuery,
  LocalDateTime,
} from "@/components/wedding/inbox-client";
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  quietButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import {
  getEmail,
  getEmailAttachmentUrl,
  getEmails,
  markEmailRead,
  type Email,
} from "@/lib/db/emails";
import { cleanEmailText } from "@/lib/email/display";

export async function InboxSection({
  ctx,
  emailId,
}: {
  ctx: WeddingContext;
  emailId?: string;
}) {
  const address = inboxAddress(ctx);
  if (emailId) {
    const email = await getEmail(ctx.db, emailId).catch(() => null);
    if (email && email.wedding_id === ctx.wedding.id)
      return <EmailView ctx={ctx} email={email} />;
  }
  const emails = await getEmails(ctx.db, ctx.wedding.id);
  const unread = emails.filter((e) => !e.is_read).length;

  return (
    <div className="mt-10 space-y-6">
      <ForwardingCard address={address} />

      {emails.length === 0 ? (
        <EmptyState title="No emails yet">
          Forward a vendor email to your wedding address above and it will show
          up here.
        </EmptyState>
      ) : (
        <>
          {ctx.canEdit && (
            <InboxQuery
              weddingId={ctx.wedding.id}
              emailSubjects={Object.fromEntries(
                emails.map((e) => [e.id, e.subject]),
              )}
            />
          )}
          <Card>
            <CardTitle>
              Emails{" "}
              {unread > 0 && (
                <span className="ml-1 align-middle">
                  <Badge tone="info">{unread} new</Badge>
                </span>
              )}
            </CardTitle>
            <ul className="mt-3 divide-y divide-[#f0e8ea]">
              {emails.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/?section=inbox&email=${e.id}`}
                    className="-mx-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl px-3 py-4 hover:bg-[#f6f7f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c3c58]"
                  >
                    <span
                      className={`min-w-0 flex-1 text-lg ${e.is_read ? "text-[#65555c]" : "font-bold text-[#35151f]"}`}
                    >
                      {!e.is_read && <span className="sr-only">New: </span>}
                      {e.subject || "(no subject)"}
                      <span className="block text-base font-normal text-[#695b60]">
                        {e.from_name || e.from_address}
                      </span>
                    </span>
                    <span className="text-base text-[#806c74]">
                      <LocalDateTime iso={e.received_at} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

async function EmailView({
  ctx,
  email,
}: {
  ctx: WeddingContext;
  email: Email;
}) {
  if (!email.is_read && ctx.canEdit)
    await markEmailRead(ctx.db, email.id).catch(() => undefined);

  const paths = Array.isArray(email.attachments)
    ? email.attachments.filter((p): p is string => typeof p === "string")
    : [];
  const attachments = await Promise.all(
    paths.map(async (path) => ({
      name: path
        .split("/")
        .pop()!
        .replace(/^[0-9a-f-]{36}-/, ""),
      url: await getEmailAttachmentUrl(ctx.db, path).catch(() => null),
    })),
  );
  // There's no vendors screen yet, so a vendor link is shown without a link.
  const links = [
    email.linked_budget_item_id && { label: "Budget", section: "budget" },
    email.linked_task_id && { label: "Checklist", section: "tasks" },
    email.linked_vendor_id && { label: "Vendors" },
  ].filter((l): l is { label: string; section?: string } => !!l);

  return (
    <div className="mt-10 space-y-6">
      <Link href="/?section=inbox" className={secondaryButtonClass}>
        <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
        All emails
      </Link>

      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-[#35151f]">
              {email.subject || "(no subject)"}
            </h2>
            <p className="mt-2 text-base text-[#695b60]">
              From{" "}
              <span className="font-semibold text-[#4b2734]">
                {email.from_name
                  ? `${email.from_name} <${email.from_address}>`
                  : email.from_address}
              </span>
            </p>
            <p className="text-base text-[#806c74]">
              <LocalDateTime iso={email.received_at} />
            </p>
          </div>
          {ctx.canEdit && (
            <form action={deleteEmailAction}>
              <input type="hidden" name="emailId" value={email.id} />
              <button
                type="submit"
                aria-label="Delete this email"
                className={quietButtonClass}
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        {links.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-base text-[#695b60]">
            Added to:
            {links.map((l) =>
              l.section ? (
                <Link key={l.label} href={`/?section=${l.section}`}>
                  <Badge tone="good">{l.label}</Badge>
                </Link>
              ) : (
                <Badge key={l.label} tone="good">
                  {l.label}
                </Badge>
              ),
            )}
          </p>
        )}

        <div className="mt-6 border-t border-[#f0e8ea] pt-6">
          <EmailBody email={email} />
        </div>

        {attachments.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-3 border-t border-[#f0e8ea] pt-6">
            {attachments.map((a) => (
              <li key={a.name}>
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className={secondaryButtonClass}
                  >
                    <Paperclip className="mr-2 h-5 w-5" aria-hidden="true" />
                    {a.name}
                  </a>
                ) : (
                  <span className="text-base text-[#806c74]">{a.name}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {ctx.canEdit && (
        <EmailSuggestions weddingId={ctx.wedding.id} emailId={email.id} />
      )}
    </div>
  );
}

/**
 * The HTML version when there is one, so logos and layout look like the sender meant them; otherwise
 * the plain text, tidied of image placeholders and tracking links.
 */
function EmailBody({ email }: { email: Email }) {
  if (email.body_html?.trim()) return <EmailHtmlFrame html={email.body_html} />;
  const text = cleanEmailText(email.body_text ?? "");
  if (text)
    return (
      <div className="text-lg leading-relaxed break-words whitespace-pre-wrap text-[#4b2734]">
        {text}
      </div>
    );
  return <p className="text-base text-[#806c74]">This email has no text.</p>;
}

function ForwardingCard({ address }: { address: string | null }) {
  return (
    <Card className="bg-[#f6f7f1]">
      <CardTitle>Your wedding email address</CardTitle>
      {address ? (
        <>
          <p className="mt-2 text-base text-[#695b60]">
            Forward any vendor email here, or give it to vendors directly.
            Forward registry &quot;someone bought you a gift&quot; emails too,
            and the helper can add them to your gift list. Everyone on your
            wedding team will see them in this inbox.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded-xl border border-[#ddcbd1] bg-white px-4 py-3 text-lg font-semibold break-all text-[#35151f]">
              {address}
            </code>
            <CopyButton text={address} />
          </div>
          <ol className="mt-5 list-decimal space-y-1 pl-6 text-base text-[#65555c]">
            <li>Open the email from your vendor.</li>
            <li>
              Choose <strong>Forward</strong>.
            </li>
            <li>Paste this address in the &quot;To&quot; box and send.</li>
          </ol>
        </>
      ) : (
        <p className="mt-2 text-base text-[#695b60]">
          The wedding inbox isn&apos;t set up yet.
        </p>
      )}
    </Card>
  );
}

function inboxAddress(ctx: WeddingContext): string | null {
  const domain = process.env.INBOUND_EMAIL_DOMAIN?.trim();
  return domain ? `${ctx.wedding.email_slug}@${domain}` : null;
}
