import { makeBike, makeKey } from "@/lib/model";
import { buildSlots } from "@/lib/slots";
import type { InventorySnapshot } from "@/types";

/** A small, fully-populated lot: 3 places, 2 keys, 2 bikes in the lot. */
export function testSnapshot(): InventorySnapshot {
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
  const bmx = makeBike({ name: "Kids BMX", slotId: slots[1].id, keyIds: [blueKey.id, redKey.id] });

  return {
    bikes: [gazelle, bmx],
    keys: [blueKey, redKey],
    slots,
    settings: { id: "app", zones: [{ code: "A", count: 3 }], lotConfiguredAt: 1, lastBackupAt: null },
  };
}
