import { describe, expect, it } from "vitest";
import { findInboxAddress, parseAddress } from "@/lib/email/address";

describe("parseAddress", () => {
  it("splits a display name and address", () => {
    expect(parseAddress('"Rose Florals" <Hello@RoseFlorals.com>')).toEqual({
      name: "Rose Florals",
      address: "hello@roseflorals.com",
    });
  });

  it("handles a bare address", () => {
    expect(parseAddress("venue@example.com")).toEqual({
      name: null,
      address: "venue@example.com",
    });
  });
});

describe("findInboxAddress", () => {
  const domain = "jorauthook.resend.app";

  it("finds the wedding slug among recipients", () => {
    expect(
      findInboxAddress(
        [
          "mom@example.com",
          "Smith & Jones <Smith-Jones@jorauthook.resend.app>",
        ],
        domain,
      ),
    ).toEqual({
      slug: "smith-jones",
      address: "smith-jones@jorauthook.resend.app",
    });
  });

  it("drops a +tag", () => {
    expect(
      findInboxAddress(["smith-jones+venue@jorauthook.resend.app"], domain)
        ?.slug,
    ).toBe("smith-jones");
  });

  it("returns null when no recipient is on the inbound domain", () => {
    expect(findInboxAddress(["smith-jones@other.app"], domain)).toBeNull();
  });
});
