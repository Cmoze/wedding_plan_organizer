import { describe, expect, it } from "vitest";
import { groupSuggestions, phaseFor } from "@/lib/db/checklist-suggestions";

const t = (id: string, months_before: number, sort_order: number) => ({
  id,
  months_before,
  sort_order,
});

describe("phaseFor", () => {
  it("puts each months_before in the right phase", () => {
    expect(phaseFor(12).key).toBe("year");
    expect(phaseFor(9).key).toBe("half");
    expect(phaseFor(6).key).toBe("half");
    expect(phaseFor(5).key).toBe("quarter");
    expect(phaseFor(3).key).toBe("quarter");
    expect(phaseFor(1).key).toBe("last");
    expect(phaseFor(0.5).key).toBe("last");
    expect(phaseFor(0.1).key).toBe("week");
    expect(phaseFor(0).key).toBe("week");
  });
});

describe("groupSuggestions", () => {
  it("groups in phase order, sorts by plan order, and drops empty phases", () => {
    const groups = groupSuggestions([
      t("b", 12, 2),
      t("a", 12, 1),
      t("z", 0, 40),
    ]);
    expect(groups.map((g) => g.phase.key)).toEqual(["year", "week"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("leaves out suggestions already on the checklist", () => {
    const groups = groupSuggestions(
      [t("a", 12, 1), t("b", 12, 2)],
      ["a", null],
    );
    expect(groups[0].items.map((i) => i.id)).toEqual(["b"]);
  });
});
