import { newId } from "./id";
import { buildSlots } from "./slots";
import { DEFAULT_SETTINGS } from "@/types";
import type {
  Bike,
  BikeStatus,
  InventorySnapshot,
  LotKey,
  Settings,
  Slot,
  ZoneSpec,
} from "@/types";

export function emptySnapshot(): InventorySnapshot {
  return { bikes: [], keys: [], slots: [], settings: { ...DEFAULT_SETTINGS } };
}

export function makeBike(partial: Partial<Bike> = {}): Bike {
  const now = Date.now();
  return {
    id: partial.id ?? newId(),
    name: partial.name?.trim() ?? "",
    place: partial.place?.trim() ?? "",
    slotId: partial.slotId ?? null,
    keyIds: partial.keyIds ?? [],
    tags: partial.tags ?? [],
    status: partial.status ?? "stored",
    notes: partial.notes ?? "",
    bikePhotoId: partial.bikePhotoId ?? null,
    slotPhotoId: partial.slotPhotoId ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

export function makeKey(partial: Partial<LotKey> = {}): LotKey {
  return {
    id: partial.id ?? newId(),
    label: partial.label?.trim() ?? "",
    keptAt: partial.keptAt ?? "",
    note: partial.note ?? "",
    createdAt: partial.createdAt ?? Date.now(),
  };
}

export function byName(a: Bike, b: Bike): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

/** Sold bikes keep their last slot as history but stop occupying a place. */
export function occupiesSlot(bike: Bike): boolean {
  return bike.slotId !== null && bike.status !== "sold";
}

/** slotId -> bike. One bike per slot; if data allows two, the newest wins. */
export function occupancy(snapshot: InventorySnapshot): Map<string, Bike> {
  const map = new Map<string, Bike>();
  for (const bike of snapshot.bikes) {
    if (!occupiesSlot(bike)) continue;
    const slotId = bike.slotId as string;
    const current = map.get(slotId);
    if (!current || current.updatedAt <= bike.updatedAt) map.set(slotId, bike);
  }
  return map;
}

export interface LotStats {
  totalSlots: number;
  used: number;
  free: number;
  bikes: number;
  byStatus: Record<BikeStatus, number>;
}

export function lotStats(snapshot: InventorySnapshot): LotStats {
  const used = occupancy(snapshot).size;
  const byStatus: Record<BikeStatus, number> = { stored: 0, out: 0, service: 0, sold: 0 };
  for (const bike of snapshot.bikes) byStatus[bike.status] += 1;
  return {
    totalSlots: snapshot.slots.length,
    used,
    free: Math.max(0, snapshot.slots.length - used),
    bikes: snapshot.bikes.length,
    byStatus,
  };
}

export function slotById(snapshot: InventorySnapshot, slotId: string | null): Slot | null {
  if (!slotId) return null;
  return snapshot.slots.find((s) => s.id === slotId) ?? null;
}

export function bikeForSlot(snapshot: InventorySnapshot, slotId: string): Bike | null {
  return occupancy(snapshot).get(slotId) ?? null;
}

export function keysForBike(snapshot: InventorySnapshot, bike: Bike): LotKey[] {
  return bike.keyIds
    .map((id) => snapshot.keys.find((k) => k.id === id))
    .filter((k): k is LotKey => Boolean(k));
}

export function bikesForKey(snapshot: InventorySnapshot, keyId: string): Bike[] {
  return snapshot.bikes.filter((b) => b.keyIds.includes(keyId)).sort(byName);
}

/**
 * The place as it should be shown: your own words first, then the optional
 * numbered place, then an honest "not placed yet".
 */
export function placeLabelOf(snapshot: InventorySnapshot, bike: Bike): string {
  const written = bike.place.trim();
  if (written) return written;
  const code = slotById(snapshot, bike.slotId)?.code;
  return code ?? "Not placed yet";
}

/** Short label for lists: the free text first line, or the numbered code. */
export function shortPlaceOf(snapshot: InventorySnapshot, bike: Bike): string {
  const written = bike.place.trim();
  const code = slotById(snapshot, bike.slotId)?.code;
  if (written && code) return `${code} · ${written.split("\n")[0]}`;
  if (written) return written.split("\n")[0];
  return code ?? "Not placed yet";
}

export function slotLabelOf(snapshot: InventorySnapshot, bike: Bike): string {
  return slotById(snapshot, bike.slotId)?.code ?? "Not placed yet";
}

export function zonesOf(snapshot: InventorySnapshot): string[] {
  return Array.from(new Set(snapshot.slots.map((s) => s.zone)));
}

export function freeSlots(snapshot: InventorySnapshot, exceptSlotId?: string | null): Slot[] {
  const taken = occupancy(snapshot);
  return snapshot.slots.filter((s) => !taken.has(s.id) || s.id === exceptSlotId);
}

export function allTags(snapshot: InventorySnapshot): string[] {
  const set = new Set<string>();
  for (const bike of snapshot.bikes) for (const tag of bike.tags) set.add(tag);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export interface BikeQuery {
  text?: string;
  tag?: string | null;
  status?: BikeStatus | "all";
}

/**
 * Search across the things you actually remember: the name, the slot code, the
 * key label, a tag, or a line you wrote in the notes.
 */
export function searchBikes(snapshot: InventorySnapshot, query: BikeQuery = {}): Bike[] {
  const text = (query.text ?? "").trim().toLowerCase();
  // Every word must appear, in any order: searching "flat tyre" finds a note
  // that says "flat rear tyre", which is how people actually remember things.
  const tokens = text.split(/\s+/).filter(Boolean);
  const tag = query.tag ?? null;
  const status = query.status ?? "all";

  return snapshot.bikes
    .filter((bike) => {
      if (status !== "all" && bike.status !== status) return false;
      if (tag && !bike.tags.includes(tag)) return false;
      if (tokens.length === 0) return true;
      const slot = slotById(snapshot, bike.slotId);
      const haystack = [
        bike.name,
        bike.place,
        slot?.code ?? "",
        slot?.zone ?? "",
        bike.notes,
        ...bike.tags,
        ...keysForBike(snapshot, bike).map((k) => k.label),
        ...keysForBike(snapshot, bike).map((k) => k.keptAt),
      ]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    })
    .sort(byName);
}

export interface PlaceGroup {
  place: string;
  bikes: Bike[];
}

const UNPLACED = "Not placed yet";

/** Group bikes under the place text you wrote, for when you do not use codes. */
export function bikesGroupedByPlace(
  snapshot: InventorySnapshot,
  query: BikeQuery = {}
): PlaceGroup[] {
  const groups = new Map<string, Bike[]>();
  for (const bike of searchBikes(snapshot, query)) {
    const key = bike.place.trim() || UNPLACED;
    const list = groups.get(key);
    if (list) list.push(bike);
    else groups.set(key, [bike]);
  }

  return Array.from(groups, ([place, bikes]) => ({ place, bikes })).sort((a, b) => {
    if (a.place === UNPLACED) return 1;
    if (b.place === UNPLACED) return -1;
    return a.place.localeCompare(b.place, undefined, { sensitivity: "base" });
  });
}

export function withBike(snapshot: InventorySnapshot, bike: Bike): InventorySnapshot {
  const exists = snapshot.bikes.some((b) => b.id === bike.id);
  return {
    ...snapshot,
    bikes: exists ? snapshot.bikes.map((b) => (b.id === bike.id ? bike : b)) : [...snapshot.bikes, bike],
  };
}

export function withoutBike(snapshot: InventorySnapshot, bikeId: string): InventorySnapshot {
  return { ...snapshot, bikes: snapshot.bikes.filter((b) => b.id !== bikeId) };
}

export function withKey(snapshot: InventorySnapshot, key: LotKey): InventorySnapshot {
  const exists = snapshot.keys.some((k) => k.id === key.id);
  return {
    ...snapshot,
    keys: exists ? snapshot.keys.map((k) => (k.id === key.id ? key : k)) : [...snapshot.keys, key],
  };
}

/** Deleting a key detaches it from every bike it used to open. */
export function withoutKey(snapshot: InventorySnapshot, keyId: string): InventorySnapshot {
  return {
    ...snapshot,
    keys: snapshot.keys.filter((k) => k.id !== keyId),
    bikes: snapshot.bikes.map((b) =>
      b.keyIds.includes(keyId)
        ? { ...b, keyIds: b.keyIds.filter((id) => id !== keyId), updatedAt: Date.now() }
        : b
    ),
  };
}

export function withSettings(snapshot: InventorySnapshot, settings: Settings): InventorySnapshot {
  return { ...snapshot, settings };
}

export interface ZoneApplyResult {
  snapshot: InventorySnapshot;
  /** Bikes whose slot no longer exists and were therefore unassigned. */
  orphaned: Bike[];
}

export function applyZones(snapshot: InventorySnapshot, zones: ZoneSpec[]): ZoneApplyResult {
  const slots = buildSlots(zones, snapshot.slots);
  const validIds = new Set(slots.map((s) => s.id));
  const orphaned: Bike[] = [];
  const bikes = snapshot.bikes.map((bike) => {
    if (bike.slotId && !validIds.has(bike.slotId)) {
      const next = { ...bike, slotId: null, updatedAt: Date.now() };
      orphaned.push(next);
      return next;
    }
    return bike;
  });

  return {
    snapshot: {
      ...snapshot,
      slots,
      bikes,
      settings: { ...snapshot.settings, zones, lotConfiguredAt: snapshot.settings.lotConfiguredAt ?? Date.now() },
    },
    orphaned,
  };
}
