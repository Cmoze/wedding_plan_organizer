import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhook } from "@/lib/email/verify-webhook";

const key = Buffer.from("test-signing-key-0123456789");
const secret = `whsec_${key.toString("base64")}`;
const body = JSON.stringify({ type: "email.received", data: {} });
const now = new Date("2026-10-23T12:00:00Z");
const timestamp = String(now.getTime() / 1000);

function sign(id: string, ts: string, payload: string, signingKey = key) {
  const sig = createHmac("sha256", signingKey)
    .update(`${id}.${ts}.${payload}`)
    .digest("base64");
  return `v1,${sig}`;
}

describe("verifyWebhook", () => {
  it("accepts a valid signature", () => {
    const headers = {
      id: "msg_1",
      timestamp,
      signature: sign("msg_1", timestamp, body),
    };
    expect(verifyWebhook(secret, headers, body, now)).toBe(true);
  });

  it("accepts when any of several signatures matches", () => {
    const signature = `v1,bm90LXRoZS1yaWdodC1vbmU= ${sign("msg_1", timestamp, body)}`;
    expect(
      verifyWebhook(secret, { id: "msg_1", timestamp, signature }, body, now),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    const headers = {
      id: "msg_1",
      timestamp,
      signature: sign("msg_1", timestamp, body),
    };
    expect(verifyWebhook(secret, headers, body + " ", now)).toBe(false);
  });

  it("rejects a signature made with another key", () => {
    const signature = sign("msg_1", timestamp, body, Buffer.from("other-key"));
    expect(
      verifyWebhook(secret, { id: "msg_1", timestamp, signature }, body, now),
    ).toBe(false);
  });

  it("rejects an old timestamp", () => {
    const old = String(now.getTime() / 1000 - 10 * 60);
    const headers = {
      id: "msg_1",
      timestamp: old,
      signature: sign("msg_1", old, body),
    };
    expect(verifyWebhook(secret, headers, body, now)).toBe(false);
  });

  it("rejects missing headers", () => {
    expect(
      verifyWebhook(
        secret,
        { id: null, timestamp, signature: "v1,x" },
        body,
        now,
      ),
    ).toBe(false);
  });
});
