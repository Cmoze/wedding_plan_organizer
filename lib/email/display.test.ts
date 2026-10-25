import { describe, expect, it } from "vitest";
import { cleanEmailText, emailHtmlDocument } from "@/lib/email/display";

describe("cleanEmailText", () => {
  it("drops logos, tracking links and preheader filler", () => {
    const text = [
      "[Target]",
      "[image: Target logo]",
      "Your order is on its way‌ ͏‌ ͏ ",
      "",
      "",
      "",
      "Track package <https://click.target.example/t/abc123?utm=x>",
      "--------------------",
      "Stand mixer, from Sue Miller",
      `Details: https://click.target.example/${"x".repeat(80)}`,
    ].join("\r\n");
    expect(cleanEmailText(text)).toBe(
      [
        "Your order is on its way",
        "",
        "Track package",
        "Stand mixer, from Sue Miller",
        "Details: (link)",
      ].join("\n"),
    );
  });

  it("keeps ordinary text and short links as they are", () => {
    const text =
      "Hi Maya,\n\nThe deposit is $500 [due Nov 3].\nSee https://bloom.example/q";
    expect(cleanEmailText(text)).toBe(text);
  });
});

describe("emailHtmlDocument", () => {
  it("adds reading styles to the head and drops scripts", () => {
    const doc = emailHtmlDocument(
      '<html><head><title>x</title></head><body><img src="logo.png"><script>alert(1)</script></body></html>',
    );
    expect(doc).toMatch(
      /<head><base target="_blank"><style>[\s\S]*img\{max-width:100%/,
    );
    expect(doc).toContain('<img src="logo.png">');
    expect(doc).not.toContain("alert(1)");
  });

  it("wraps a bare HTML fragment in a full page", () => {
    const doc = emailHtmlDocument("<p>Hello</p>");
    expect(doc).toMatch(
      /^<!doctype html>[\s\S]*<body><p>Hello<\/p><\/body><\/html>$/,
    );
  });
});
