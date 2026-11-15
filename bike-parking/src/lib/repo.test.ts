import { beforeEach, describe, expect, it } from "vitest";
import { configureDb, db } from "./idb";
import {
  allPhotoRecords,
  saveItemRecord,
  removeItemRecord,
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
import { makeBike, makeItem, makeKey } from "./model";
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

describe("records from an older version", () => {
  it("loads an item written before photos existed, with an empty photo list", async () => {
    // Bypasses the types on purpose: this is the shape the previous build wrote.
    await db.put("items", {
      id: "legacy-item",
      name: "Old laptop",
      place: "Top shelf",
      tags: ["laptop"],
      notes: "",
      createdAt: 1,
      updatedAt: 1,
    });

    const snapshot = await loadSnapshot();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].photoIds).toEqual([]);
    expect(snapshot.items[0].place).toBe("Top shelf");
  });

  it("loads a bike written before free-text places existed", async () => {
    await db.put("bikes", {
      id: "legacy-bike",
      name: "Old bike",
      slotId: null,
      keyIds: [],
      tags: [],
      status: "stored",
      notes: "",
      bikePhotoId: null,
      slotPhotoId: null,
      createdAt: 1,
      updatedAt: 1,
    });

    const snapshot = await loadSnapshot();
    expect(snapshot.bikes[0].place).toBe("");
    expect(snapshot.bikes[0].tags).toEqual([]);
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

describe("items", () => {
  it("saves, updates and removes a non-bike item", async () => {
    const item = makeItem({ name: "MacBook Pro 14", place: "Top shelf" });
    await saveItemRecord(item);
    expect((await loadSnapshot()).items.map((i) => i.name)).toEqual(["MacBook Pro 14"]);

    await saveItemRecord({ ...item, name: "MacBook Air" });
    const updated = await loadSnapshot();
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].name).toBe("MacBook Air");

    await removeItemRecord(item.id);
    expect((await loadSnapshot()).items).toHaveLength(0);
  });

  it("keeps bikes and items side by side", async () => {
    await saveBikeRecord(makeBike({ name: "Gazelle" }));
    await saveItemRecord(makeItem({ name: "Charger" }));

    const snapshot = await loadSnapshot();
    expect(snapshot.bikes.map((b) => b.name)).toEqual(["Gazelle"]);
    expect(snapshot.items.map((i) => i.name)).toEqual(["Charger"]);
  });

  it("upgrades a version-1 database without losing the bikes already in it", async () => {
    const name = `bike-lot-migration-${++counter}`;

    // Build a database exactly as the first release did: no "items" store.
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        for (const store of ["bikes", "keys", "slots", "photos", "settings"]) {
          database.createObjectStore(store, { keyPath: "id" });
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction("bikes", "readwrite");
        tx.objectStore("bikes").put(makeBike({ name: "Old bike" }));
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });

    configureDb({ name, version: 2 });

    const afterUpgrade = await loadSnapshot();
    expect(afterUpgrade.bikes.map((b) => b.name)).toEqual(["Old bike"]);
    expect(afterUpgrade.items).toEqual([]);

    await saveItemRecord(makeItem({ name: "Laptop" }));
    expect((await loadSnapshot()).items.map((i) => i.name)).toEqual(["Laptop"]);
    expect((await loadSnapshot()).bikes).toHaveLength(1);
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
        items: [makeItem({ name: "Restored laptop", place: "Shelf 2" })],
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
    expect(snapshot.items.map((i) => i.name)).toEqual(["Restored laptop"]);
    expect(await getPhotoBlob("old-photo")).toBeNull();
    expect(await allPhotoRecords()).toHaveLength(1);
  });
});
