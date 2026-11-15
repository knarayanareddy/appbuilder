import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * A backup you cannot get off the phone is not a backup. On Android the file is
 * written into the app's documents folder and then handed to the share sheet, so it
 * can go to Drive, email or a laptop in one more tap. In a browser it downloads.
 */
export const BACKUP_FOLDER = "Taal";

export interface SavedBackup {
  location: string;
  shared: boolean;
}

function downloadInBrowser(contents: string, fileName: string): SavedBackup {
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

export function backupFileName(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return `taal-backup-${stamp}.json`;
}

export async function saveBackupFile(contents: string, fileName: string): Promise<SavedBackup> {
  if (!Capacitor.isNativePlatform()) return downloadInBrowser(contents, fileName);

  const path = `${BACKUP_FOLDER}/${fileName}`;
  let location = `Documents/${path}`;
  let directory: Directory = Directory.Documents;
  let storedPath = path;

  try {
    await Filesystem.writeFile({ path, data: contents, directory, encoding: Encoding.UTF8, recursive: true });
  } catch {
    directory = Directory.Data;
    storedPath = fileName;
    await Filesystem.writeFile({ path: fileName, data: contents, directory, encoding: Encoding.UTF8, recursive: true });
    location = `App storage/${fileName}`;
  }

  let shared = false;
  try {
    const uri = await Filesystem.getUri({ path: storedPath, directory });
    const canShare = await Share.canShare();
    if (canShare.value) {
      await Share.share({ title: "Taal backup", text: fileName, url: uri.uri });
      shared = true;
    }
  } catch {
    /* sharing is a convenience, the file is already written */
  }

  return { location, shared };
}

export async function readTextFile(file: File): Promise<string> {
  return file.text();
}
