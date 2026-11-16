/**
 * A key-value store on IndexedDB. One object store, three keys, because the whole
 * product state is small (cards, settings, attempts) and a relational schema would
 * buy nothing at this size. Photos and audio are not stored — audio is spoken by the
 * phone's own voice.
 */
let dbName = "taal";
let dbPromise: Promise<IDBDatabase> | null = null;

export function configureDb(options: { name: string }): void {
  dbName = options.name;
  dbPromise = null;
}

/**
 * Opening can hang instead of failing — a blocked upgrade, a corrupt data directory, a
 * WebView that has lost its storage. A promise that never settles would leave the app on
 * its loading screen forever, so the open is given a deadline and the cached promise is
 * dropped on failure to make the next attempt possible.
 */
const OPEN_TIMEOUT_MS = 6000;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      let settled = false;
      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        dbPromise = null;
        reject(new Error(message));
      };
      const deadline = setTimeout(
        () => fail("storage did not answer — the phone may be blocking it"),
        OPEN_TIMEOUT_MS,
      );

      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(dbName, 1);
      } catch (problem) {
        fail(problem instanceof Error ? problem.message : "this browser has no database");
        return;
      }

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      };
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        settled = true;
        clearTimeout(deadline);
        resolve(request.result);
      };
      request.onerror = () => fail(request.error?.message ?? "could not open the database");
      request.onblocked = () => fail("another copy of Taal is holding the database open");
    });
  }
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,

  read: boolean,
): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const settle = (error: Error | null, value?: T) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(value as T);
    };

    let transaction: IDBTransaction;
    try {
      transaction = db.transaction("kv", mode);
    } catch (problem) {
      settle(problem instanceof Error ? problem : new Error("the database is closed"));
      return;
    }
    // Success is the *transaction* committing, not the request returning: a refused
    // write (quota, eviction, a corrupted store) reports an aborted transaction after
    // the request has already looked fine. Resolving early would be a silent data loss.
    let value: T;
    transaction.oncomplete = () => settle(null, value);
    transaction.onabort = () => settle(transaction.error ?? new Error("the phone did not keep that write"));
    transaction.onerror = () => settle(transaction.error ?? new Error("storage request failed"));

    const request = run(transaction.objectStore("kv"));
    request.onsuccess = () => {
      value = (read ? request.result : undefined) as T;
    };
    request.onerror = () => settle(request.error ?? new Error("storage request failed"));
  });
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return withStore<T | undefined>("readonly", (store) => store.get(key), true);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await withStore<void>("readwrite", (store) => store.put(value, key), false);
}

export async function kvClear(): Promise<void> {
  await withStore<void>("readwrite", (store) => store.clear(), false);
}
