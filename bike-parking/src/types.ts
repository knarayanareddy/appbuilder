export type ID = string;

export type BikeStatus = "stored" | "out" | "service" | "sold";

export interface Bike {
  id: ID;
  name: string;
  /** Slot the bike lives in. Null = not assigned yet. */
  slotId: ID | null;
  /** Keys that fit this bike. Many-to-many — one key can open several bikes. */
  keyIds: ID[];
  /** Free-form labels: "kids", "road", "needs brake pads", "on loan to Ana"… */
  tags: string[];
  status: BikeStatus;
  notes: string;
  bikePhotoId: ID | null;
  slotPhotoId: ID | null;
  createdAt: number;
  updatedAt: number;
}

export interface LotKey {
  id: ID;
  label: string;
  /** Where the key itself is kept ("hook 3, left wall", "kitchen drawer"). */
  keptAt: string;
  note: string;
  createdAt: number;
}

export interface Slot {
  id: ID;
  /** Human-readable code painted on the physical rack, e.g. "B-07". */
  code: string;
  zone: string;
  index: number;
  note: string;
}

export interface PhotoRecord {
  id: ID;
  kind: "bike" | "slot";
  /**
   * Raw JPEG bytes. Stored as an ArrayBuffer rather than a Blob because
   * structured-clone support for Blob varies between storage engines, while
   * byte buffers are universal.
   */
  data: ArrayBuffer;
  mimeType: string;
  createdAt: number;
}

export interface ZoneSpec {
  code: string;
  count: number;
}

export interface Settings {
  id: "app";
  zones: ZoneSpec[];
  lotConfiguredAt: number | null;
  lastBackupAt: number | null;
}

export interface InventorySnapshot {
  bikes: Bike[];
  keys: LotKey[];
  slots: Slot[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  zones: [],
  lotConfiguredAt: null,
  lastBackupAt: null,
};

export const BIKE_STATUSES: BikeStatus[] = ["stored", "out", "service", "sold"];

export const STATUS_LABEL: Record<BikeStatus, string> = {
  stored: "In lot",
  out: "Out riding",
  service: "In service",
  sold: "Sold",
};

export type Tab = "lot" | "bikes" | "keys" | "settings";
