import { describe, expect, it } from "vitest";
import { webLink } from "@/components/wedding/format";

describe("webLink", () => {
  it("adds https:// when it's missing", () => {
    expect(webLink("zola.com/registry/maya-jordan")).toBe(
      "https://zola.com/registry/maya-jordan",
    );
  });

  it("keeps http and https links", () => {
    expect(webLink(" https://www.amazon.com/wedding/abc ")).toBe(
      "https://www.amazon.com/wedding/abc",
    );
    expect(webLink("http://target.com/gift")).toBe("http://target.com/gift");
  });

  it("rejects other schemes and non-links", () => {
    expect(webLink("javascript:alert(1)")).toBeNull();
    expect(webLink("mailto:a@b.com")).toBeNull();
    expect(webLink("not a link")).toBeNull();
    expect(webLink("")).toBeNull();
  });
});
