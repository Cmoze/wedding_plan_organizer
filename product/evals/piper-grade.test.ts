import { describe, expect, it } from "vitest";
import { gradePiper } from "./piper-grade";

const rsvp = { kind: "set_rsvp", guest_id: "g3", rsvp: "attending" };

describe("gradePiper", () => {
  it("passes a reply that has the facts and the right proposals", () => {
    expect(
      gradePiper(
        {
          reply: "Tap the button below to record Rosa's RSVP. $3,700 is left.",
          actions: [{ ...rsvp, label: "Mark Rosa attending?" }],
        },
        { actions: [rsvp], mention: [["3,700", "3700"]] },
      ),
    ).toEqual([]);
  });

  it("doesn't count \"I've set up\" as claiming a save", () => {
    expect(
      gradePiper(
        { reply: "I've set up the task. Tap the button below.", actions: [] },
        { actions: [] },
      ),
    ).toEqual([]);
  });

  it("flags missing and extra proposals", () => {
    expect(
      gradePiper(
        { reply: "Tap below.", actions: [{ ...rsvp, guest_id: "g4" }] },
        { actions: [rsvp] },
      ),
    ).toEqual([
      `missing action ${JSON.stringify(rsvp)}`,
      `unexpected action ${JSON.stringify({ ...rsvp, guest_id: "g4" })}`,
    ]);
  });

  it("flags avoided text, markdown and claims that something was saved", () => {
    expect(
      gradePiper(
        { reply: "**Done!** I've marked it. Call 555-0101.", actions: [] },
        { actions: [], avoid: ["call"], avoidPattern: "\\d{3}-\\d{4}" },
      ),
    ).toEqual([
      'mentions "call"',
      "matches /\\d{3}-\\d{4}/",
      "uses markdown",
      "claims a change was saved",
    ]);
  });
});
