import { useCallback, useEffect, useRef, useState } from "react";
import { backupFileName, encodeBackup, parseBackupText } from "@/lib/backup";
import { newId } from "@/lib/id";
import { downscaleImage } from "@/lib/image";
import {
  applyZones,
  emptySnapshot,
  makeBike,
  makeKey,
  withBike,
  withKey,
  withSettings,
  withoutBike,
  withoutKey,
} from "@/lib/model";
import { requestPersistentStorage, saveBackupFile } from "@/lib/native";
import * as repo from "@/lib/repo";
import type { Bike, BikeStatus, ID, InventorySnapshot, LotKey, ZoneSpec } from "@/types";

export interface BikeDraft {
  id?: ID;
  name: string;
  /** Free-text place, in the user's own words. */
  place: string;
  slotId: ID | null;
  keyIds: ID[];
  tags: string[];
  status: BikeStatus;
  notes: string;
  /** New photo picked this session (stored after downscaling). */
  bikePhoto?: Blob | null;
  slotPhoto?: Blob | null;
  clearBikePhoto?: boolean;
  clearSlotPhoto?: boolean;
}

export interface KeyDraft {
  id?: ID;
  label: string;
  keptAt: string;
  note: string;
}

export interface BackupResult {
  fileName: string;
  location: string;
  shared: boolean;
}

export interface RestoreResult {
  bikes: number;
  photos: number;
  slots: number;
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/\s+/g, " ");
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function storePhoto(blob: Blob, kind: "bike" | "slot"): Promise<ID> {
  const scaled = await downscaleImage(blob);
  const id = newId();
  await repo.savePhotoRecord({
    id,
    kind,
    data: await scaled.arrayBuffer(),
    mimeType: scaled.type || "image/jpeg",
    createdAt: Date.now(),
  });
  return id;
}

export function useInventory() {
  const [snapshot, setSnapshot] = useState<InventorySnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshotRef = useRef(snapshot);
  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const reload = useCallback(async () => {
    try {
      const loaded = await repo.loadSnapshot();
      setSnapshot(loaded);
      snapshotRef.current = loaded;
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Ask for "persistent" storage once the app has actually opened the database.
  useEffect(() => {
    if (loading) return;
    void requestPersistentStorage();
  }, [loading]);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setSaving(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveBike = useCallback(
    (draft: BikeDraft) =>
      run(async () => {
        const existing = draft.id ? snapshotRef.current.bikes.find((b) => b.id === draft.id) : undefined;
        const base = existing ?? makeBike();

        let bikePhotoId = base.bikePhotoId;
        let slotPhotoId = base.slotPhotoId;

        if (draft.bikePhoto) {
          const nextId = await storePhoto(draft.bikePhoto, "bike");
          if (base.bikePhotoId) await repo.removePhotoRecord(base.bikePhotoId);
          bikePhotoId = nextId;
        } else if (draft.clearBikePhoto && bikePhotoId) {
          await repo.removePhotoRecord(bikePhotoId);
          bikePhotoId = null;
        }

        if (draft.slotPhoto) {
          const nextId = await storePhoto(draft.slotPhoto, "slot");
          if (base.slotPhotoId) await repo.removePhotoRecord(base.slotPhotoId);
          slotPhotoId = nextId;
        } else if (draft.clearSlotPhoto && slotPhotoId) {
          await repo.removePhotoRecord(slotPhotoId);
          slotPhotoId = null;
        }

        const bike: Bike = {
          ...base,
          name: draft.name.trim(),
          place: draft.place.trim(),
          slotId: draft.slotId,
          keyIds: Array.from(new Set(draft.keyIds)),
          tags: normalizeTags(draft.tags),
          status: draft.status,
          notes: draft.notes.trim(),
          bikePhotoId,
          slotPhotoId,
          updatedAt: Date.now(),
        };

        await repo.saveBikeRecord(bike);
        setSnapshot((prev) => withBike(prev, bike));
        return bike;
      }),
    [run]
  );

  const deleteBike = useCallback(
    (bikeId: ID) =>
      run(async () => {
        const bike = snapshotRef.current.bikes.find((b) => b.id === bikeId);
        if (bike?.bikePhotoId) await repo.removePhotoRecord(bike.bikePhotoId);
        if (bike?.slotPhotoId) await repo.removePhotoRecord(bike.slotPhotoId);
        await repo.removeBikeRecord(bikeId);
        setSnapshot((prev) => withoutBike(prev, bikeId));
      }),
    [run]
  );

  const setStatus = useCallback(
    (bikeId: ID, status: BikeStatus) =>
      run(async () => {
        const bike = snapshotRef.current.bikes.find((b) => b.id === bikeId);
        if (!bike) return;
        const next: Bike = { ...bike, status, updatedAt: Date.now() };
        await repo.saveBikeRecord(next);
        setSnapshot((prev) => withBike(prev, next));
      }),
    [run]
  );

  const assignSlot = useCallback(
    (bikeId: ID, slotId: ID | null) =>
      run(async () => {
        const bike = snapshotRef.current.bikes.find((b) => b.id === bikeId);
        if (!bike) return;
        const next: Bike = { ...bike, slotId, updatedAt: Date.now() };
        await repo.saveBikeRecord(next);
        setSnapshot((prev) => withBike(prev, next));
      }),
    [run]
  );

  const saveKey = useCallback(
    (draft: KeyDraft) =>
      run(async () => {
        const existing = draft.id ? snapshotRef.current.keys.find((k) => k.id === draft.id) : undefined;
        const key: LotKey = {
          ...(existing ?? makeKey()),
          label: draft.label.trim(),
          keptAt: draft.keptAt.trim(),
          note: draft.note.trim(),
        };
        await repo.saveKeyRecord(key);
        setSnapshot((prev) => withKey(prev, key));
        return key;
      }),
    [run]
  );

  const deleteKey = useCallback(
    (keyId: ID) =>
      run(async () => {
        const affected = snapshotRef.current.bikes.filter((b) => b.keyIds.includes(keyId));
        await repo.removeKeyRecord(keyId);
        await Promise.all(
          affected.map((bike) =>
            repo.saveBikeRecord({
              ...bike,
              keyIds: bike.keyIds.filter((id) => id !== keyId),
              updatedAt: Date.now(),
            })
          )
        );
        setSnapshot((prev) => withoutKey(prev, keyId));
      }),
    [run]
  );

  /** Tick/untick a bike on the key screen. */
  const setKeyOnBike = useCallback(
    (bikeId: ID, keyId: ID, attached: boolean) =>
      run(async () => {
        const bike = snapshotRef.current.bikes.find((b) => b.id === bikeId);
        if (!bike) return;
        const keyIds = attached
          ? Array.from(new Set([...bike.keyIds, keyId]))
          : bike.keyIds.filter((id) => id !== keyId);
        const next: Bike = { ...bike, keyIds, updatedAt: Date.now() };
        await repo.saveBikeRecord(next);
        setSnapshot((prev) => withBike(prev, next));
      }),
    [run]
  );

  const configureLot = useCallback(
    (zones: ZoneSpec[]) =>
      run(async () => {
        const result = applyZones(snapshotRef.current, zones);
        await repo.syncSlots(result.snapshot.slots);
        await Promise.all(result.orphaned.map((bike) => repo.saveBikeRecord(bike)));
        await repo.saveSettingsRecord(result.snapshot.settings);
        setSnapshot(result.snapshot);
        snapshotRef.current = result.snapshot;
        return { orphaned: result.orphaned.length, slots: result.snapshot.slots.length };
      }),
    [run]
  );

  const createBackup = useCallback(
    () =>
      run<BackupResult>(async () => {
        const photos = await repo.allPhotoRecords();
        const file = await encodeBackup(snapshotRef.current, photos);
        const fileName = backupFileName();
        const saved = await saveBackupFile(JSON.stringify(file), fileName);
        const settings = { ...snapshotRef.current.settings, lastBackupAt: Date.now() };
        await repo.saveSettingsRecord(settings);
        setSnapshot((prev) => withSettings(prev, settings));
        return { fileName, ...saved };
      }),
    [run]
  );

  const restoreBackup = useCallback(
    (file: File) =>
      run<RestoreResult>(async () => {
        const text = await file.text();
        const decoded = parseBackupText(text);
        await repo.replaceEverything(decoded.snapshot, decoded.photos);
        setSnapshot(decoded.snapshot);
        snapshotRef.current = decoded.snapshot;
        return {
          bikes: decoded.snapshot.bikes.length,
          photos: decoded.photos.length,
          slots: decoded.snapshot.slots.length,
        };
      }),
    [run]
  );

  return {
    snapshot,
    loading,
    saving,
    error,
    reload,
    saveBike,
    deleteBike,
    setStatus,
    assignSlot,
    saveKey,
    deleteKey,
    setKeyOnBike,
    configureLot,
    createBackup,
    restoreBackup,
  };
}

export type Inventory = ReturnType<typeof useInventory>;
