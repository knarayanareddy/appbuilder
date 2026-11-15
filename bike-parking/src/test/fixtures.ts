import { makeBike, makeKey } from "@/lib/model";
import { buildSlots } from "@/lib/slots";
import type { InventorySnapshot } from "@/types";

export const VERBOSE_PLACE =
  "Back left corner, behind the blue container — third rack from the wall, top hook. Locked to the frame with the blue Abus.";

/** Numbered lot: 3 places, 2 keys, 2 bikes, both with written descriptions. */
export function testSnapshot(): InventorySnapshot {
  const slots = buildSlots([{ code: "A", count: 3 }]);
  const blueKey = makeKey({ label: "Blue Abus", keptAt: "hook 3" });
  const redKey = makeKey({ label: "Red chain", keptAt: "kitchen drawer" });

  const gazelle = makeBike({
    name: "Gazelle",
    place: VERBOSE_PLACE,
    slotId: slots[0].id,
    keyIds: [blueKey.id],
    tags: ["road"],
    notes: "front brake squeals",
  });
  const bmx = makeBike({ name: "Kids BMX", slotId: slots[1].id, keyIds: [blueKey.id, redKey.id] });

  return {
    bikes: [gazelle, bmx],
    keys: [blueKey, redKey],
    slots,
    settings: { id: "app", zones: [{ code: "A", count: 3 }], lotConfiguredAt: 1, lastBackupAt: null },
  };
}

/** Words-only lot: no numbered places at all, three bikes, one without a place. */
export function wordsSnapshot(): InventorySnapshot {
  const blueKey = makeKey({ label: "Blue Abus", keptAt: "hook 3" });

  const gazelle = makeBike({
    name: "Gazelle",
    place: VERBOSE_PLACE,
    keyIds: [blueKey.id],
    tags: ["road"],
    notes: "front brake squeals",
  });
  const bmx = makeBike({ name: "Kids BMX", place: "By the door, under the stairs", tags: ["kids"] });
  const cargo = makeBike({ name: "Cargo bike", place: "", notes: "needs a new rear tyre" });

  return {
    bikes: [gazelle, bmx, cargo],
    keys: [blueKey],
    slots: [],
    settings: { id: "app", zones: [], lotConfiguredAt: 1, lastBackupAt: null },
  };
}
