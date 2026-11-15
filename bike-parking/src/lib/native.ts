import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

export const NATIVE_FOLDER = "BikeLot";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export interface SavedFile {
  /** Human-readable place the file landed, shown to the user. */
  location: string;
  shared: boolean;
}

/** Ask the browser/WebView to keep this origin's data out of automatic eviction. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const storage = navigator.storage as StorageManager | undefined;
    if (!storage?.persist) return false;
    if (storage.persisted) {
      const already = await storage.persisted();
      if (already) return true;
    }
    return await storage.persist();
  } catch {
    return false;
  }
}

export interface StorageInfo {
  usage: number;
  quota: number;
}

export async function storageInfo(): Promise<StorageInfo | null> {
  try {
    const storage = navigator.storage as StorageManager | undefined;
    if (!storage?.estimate) return null;
    const estimate = await storage.estimate();
    return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
  } catch {
    return null;
  }
}

function downloadInBrowser(contents: string, fileName: string): SavedFile {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return { location: `Downloads/${fileName}`, shared: false };
}

/**
 * Writes the backup next to the app's own documents and then offers the Android
 * share sheet, so the file can go to Drive/email in one more tap.
 */
export async function saveBackupFile(contents: string, fileName: string): Promise<SavedFile> {
  if (!isNative()) return downloadInBrowser(contents, fileName);

  const path = `${NATIVE_FOLDER}/${fileName}`;
  let location = `Documents/${path}`;
  let directory: Directory = Directory.Documents;

  try {
    await Filesystem.writeFile({
      path,
      data: contents,
      directory,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  } catch {
    // Some Android builds refuse the public Documents folder; app storage always works.
    directory = Directory.Data;
    await Filesystem.writeFile({
      path: fileName,
      data: contents,
      directory,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    location = `App storage/${fileName}`;
  }

  let shared = false;
  try {
    const uri = await Filesystem.getUri({
      path: directory === Directory.Data ? fileName : path,
      directory,
    });
    const canShare = await Share.canShare();
    if (canShare.value) {
      await Share.share({
        title: "Bike Lot backup",
        text: `Bike Lot backup ${fileName}`,
        url: uri.uri,
      });
      shared = true;
    }
  } catch {
    /* sharing is a convenience, not a requirement */
  }

  return { location, shared };
}

export async function readTextFile(file: File): Promise<string> {
  return file.text();
}
