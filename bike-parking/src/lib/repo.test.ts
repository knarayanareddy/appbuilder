import { beforeEach, describe, expect, it } from "vitest";
import { configureDb } from "./idb";
import {
  allPhotoRecords,
  getPhotoBlob,
  loadSnapshot,
  removeBikeRecord,
  removePhotoRecord,
  replaceEverything,
  saveBikeRecord,
  savePhotoRecord,
  saveSettingsRecord,
  syncSlots,
} from "./repo";
import { makeBike, makeKey } from "./model";
import { buildSlots } from "./slots";
import { DEFAULT_SETTINGS, type PhotoRecord } from "@/types";

let counter = 0;

beforeEach(() => {
  counter += 1;
  configureDb({ name: `bike-lot-test-${counter}` });
});

describe("records", () => {
  it("saves and reads back a bike", async () => {
    const bike = makeBike({ name: "Gazelle" });
    await saveBikeRecord(bike);

    const snapshot = await loadSnapshot();
    expect(snapshot.bikes).toHaveLength(1);
    expect(snapshot.bikes[0].name).toBe("Gazelle");
  });

  it("starts from defaults when nothing has been saved", async () => {
    const snapshot = await loadSnapshot();
    expect(snapshot.bikes).toEqual([]);
    expect(snapshot.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("updates in place instead of duplicating", async () => {
    const bike = makeBike({ name: "Gazelle" });
    await saveBikeRecord(bike);
    await saveBikeRecord({ ...bike, name: "Gazelle 2" });

    const snapshot = await loadSnapshot();
    expect(snapshot.bikes).toHaveLength(1);
    expect(snapshot.bikes[0].name).toBe("Gazelle 2");
  });

  it("removes a bike", async () => {
    const bike = makeBike({ name: "Gazelle" });
    await saveBikeRecord(bike);
    await removeBikeRecord(bike.id);

    expect((await loadSnapshot()).bikes).toHaveLength(0);
  });

  it("persists settings", async () => {
    await saveSettingsRecord({ ...DEFAULT_SETTINGS, lotConfiguredAt: 42, lastBackupAt: 99 });
    const snapshot = await loadSnapshot();
    expect(snapshot.settings.lotConfiguredAt).toBe(42);
    expect(snapshot.settings.lastBackupAt).toBe(99);
  });

  it("keeps keys and slots sorted by zone", async () => {
    const slots = buildSlots([
      { code: "B", count: 2 },
      { code: "A", count: 2 },
    ]);
    await syncSlots(slots);

    const snapshot = await loadSnapshot();
    expect(snapshot.slots.map((s) => s.code)).toEqual(["A-01", "A-02", "B-01", "B-02"]);
  });
});

describe("syncSlots", () => {
  it("deletes places that no longer exist and keeps the rest", async () => {
    const original = buildSlots([{ code: "A", count: 3 }]);
    await syncSlots(original);

    const shrunk = original.slice(0, 2);
    await syncSlots(shrunk);

    const snapshot = await loadSnapshot();
    expect(snapshot.slots.map((s) => s.code)).toEqual(["A-01", "A-02"]);
    expect(snapshot.slots.map((s) => s.id)).toEqual(shrunk.map((s) => s.id));
  });
});

describe("photos", () => {
  it("stores a blob and gives the same bytes back", async () => {
    const photo: PhotoRecord = {
      id: "p1",
      kind: "bike",
      createdAt: 1,
      data: new TextEncoder().encode("jpeg-bytes").buffer as ArrayBuffer,
      mimeType: "image/jpeg",
    };
    await savePhotoRecord(photo);

    const blob = await getPhotoBlob("p1");
    expect(blob?.size).toBe("jpeg-bytes".length);
    expect(blob?.type).toBe("image/jpeg");

    const [stored] = await allPhotoRecords();
    expect(stored.mimeType).toBe("image/jpeg");
    expect(new TextDecoder().decode(new Uint8Array(stored.data))).toBe("jpeg-bytes");
  });

  it("returns null for a photo that is gone", async () => {
    expect(await getPhotoBlob("nope")).toBeNull();
  });

  it("removes a photo", async () => {
    await savePhotoRecord({
      id: "p1",
      kind: "bike",
      mimeType: "image/jpeg",
      createdAt: 1,
      data: new Uint8Array([1]).buffer as ArrayBuffer,
    });
    await removePhotoRecord("p1");
    expect(await getPhotoBlob("p1")).toBeNull();
  });
});

describe("replaceEverything", () => {
  it("replaces the current inventory completely (restore path)", async () => {
    await saveBikeRecord(makeBike({ name: "Old bike" }));
    await savePhotoRecord({
      id: "old-photo",
      kind: "bike",
      mimeType: "image/jpeg",
      createdAt: 1,
      data: new Uint8Array([1]).buffer as ArrayBuffer,
    });

    const slots = buildSlots([{ code: "Z", count: 2 }]);
    const key = makeKey({ label: "New key" });
    const bike = makeBike({ name: "Restored bike", slotId: slots[0].id, keyIds: [key.id] });

    await replaceEverything(
      {
        bikes: [bike],
        keys: [key],
        slots,
        settings: { ...DEFAULT_SETTINGS, lotConfiguredAt: 7 },
      },
      [
        {
          id: "new-photo",
          kind: "slot",
          mimeType: "image/jpeg",
          createdAt: 2,
          data: new Uint8Array([2]).buffer as ArrayBuffer,
        },
      ]
    );

    const snapshot = await loadSnapshot();
    expect(snapshot.bikes.map((b) => b.name)).toEqual(["Restored bike"]);
    expect(snapshot.keys.map((k) => k.label)).toEqual(["New key"]);
    expect(snapshot.slots.map((s) => s.code)).toEqual(["Z-01", "Z-02"]);
    expect(snapshot.settings.lotConfiguredAt).toBe(7);
    expect(await getPhotoBlob("old-photo")).toBeNull();
    expect(await allPhotoRecords()).toHaveLength(1);
  });
});
