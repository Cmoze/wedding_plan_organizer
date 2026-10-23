import { createAdminClient } from "@/lib/db/supabase/admin";
import { saveInboundEmail, uploadEmailAttachment } from "@/lib/db/emails";
import { getWeddingByEmailSlug } from "@/lib/db/weddings";
import { findInboxAddress, parseAddress } from "@/lib/email/address";
import {
  downloadAttachment,
  getReceivedEmail,
  listReceivedAttachments,
  type ReceivedEmailEvent,
} from "@/lib/email/resend";
import { verifyWebhook } from "@/lib/email/verify-webhook";

/** Matches the `email-attachments` bucket's file size limit. */
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/**
 * Resend `email.received` webhook. Uses the service-role client (bypasses RLS).
 * Any non-2xx response makes Resend retry, so we only return errors for problems a
 * retry could fix; mail for an unknown inbox is acknowledged and dropped.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const inboundDomain = process.env.INBOUND_EMAIL_DOMAIN;
  if (!secret || !inboundDomain) {
    console.error(
      "inbound-email: RESEND_WEBHOOK_SECRET or INBOUND_EMAIL_DOMAIN is not set",
    );
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const verified = verifyWebhook(
    secret,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    rawBody,
  );
  if (!verified) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as ReceivedEmailEvent;
  if (event.type !== "email.received") {
    return Response.json({ ignored: event.type });
  }

  const { data } = event;
  const inbox = findInboxAddress(
    [
      ...data.to,
      ...(data.cc ?? []),
      ...(data.bcc ?? []),
      ...(data.received_for ?? []),
    ],
    inboundDomain,
  );
  const db = createAdminClient();
  const wedding = inbox ? await getWeddingByEmailSlug(db, inbox.slug) : null;
  if (!inbox || !wedding) {
    console.warn(`inbound-email: no wedding for ${data.to.join(", ")}`);
    return Response.json({ ignored: "unknown inbox" });
  }

  const [email, attachments] = await Promise.all([
    getReceivedEmail(data.email_id),
    listReceivedAttachments(data.email_id),
  ]);

  // Inline images are already embedded in the HTML body as data URIs.
  const paths: string[] = [];
  for (const attachment of attachments) {
    if (attachment.content_disposition === "inline") continue;
    if (attachment.size > MAX_ATTACHMENT_BYTES) {
      console.warn(
        `inbound-email: skipping ${attachment.filename} (${attachment.size} bytes)`,
      );
      continue;
    }
    const content = await downloadAttachment(attachment);
    paths.push(
      await uploadEmailAttachment(
        db,
        wedding.id,
        attachment.filename,
        content,
        attachment.content_type,
      ),
    );
  }

  const from = parseAddress(email.from || data.from);
  const saved = await saveInboundEmail(db, {
    wedding_id: wedding.id,
    provider_message_id: data.email_id,
    from_address: from.address,
    from_name: from.name,
    to_address: inbox.address,
    subject: email.subject ?? data.subject ?? "",
    body_text: email.text,
    body_html: email.html,
    attachments: paths,
    received_at: data.created_at,
  });

  return Response.json({ id: saved?.id ?? null, duplicate: saved === null });
}
