import { describe, expect, it } from "vitest";
import { buildSlots, formatZoneSpecs, parseZoneSpecs, slotCode, totalSlots } from "./slots";

describe("slot codes", () => {
  it("pads place numbers so they sort and read the same everywhere", () => {
    expect(slotCode("B", 7)).toBe("B-07");
    expect(slotCode("A", 100)).toBe("A-100");
  });
});

describe("parseZoneSpecs", () => {
  it("reads the compact ZONE=COUNT format", () => {
    const { zones, errors } = parseZoneSpecs("A=25, B=25");
    expect(errors).toEqual([]);
    expect(zones).toEqual([
      { code: "A", count: 25 },
      { code: "B", count: 25 },
    ]);
    expect(totalSlots(zones)).toBe(50);
  });

  it("accepts colons, spaces, x and newlines", () => {
    const { zones, errors } = parseZoneSpecs("a:10\nb 12\nc x 8");
    expect(errors).toEqual([]);
    expect(zones).toEqual([
      { code: "A", count: 10 },
      { code: "B", count: 12 },
      { code: "C", count: 8 },
    ]);
  });

  it("uppercases zone codes so 'a' and 'A' are the same row", () => {
    expect(parseZoneSpecs("a=5").zones[0].code).toBe("A");
  });

  it("gives bare numbers the next free letter", () => {
    expect(parseZoneSpecs("A=10, 15").zones).toEqual([
      { code: "A", count: 10 },
      { code: "B", count: 15 },
    ]);
  });

  it("rejects a zone that appears twice", () => {
    const { errors } = parseZoneSpecs("A=10, A=12");
    expect(errors.join(" ")).toMatch(/appears twice/i);
  });

  it("explains what is wrong with unreadable input", () => {
    const { errors } = parseZoneSpecs("row one pls");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/ZONE=COUNT/);
  });

  it("refuses a layout bigger than the supported maximum", () => {
    const { errors } = parseZoneSpecs("A=400, B=400");
    expect(errors.join(" ")).toMatch(/limit is/i);
  });

  it("returns nothing for empty input without exploding", () => {
    expect(parseZoneSpecs("   ")).toEqual({ zones: [], errors: [] });
  });
});

describe("buildSlots", () => {
  it("creates one slot per place, ordered", () => {
    const slots = buildSlots([{ code: "A", count: 3 }]);
    expect(slots.map((s) => s.code)).toEqual(["A-01", "A-02", "A-03"]);
    expect(slots.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it("keeps the id of every place whose code survives a layout change", () => {
    const first = buildSlots([{ code: "A", count: 3 }]);
    const second = buildSlots([{ code: "A", count: 5 }], first);

    expect(second).toHaveLength(5);
    expect(second.slice(0, 3).map((s) => s.id)).toEqual(first.map((s) => s.id));
    expect(new Set(second.map((s) => s.id)).size).toBe(5);
  });

  it("keeps notes attached to a place across a rebuild", () => {
    const first = buildSlots([{ code: "A", count: 2 }]);
    first[0].note = "loose bolt";
    const second = buildSlots([{ code: "A", count: 2 }], first);
    expect(second[0].note).toBe("loose bolt");
  });
});

describe("formatZoneSpecs", () => {
  it("round-trips through the parser", () => {
    const zones = [
      { code: "A", count: 25 },
      { code: "B", count: 12 },
    ];
    expect(parseZoneSpecs(formatZoneSpecs(zones)).zones).toEqual(zones);
  });
});
