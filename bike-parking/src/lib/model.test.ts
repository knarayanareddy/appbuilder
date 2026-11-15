import { describe, expect, it } from "vitest";
import {
  applyZones,
  allTags,
  bikesForKey,
  emptySnapshot,
  freeSlots,
  keysForBike,
  lotStats,
  makeBike,
  makeKey,
  occupancy,
  searchBikes,
  withBike,
  withKey,
  withoutKey,
} from "./model";
import { buildSlots } from "./slots";
import type { InventorySnapshot } from "@/types";

function scene(): InventorySnapshot {
  const slots = buildSlots([{ code: "A", count: 3 }]);
  const blueKey = makeKey({ label: "Blue Abus", keptAt: "hook 3" });
  const redKey = makeKey({ label: "Red chain", keptAt: "kitchen drawer" });

  const gazelle = makeBike({
    name: "Gazelle",
    slotId: slots[0].id,
    keyIds: [blueKey.id],
    tags: ["road"],
    notes: "front brake squeals",
  });
  const bmx = makeBike({
    name: "Kids BMX",
    slotId: slots[1].id,
    keyIds: [blueKey.id, redKey.id],
    tags: ["kids"],
  });
  const folder = makeBike({ name: "Folder bike" }); // not assigned, not in lot
  const sold = makeBike({ name: "Old racer", slotId: slots[2].id, status: "sold" });

  return {
    bikes: [gazelle, bmx, folder, sold],
    keys: [blueKey, redKey],
    slots,
    settings: { id: "app", zones: [{ code: "A", count: 3 }], lotConfiguredAt: 1, lastBackupAt: null },
  };
}

describe("occupancy", () => {
  it("maps each place to the bike standing in it", () => {
    const snapshot = scene();
    const taken = occupancy(snapshot);
    expect(taken.get(snapshot.slots[0].id)?.name).toBe("Gazelle");
    expect(taken.get(snapshot.slots[1].id)?.name).toBe("Kids BMX");
  });

  it("does not count a sold bike as occupying its old place", () => {
    const snapshot = scene();
    expect(occupancy(snapshot).has(snapshot.slots[2].id)).toBe(false);
    expect(lotStats(snapshot)).toMatchObject({ totalSlots: 3, used: 2, free: 1, bikes: 4 });
  });

  it("frees the place of a bike that is out riding (it still has a home)", () => {
    const snapshot = scene();
    const out = { ...snapshot.bikes[0], status: "out" as const };
    const next = withBike(snapshot, out);
    expect(occupancy(next).get(snapshot.slots[0].id)?.name).toBe("Gazelle");
  });
});

describe("freeSlots", () => {
  it("offers only empty places", () => {
    const snapshot = scene();
    expect(freeSlots(snapshot).map((s) => s.code)).toEqual(["A-03"]);
  });

  it("includes the bike's own place when editing it", () => {
    const snapshot = scene();
    const gazelle = snapshot.bikes[0];
    expect(freeSlots(snapshot, gazelle.slotId).map((s) => s.code)).toEqual(["A-01", "A-03"]);
  });
});

describe("keys", () => {
  it("lists every bike one key opens", () => {
    const snapshot = scene();
    const blue = snapshot.keys[0];
    expect(bikesForKey(snapshot, blue.id).map((b) => b.name)).toEqual(["Gazelle", "Kids BMX"]);
  });

  it("gives a bike its keys", () => {
    const snapshot = scene();
    expect(keysForBike(snapshot, snapshot.bikes[1]).map((k) => k.label)).toEqual([
      "Blue Abus",
      "Red chain",
    ]);
  });

  it("detaches a deleted key from every bike instead of dangling", () => {
    const snapshot = scene();
    const red = snapshot.keys[1];
    const next = withoutKey(snapshot, red.id);
    expect(next.keys.map((k) => k.label)).toEqual(["Blue Abus"]);
    expect(next.bikes[1].keyIds).toEqual([snapshot.keys[0].id]);
    expect(keysForBike(next, next.bikes[1]).every((k) => k.id !== red.id)).toBe(true);
  });
});

describe("searchBikes", () => {
  it("matches a name, case-insensitively", () => {
    expect(searchBikes(scene(), { text: "gaz" }).map((b) => b.name)).toEqual(["Gazelle"]);
  });

  it("matches the place code you are standing in front of", () => {
    expect(searchBikes(scene(), { text: "A-02" }).map((b) => b.name)).toEqual(["Kids BMX"]);
  });

  it("matches a key label or where the key is kept", () => {
    expect(searchBikes(scene(), { text: "abus" }).map((b) => b.name)).toEqual(["Gazelle", "Kids BMX"]);
    expect(searchBikes(scene(), { text: "kitchen" }).map((b) => b.name)).toEqual(["Kids BMX"]);
  });

  it("matches notes and tags", () => {
    expect(searchBikes(scene(), { text: "squeals" }).map((b) => b.name)).toEqual(["Gazelle"]);
    expect(searchBikes(scene(), { tag: "kids" }).map((b) => b.name)).toEqual(["Kids BMX"]);
  });

  it("filters by status", () => {
    expect(searchBikes(scene(), { status: "sold" }).map((b) => b.name)).toEqual(["Old racer"]);
  });

  it("returns everything when the query is empty", () => {
    expect(searchBikes(scene(), {})).toHaveLength(4);
  });
});

describe("applyZones", () => {
  it("keeps bikes assigned when their place code still exists", () => {
    const snapshot = scene();
    const result = applyZones(snapshot, [{ code: "A", count: 5 }]);
    expect(result.orphaned).toHaveLength(0);
    expect(result.snapshot.bikes[0].slotId).toBe(snapshot.bikes[0].slotId);
    expect(result.snapshot.slots).toHaveLength(5);
  });

  it("unassigns bikes whose place disappears, without deleting them", () => {
    const snapshot = scene();
    const result = applyZones(snapshot, [{ code: "A", count: 1 }]);
    expect(result.orphaned.map((b) => b.name)).toEqual(["Kids BMX", "Old racer"]);
    expect(result.snapshot.bikes).toHaveLength(4);
    expect(result.snapshot.bikes[1].slotId).toBeNull();
    expect(result.snapshot.bikes[0].slotId).toBe(snapshot.bikes[0].slotId);
  });

  it("is a no-op for an empty snapshot", () => {
    const result = applyZones(emptySnapshot(), [{ code: "A", count: 2 }]);
    expect(result.snapshot.slots).toHaveLength(2);
    expect(result.snapshot.settings.lotConfiguredAt).not.toBeNull();
  });
});

describe("misc helpers", () => {
  it("collects all tags sorted", () => {
    expect(allTags(scene())).toEqual(["kids", "road"]);
  });

  it("adds and replaces bikes without duplicating", () => {
    const snapshot = scene();
    const renamed = { ...snapshot.bikes[0], name: "Gazelle 2" };
    const next = withBike(withBike(snapshot, renamed), renamed);
    expect(next.bikes.filter((b) => b.id === renamed.id)).toHaveLength(1);
    expect(next.bikes[0].name).toBe("Gazelle 2");
  });

  it("adds keys", () => {
    const snapshot = scene();
    const extra = makeKey({ label: "Spare" });
    expect(withKey(snapshot, extra).keys).toHaveLength(3);
  });
});
