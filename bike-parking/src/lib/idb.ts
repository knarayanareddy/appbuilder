/**
 * Thin promise wrapper over IndexedDB.
 *
 * Why IndexedDB and not localStorage: localStorage caps out around 5 MB and only
 * holds strings, so 100+ photos (≈100 KB each even after downscaling) would blow
 * it up and force ~33 % base64 bloat. IndexedDB stores real Blobs and gets a quota
 * measured against free disk space.
 *
 * Version 2 adds the "items" store. Upgrades only ever create missing stores,
 * so an existing inventory (bikes, photos, keys) is carried over untouched.
 *
 * Inside the Android WebView this data lives in the app's private storage
 * (`/data/data/com.bikelot.tracker/app_webview`), which is untouched by Chrome's
 * "clear browsing data" and only goes away if the app is uninstalled or its
 * storage is cleared from Android settings — which is what the backup file is for.
 */

export const STORES = ["bikes", "items", "keys", "slots", "photos", "settings"] as const;
export type StoreName = (typeof STORES)[number];

interface DbConfig {
  name: string;
  version: number;
}

let config: DbConfig = { name: "bike-lot", version: 2 };
let dbPromise: Promise<IDBDatabase> | null = null;

/** Test hook: point the layer at a throwaway database. */
export function configureDb(next: Partial<DbConfig>): void {
  config = { ...config, ...next };
  dbPromise = null;
}

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser has no local database (IndexedDB unavailable)."));
      return;
    }
    const request = indexedDB.open(config.name, config.version);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const store of STORES) {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the local database."));
    request.onblocked = () => reject(new Error("The local database is open in another tab."));
  });
  return dbPromise;
}

function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return open().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const tx = database.transaction(store, mode);
        const request = action(tx.objectStore(store));
        let value: T;
        let settled = false;
        request.onsuccess = () => {
          value = request.result;
        };
        tx.oncomplete = () => {
          settled = true;
          resolve(value);
        };
        tx.onerror = () => {
          settled = true;
          reject(tx.error ?? request.error ?? new Error("Local database write failed."));
        };
        tx.onabort = () => {
          settled = true;
          reject(tx.error ?? new Error("Local database transaction aborted."));
        };
        // Safety net for environments that never fire tx events.
        if (!settled && mode === "readwrite" && request.readyState === "done" && request.error) {
          reject(request.error);
        }
      })
  );
}

export const db = {
  all<T>(store: StoreName): Promise<T[]> {
    return run<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>).then((rows) => rows ?? []);
  },
  get<T>(store: StoreName, id: string): Promise<T | undefined> {
    return run<T | undefined>(store, "readonly", (s) => s.get(id) as IDBRequest<T | undefined>);
  },
  put<T>(store: StoreName, value: T): Promise<void> {
    return run(store, "readwrite", (s) => s.put(value)).then(() => undefined);
  },
  remove(store: StoreName, id: string): Promise<void> {
    return run(store, "readwrite", (s) => s.delete(id)).then(() => undefined);
  },
  clear(store: StoreName): Promise<void> {
    return run(store, "readwrite", (s) => s.clear()).then(() => undefined);
  },
  async close(): Promise<void> {
    if (!dbPromise) return;
    const database = await dbPromise;
    database.close();
    dbPromise = null;
  },
};

/** Wipe everything — used by "import backup" and by tests. */
export async function clearAll(): Promise<void> {
  for (const store of STORES) await db.clear(store);
}
