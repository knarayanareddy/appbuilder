import { describe, expect, it } from "vitest";
import {
  BACKUP_KIND,
  BACKUP_VERSION,
  backupFileName,
  bytesToDataUrl,
  dataUrlToBytes,
  decodeBackup,
  encodeBackup,
  parseBackupText,
} from "./backup";
import { makeBike, makeKey } from "./model";
import { buildSlots } from "./slots";
import type { InventorySnapshot, PhotoRecord } from "@/types";

function bytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}

function readBytes(data: ArrayBuffer): string {
  return new TextDecoder().decode(new Uint8Array(data));
}

function fixture() {
  const slots = buildSlots([{ code: "A", count: 2 }]);
  const key = makeKey({ label: "Blue Abus", keptAt: "hook 3" });
  const photo: PhotoRecord = {
    id: "photo-1",
    kind: "bike",
    createdAt: 1000,
    data: bytes("fake-jpeg-bytes"),
    mimeType: "image/jpeg",
  };
  const bike = makeBike({
    name: "Gazelle",
    place: "Behind the blue container, third rack from the wall",
    slotId: slots[0].id,
    keyIds: [key.id],
    tags: ["road"],
    bikePhotoId: photo.id,
  });
  const snapshot: InventorySnapshot = {
    bikes: [bike],
    keys: [key],
    slots,
    settings: { id: "app", zones: [{ code: "A", count: 2 }], lotConfiguredAt: 500, lastBackupAt: 900 },
  };
  return { snapshot, photos: [photo] };
}

describe("data url helpers", () => {
  it("round-trips bytes without loss", () => {
    const original = bytes("hello bike");
    const dataUrl = bytesToDataUrl(original, "image/jpeg");
    expect(dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);

    const restored = dataUrlToBytes(dataUrl);
    expect(restored.mimeType).toBe("image/jpeg");
    expect(readBytes(restored.data)).toBe("hello bike");
  });

  it("handles payloads larger than one base64 chunk", () => {
    const big = new Uint8Array(200_000);
    for (let i = 0; i < big.length; i += 1) big[i] = i % 256;

    const restored = dataUrlToBytes(bytesToDataUrl(big.buffer as ArrayBuffer));
    const out = new Uint8Array(restored.data);
    expect(out.length).toBe(big.length);
    expect(out[0]).toBe(0);
    expect(out[199_999]).toBe(199_999 % 256);
  });

  it("rejects something that is not a data URL", () => {
    expect(() => dataUrlToBytes("https://example.com/a.jpg")).toThrow(/not a data url/i);
  });
});

describe("encodeBackup / decodeBackup", () => {
  it("round-trips the whole inventory, photos included", async () => {
    const { snapshot, photos } = fixture();
    const file = await encodeBackup(snapshot, photos, 1234);

    expect(file.kind).toBe(BACKUP_KIND);
    expect(file.version).toBe(BACKUP_VERSION);
    expect(file.exportedAt).toBe(1234);
    expect(file.photos).toHaveLength(1);

    const decoded = decodeBackup(JSON.parse(JSON.stringify(file)));
    expect(decoded.snapshot.bikes[0].name).toBe("Gazelle");
    expect(decoded.snapshot.bikes[0].place).toBe("Behind the blue container, third rack from the wall");
    expect(decoded.snapshot.slots).toHaveLength(2);
    expect(decoded.snapshot.keys[0].keptAt).toBe("hook 3");
    expect(decoded.snapshot.settings.lastBackupAt).toBe(900);
    expect(readBytes(decoded.photos[0].data)).toBe("fake-jpeg-bytes");
    expect(decoded.photos[0].mimeType).toBe("image/jpeg");
  });

  it("restores a backup that has no written places (older exports)", () => {
    const decoded = decodeBackup({
      kind: BACKUP_KIND,
      version: 1,
      slots: [],
      keys: [],
      bikes: [{ id: "b1", name: "Old export bike" }],
      photos: [],
      settings: {},
    });
    expect(decoded.snapshot.bikes[0].place).toBe("");
  });

  it("refuses a file from another app", () => {
    expect(() => decodeBackup({ hello: "world" })).toThrow(/not made by Bike Lot/i);
    expect(() => decodeBackup("nope")).toThrow(/not a Bike Lot backup/i);
  });

  it("refuses a backup from a newer version", () => {
    expect(() => decodeBackup({ kind: BACKUP_KIND, version: BACKUP_VERSION + 1 })).toThrow(
      /newer version/i
    );
  });

  it("repairs dangling references instead of failing the restore", () => {
    const decoded = decodeBackup({
      kind: BACKUP_KIND,
      version: 1,
      slots: [{ id: "s1", code: "A-01", zone: "A", index: 1, note: "" }],
      keys: [{ id: "k1", label: "Blue Abus" }],
      bikes: [
        {
          id: "b1",
          name: "Ghost bike",
          slotId: "missing-slot",
          keyIds: ["k1", "missing-key"],
          bikePhotoId: "missing-photo",
          tags: ["road", 42],
        },
      ],
      photos: [],
      settings: { zones: [{ code: "A", count: 1 }] },
    });

    const bike = decoded.snapshot.bikes[0];
    expect(bike.slotId).toBeNull();
    expect(bike.keyIds).toEqual(["k1"]);
    expect(bike.bikePhotoId).toBeNull();
    expect(bike.tags).toEqual(["road"]);
    expect(bike.status).toBe("stored");
  });

  it("drops a broken image but keeps the rest of the backup", () => {
    const decoded = decodeBackup({
      kind: BACKUP_KIND,
      version: 1,
      slots: [],
      keys: [],
      bikes: [{ id: "b1", name: "Bike" }],
      photos: [
        { id: "p1", kind: "bike", dataUrl: "not-a-data-url" },
        { id: "p2", kind: "bike", dataUrl: "data:image/png;base64,aGVsbG8=" },
      ],
      settings: {},
    });

    expect(decoded.photos).toHaveLength(1);
    expect(decoded.photos[0].id).toBe("p2");
    expect(decoded.photos[0].mimeType).toBe("image/png");
  });

  it("skips records with no id or no name", () => {
    const decoded = decodeBackup({
      kind: BACKUP_KIND,
      version: 1,
      slots: [{ code: "A-01" }],
      keys: [{ label: "no id" }],
      bikes: [{ id: "b1", name: "  " }, { name: "no id" }],
      photos: [],
      settings: {},
    });
    expect(decoded.snapshot.slots).toHaveLength(0);
    expect(decoded.snapshot.keys).toHaveLength(0);
    expect(decoded.snapshot.bikes).toHaveLength(0);
  });

  it("treats an empty inventory as a valid backup", () => {
    const decoded = decodeBackup({
      kind: BACKUP_KIND,
      version: 1,
      slots: [],
      keys: [],
      bikes: [],
      photos: [],
      settings: {},
    });
    expect(decoded.snapshot.bikes).toHaveLength(0);
  });

  it("keeps a bike photo reference only when the photo survived", () => {
    const decoded = decodeBackup({
      kind: BACKUP_KIND,
      version: 1,
      slots: [],
      keys: [],
      bikes: [{ id: "b1", name: "Bike", bikePhotoId: "gone" }],
      photos: [],
      settings: {},
    });
    expect(decoded.snapshot.bikes[0].bikePhotoId).toBeNull();
  });
});

describe("parseBackupText", () => {
  it("explains a truncated file", () => {
    expect(() => parseBackupText('{"kind": "bike-lot')).toThrow(/not valid JSON/i);
  });

  it("reads a real export", async () => {
    const { snapshot, photos } = fixture();
    const file = await encodeBackup(snapshot, photos);
    const decoded = parseBackupText(JSON.stringify(file));
    expect(decoded.snapshot.bikes).toHaveLength(1);
  });
});

describe("backupFileName", () => {
  it("is filesystem-safe and sortable", () => {
    const name = backupFileName(new Date(2026, 10, 15, 18, 30).getTime());
    expect(name).toBe("bike-lot-backup-2026-11-15-1830.json");
  });
});
