import { makeBike, makeItem, makeKey } from "@/lib/model";
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
    items: [],
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
    items: [],
    keys: [blueKey],
    slots: [],
    settings: { id: "app", zones: [], lotConfiguredAt: 1, lastBackupAt: null },
  };
}

/** A few non-bike things stored in the same shed. */
export function itemsSnapshot(): InventorySnapshot {
  const base = wordsSnapshot();
  return {
    ...base,
    items: [
      makeItem({
        name: "MacBook Pro 14",
        place: "Top shelf of the metal cupboard, in the grey sleeve",
        tags: ["laptop", "work"],
        notes: "charger lives in the side pocket, not with the laptop",
      }),
      makeItem({
        name: "Spray paint can (black)",
        place: "Under the bench, in the crate with the tools",
        tags: ["paint"],
        notes: "",
      }),
      makeItem({ name: "Headphones", place: "", tags: ["audio"] }),
    ],
  };
}
