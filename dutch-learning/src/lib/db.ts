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

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("could not open the database"));
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
    const transaction = db.transaction("kv", mode);
    const request = run(transaction.objectStore("kv"));
    request.onsuccess = () => resolve((read ? request.result : undefined) as T);
    request.onerror = () => reject(request.error ?? new Error("storage request failed"));
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
