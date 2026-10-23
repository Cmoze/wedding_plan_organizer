import {
  unwrap,
  type Db,
  type Tables,
  type TablesInsert,
} from "@/lib/db/shared";

export const EMAIL_ATTACHMENTS_BUCKET = "email-attachments";

export type Email = Tables<"emails">;
export type EmailSummary = Pick<
  Email,
  "id" | "from_address" | "from_name" | "subject" | "received_at" | "is_read"
>;

/** Inbox list, newest first (no bodies). */
export async function getEmails(
  db: Db,
  weddingId: string,
): Promise<EmailSummary[]> {
  return unwrap(
    await db
      .from("emails")
      .select("id, from_address, from_name, subject, received_at, is_read")
      .eq("wedding_id", weddingId)
      .order("received_at", { ascending: false }),
  );
}

export async function getEmail(db: Db, emailId: string): Promise<Email> {
  return unwrap(await db.from("emails").select("*").eq("id", emailId).single());
}

export async function markEmailRead(
  db: Db,
  emailId: string,
  isRead = true,
): Promise<void> {
  unwrap(await db.from("emails").update({ is_read: isRead }).eq("id", emailId));
}

/** Link an email to a task, vendor and/or budget item (pass null to unlink). */
export async function linkEmail(
  db: Db,
  emailId: string,
  links: {
    taskId?: string | null;
    vendorId?: string | null;
    budgetItemId?: string | null;
  },
): Promise<Email> {
  const patch: Partial<Email> = {};
  if (links.taskId !== undefined) patch.linked_task_id = links.taskId;
  if (links.vendorId !== undefined) patch.linked_vendor_id = links.vendorId;
  if (links.budgetItemId !== undefined)
    patch.linked_budget_item_id = links.budgetItemId;
  return unwrap(
    await db.from("emails").update(patch).eq("id", emailId).select().single(),
  );
}

export async function deleteEmail(db: Db, emailId: string): Promise<void> {
  unwrap(await db.from("emails").delete().eq("id", emailId));
}

/**
 * For the inbound email webhook only, with the admin client (createAdminClient).
 * Ignores duplicates of the same provider_message_id; returns null for a duplicate.
 */
export async function saveInboundEmail(
  adminDb: Db,
  email: Omit<
    TablesInsert<"emails">,
    "id" | "created_at" | "updated_at" | "is_read"
  >,
): Promise<Email | null> {
  const rows = unwrap(
    await adminDb
      .from("emails")
      .upsert(email, {
        onConflict: "provider_message_id",
        ignoreDuplicates: true,
      })
      .select(),
  );
  return rows[0] ?? null;
}

/** For the webhook: stores an attachment and returns its path for `emails.attachments`. */
export async function uploadEmailAttachment(
  adminDb: Db,
  weddingId: string,
  fileName: string,
  data: Blob | ArrayBuffer,
  contentType?: string,
): Promise<string> {
  const safeName =
    fileName.replace(/[^\w.-]+/g, "_").slice(-100) || "attachment";
  const path = `${weddingId}/${crypto.randomUUID()}-${safeName}`;
  unwrap(
    await adminDb.storage
      .from(EMAIL_ATTACHMENTS_BUCKET)
      .upload(path, data, { contentType }),
  );
  return path;
}

export async function getEmailAttachmentUrl(
  db: Db,
  path: string,
  expiresIn = 60 * 60,
) {
  const { signedUrl } = unwrap(
    await db.storage
      .from(EMAIL_ATTACHMENTS_BUCKET)
      .createSignedUrl(path, expiresIn),
  );
  return signedUrl;
}
