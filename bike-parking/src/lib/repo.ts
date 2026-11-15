import { clearAll, db } from "./idb";
import { DEFAULT_SETTINGS } from "@/types";
import type { Bike, InventorySnapshot, LotKey, PhotoRecord, Settings, Slot } from "@/types";

/**
 * The single place that knows how records are persisted. Everything above this
 * line is pure logic, which is what makes a later swap to Capacitor SQLite (or a
 * native file store) a contained change instead of a rewrite.
 */

export async function loadSnapshot(): Promise<InventorySnapshot> {
  const [bikes, keys, slots, settingsRows] = await Promise.all([
    db.all<Bike>("bikes"),
    db.all<LotKey>("keys"),
    db.all<Slot>("slots"),
    db.all<Settings>("settings"),
  ]);

  return {
    bikes,
    keys,
    slots: slots.sort((a, b) => (a.zone === b.zone ? a.index - b.index : a.zone.localeCompare(b.zone))),
    settings: settingsRows[0] ?? { ...DEFAULT_SETTINGS },
  };
}

export async function saveBikeRecord(bike: Bike): Promise<void> {
  await db.put("bikes", bike);
}

export async function removeBikeRecord(bikeId: string): Promise<void> {
  await db.remove("bikes", bikeId);
}

export async function saveKeyRecord(key: LotKey): Promise<void> {
  await db.put("keys", key);
}

export async function removeKeyRecord(keyId: string): Promise<void> {
  await db.remove("keys", keyId);
}

export async function saveSettingsRecord(settings: Settings): Promise<void> {
  await db.put("settings", settings);
}

/** Persist a new slot layout without losing the ids of slots that still exist. */
export async function syncSlots(slots: Slot[]): Promise<void> {
  const existing = await db.all<Slot>("slots");
  const keep = new Set(slots.map((s) => s.id));
  const removed = existing.filter((s) => !keep.has(s.id));
  await Promise.all(removed.map((s) => db.remove("slots", s.id)));
  await Promise.all(slots.map((s) => db.put("slots", s)));
}

export async function savePhotoRecord(photo: PhotoRecord): Promise<void> {
  await db.put("photos", photo);
}

export async function getPhotoRecord(photoId: string): Promise<PhotoRecord | null> {
  const record = await db.get<PhotoRecord>("photos", photoId);
  return record ?? null;
}

export async function getPhotoBlob(photoId: string): Promise<Blob | null> {
  const record = await getPhotoRecord(photoId);
  if (!record) return null;
  return new Blob([record.data], { type: record.mimeType || "image/jpeg" });
}

export async function removePhotoRecord(photoId: string): Promise<void> {
  await db.remove("photos", photoId);
}

export async function allPhotoRecords(): Promise<PhotoRecord[]> {
  return db.all<PhotoRecord>("photos");
}

export async function countPhotos(): Promise<number> {
  return (await allPhotoRecords()).length;
}

/** Restore: wipe and replace. Deliberately blunt, so a half-merge can't happen. */
export async function replaceEverything(
  snapshot: InventorySnapshot,
  photos: PhotoRecord[]
): Promise<void> {
  await clearAll();
  await Promise.all([
    ...snapshot.bikes.map((bike) => db.put("bikes", bike)),
    ...snapshot.keys.map((key) => db.put("keys", key)),
    ...snapshot.slots.map((slot) => db.put("slots", slot)),
    ...photos.map((photo) => db.put("photos", photo)),
    db.put("settings", snapshot.settings),
  ]);
}
