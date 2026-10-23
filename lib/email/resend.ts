import "server-only";

/** The `email.received` webhook body. It carries metadata only: no body or attachment content. */
export type ReceivedEmailEvent = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    received_for?: string[];
    message_id?: string;
    subject?: string;
  };
};

export type ReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string | null;
  html: string | null;
  text: string | null;
  created_at: string;
};

export type ReceivedAttachment = {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  content_disposition: string | null;
  download_url: string;
};

async function resendGet<T>(path: string): Promise<T> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Resend GET ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  return res.json() as Promise<T>;
}

/** Full received email, with inline images embedded in `html` as data URIs. */
export function getReceivedEmail(emailId: string): Promise<ReceivedEmail> {
  return resendGet(`/emails/receiving/${encodeURIComponent(emailId)}`);
}

export async function listReceivedAttachments(
  emailId: string,
): Promise<ReceivedAttachment[]> {
  const { data } = await resendGet<{ data: ReceivedAttachment[] }>(
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
  );
  return data;
}

export async function downloadAttachment(
  attachment: ReceivedAttachment,
): Promise<ArrayBuffer> {
  const res = await fetch(attachment.download_url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Downloading attachment ${attachment.filename} failed: ${res.status}`,
    );
  }
  return res.arrayBuffer();
}
