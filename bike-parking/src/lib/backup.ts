import { fileStamp } from "./format";
import { DEFAULT_SETTINGS } from "@/types";
import type { Bike, BikeStatus, InventorySnapshot, LotKey, PhotoRecord, Settings, Slot } from "@/types";

export const BACKUP_KIND = "bike-lot-tracker-backup";
export const BACKUP_VERSION = 1;

export interface BackupPhoto {
  id: string;
  kind: "bike" | "slot";
  createdAt: number;
  dataUrl: string;
}

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  version: number;
  exportedAt: number;
  settings: Settings;
  slots: Slot[];
  keys: LotKey[];
  bikes: Bike[];
  photos: BackupPhoto[];
}

export function backupFileName(now = Date.now()): string {
  return `bike-lot-backup-${fileStamp(now)}.json`;
}

const CHUNK = 0x8000;

/** Bytes -> base64 data URL, synchronously and without blowing the call stack. */
export function bytesToDataUrl(data: ArrayBuffer, mimeType = "image/jpeg"): string {
  const bytes = new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export interface DecodedImage {
  data: ArrayBuffer;
  mimeType: string;
}

export function dataUrlToBytes(dataUrl: string): DecodedImage {
  const commaIndex = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || commaIndex === -1) {
    throw new Error("Not a data URL.");
  }
  const meta = dataUrl.slice(5, commaIndex);
  const isBase64 = meta.includes(";base64");
  const mimeType = meta.replace(";base64", "") || "application/octet-stream";
  const payload = dataUrl.slice(commaIndex + 1);

  if (!isBase64) {
    const bytes = new TextEncoder().encode(decodeURIComponent(payload));
    return { data: bytes.buffer as ArrayBuffer, mimeType };
  }

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { data: bytes.buffer as ArrayBuffer, mimeType };
}

export async function encodeBackup(
  snapshot: InventorySnapshot,
  photos: PhotoRecord[],
  now = Date.now()
): Promise<BackupFile> {
  const encoded: BackupPhoto[] = [];
  for (const photo of photos) {
    encoded.push({
      id: photo.id,
      kind: photo.kind,
      createdAt: photo.createdAt,
      dataUrl: bytesToDataUrl(photo.data, photo.mimeType || "image/jpeg"),
    });
  }
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: now,
    settings: snapshot.settings,
    slots: snapshot.slots,
    keys: snapshot.keys,
    bikes: snapshot.bikes,
    photos: encoded,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

const STATUSES: BikeStatus[] = ["stored", "out", "service", "sold"];

export interface DecodedBackup {
  snapshot: InventorySnapshot;
  photos: PhotoRecord[];
}

/**
 * Strict on the envelope, forgiving on individual records: a backup with one
 * odd bike should still restore everything else. Anything dangling (a bike
 * pointing at a deleted slot or a missing key) is repaired to a safe value.
 */
export function decodeBackup(raw: unknown): DecodedBackup {
  if (!isRecord(raw)) throw new Error("That file is not a Bike Lot backup.");
  if (raw.kind !== BACKUP_KIND) throw new Error("That file was not made by Bike Lot.");
  const version = asNumber(raw.version, 0);
  if (version < 1) throw new Error("Unknown backup version.");
  if (version > BACKUP_VERSION) {
    throw new Error("That backup comes from a newer version of the app.");
  }

  const slots: Slot[] = (Array.isArray(raw.slots) ? raw.slots : [])
    .filter(isRecord)
    .filter((s) => asString(s.id) && asString(s.code))
    .map((s) => ({
      id: asString(s.id),
      code: asString(s.code),
      zone: asString(s.zone, asString(s.code).split("-")[0] ?? "?"),
      index: asNumber(s.index, 0),
      note: asString(s.note),
    }));

  const keys: LotKey[] = (Array.isArray(raw.keys) ? raw.keys : [])
    .filter(isRecord)
    .filter((k) => asString(k.id) && asString(k.label))
    .map((k) => ({
      id: asString(k.id),
      label: asString(k.label),
      keptAt: asString(k.keptAt),
      note: asString(k.note),
      createdAt: asNumber(k.createdAt, Date.now()),
    }));

  const slotIds = new Set(slots.map((s) => s.id));
  const keyIds = new Set(keys.map((k) => k.id));
  const now = Date.now();

  const bikes: Bike[] = (Array.isArray(raw.bikes) ? raw.bikes : [])
    .filter(isRecord)
    .filter((b) => asString(b.id) && asString(b.name).trim().length > 0)
    .map((b) => {
      const slotId = asString(b.slotId) && slotIds.has(asString(b.slotId)) ? asString(b.slotId) : null;
      const statusRaw = asString(b.status, "stored");
      const status = (STATUSES as string[]).includes(statusRaw) ? (statusRaw as BikeStatus) : "stored";
      return {
        id: asString(b.id),
        name: asString(b.name).trim(),
        place: asString(b.place),
        slotId,
        keyIds: asStringArray(b.keyIds).filter((id) => keyIds.has(id)),
        tags: asStringArray(b.tags).map((t) => t.trim()).filter(Boolean),
        status,
        notes: asString(b.notes),
        bikePhotoId: asString(b.bikePhotoId) || null,
        slotPhotoId: asString(b.slotPhotoId) || null,
        createdAt: asNumber(b.createdAt, now),
        updatedAt: asNumber(b.updatedAt, now),
      };
    });

  const photos: PhotoRecord[] = [];
  for (const entry of Array.isArray(raw.photos) ? raw.photos : []) {
    if (!isRecord(entry)) continue;
    const dataUrl = asString(entry.dataUrl);
    const id = asString(entry.id);
    if (!id || !dataUrl) continue;
    try {
      const image = dataUrlToBytes(dataUrl);
      photos.push({
        id,
        kind: asString(entry.kind) === "slot" ? "slot" : "bike",
        createdAt: asNumber(entry.createdAt, now),
        data: image.data,
        mimeType: image.mimeType || "image/jpeg",
      });
    } catch {
      /* skip an unreadable image rather than failing the whole restore */
    }
  }

  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};
  const zones = (Array.isArray(settingsRaw.zones) ? settingsRaw.zones : [])
    .filter(isRecord)
    .filter((z) => asString(z.code) && asNumber(z.count, 0) > 0)
    .map((z) => ({ code: asString(z.code), count: asNumber(z.count, 0) }));

  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    zones,
    lotConfiguredAt: asNumber(settingsRaw.lotConfiguredAt, slots.length ? now : 0) || null,
    lastBackupAt: asNumber(settingsRaw.lastBackupAt, 0) || null,
  };

  const photoIds = new Set(photos.map((p) => p.id));
  for (const bike of bikes) {
    if (bike.bikePhotoId && !photoIds.has(bike.bikePhotoId)) bike.bikePhotoId = null;
    if (bike.slotPhotoId && !photoIds.has(bike.slotPhotoId)) bike.slotPhotoId = null;
  }

  return { snapshot: { bikes, keys, slots, settings }, photos };
}

export function parseBackupText(text: string): DecodedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON — it may be truncated.");
  }
  return decodeBackup(parsed);
}
