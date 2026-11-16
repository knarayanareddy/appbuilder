import { kvGet, kvSet } from "./db";

/**
 * Proof that this phone can actually keep the learner's progress.
 *
 * The dangerous failure is not a crash: it is an app that looks like it is saving and
 * is not. IndexedDB can refuse writes (storage full, WebView data cleared, a corrupted
 * app data directory) and every call here still resolves quietly unless somebody looks.
 * So once per launch the app writes a token, reads it back, and reports the truth.
 */
export interface StorageProbe {
  /** Can the app read back what it just wrote? */
  ok: boolean;
  /** Only set when ok is false — what to tell the learner, in plain words. */
  error: string | null;
  /** The platform promised not to evict this data without being asked. */
  persisted: boolean;
  /** Bytes the whole app is using, when the platform reports it. */
  usage: number | null;
}

const PROBE_KEY = "__storage_probe";

type Write = (key: string, value: unknown) => Promise<void>;
type Read = <T>(key: string) => Promise<T | undefined>;

export async function probeStorage(deps: { write?: Write; read?: Read } = {}): Promise<StorageProbe> {
  const write = deps.write ?? kvSet;
  const read = (deps.read ?? kvGet) as Read;
  const token = `probe-${Date.now()}`;

  let ok = true;
  let error: string | null = null;

  try {
    await write(PROBE_KEY, token);
    const back = await read<string>(PROBE_KEY);
    if (back !== token) {
      ok = false;
      error = "the phone stored the data but read something else back";
    }
  } catch (problem) {
    ok = false;
    error = problem instanceof Error ? problem.message : "the phone refused to store anything";
  }

  return {
    ok,
    error,
    persisted: ok ? await askPersist() : false,
    usage: ok ? await usedBytes() : null,
  };
}

/** Best effort: browsers may refuse, and WebView ignores it. Never throws. */
async function askPersist(): Promise<boolean> {
  try {
    const storage = navigator.storage as StorageManager | undefined;
    if (!storage?.persist) return false;
    if (await storage.persisted?.()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

async function usedBytes(): Promise<number | null> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    return typeof estimate?.usage === "number" ? estimate.usage : null;
  } catch {
    return null;
  }
}

/** "12 KB", "4.8 MB" — small numbers stay exact, because they are all this app makes. */
export function formatBytes(bytes: number | null | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "unknown";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * How long ago the last backup was taken, in words. Null means never, which is the one
 * answer worth acting on — the rest is reassurance.
 */
export function backupAge(lastBackupAt: number | null | undefined, now: number): string {
  if (typeof lastBackupAt !== "number" || !Number.isFinite(lastBackupAt) || lastBackupAt <= 0) return "never";
  const days = Math.floor((now - lastBackupAt) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}

/** A backup is worth nagging about once there is real work to lose. */
export function backupIsStale(lastBackupAt: number | null | undefined, now: number, attempts: number): boolean {
  if (attempts < 100) return false;
  if (typeof lastBackupAt !== "number" || lastBackupAt <= 0) return true;
  return now - lastBackupAt > 30 * 86_400_000;
}
