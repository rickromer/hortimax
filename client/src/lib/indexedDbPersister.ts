import type { PersistedClient, Persister } from "@tanstack/query-persist-client-core";

const DATABASE = "hortimax-offline-cache-v2";
const STORE = "query-cache";
const KEY = "operational-data";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = database.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export function createIndexedDbPersister(): Persister {
  return {
    persistClient: client => transaction("readwrite", store => store.put(client, KEY)).then(() => undefined),
    restoreClient: () => transaction<PersistedClient | undefined>("readonly", store => store.get(KEY)),
    removeClient: () => transaction("readwrite", store => store.delete(KEY)).then(() => undefined),
  };
}

export function shouldPersistOperationalQuery(queryKey: readonly unknown[]) {
  const rawPath = queryKey[0];
  const path = Array.isArray(rawPath) ? rawPath.join(".") : String(rawPath ?? "");
  return ["sites.list", "sites.detail", "notes.list", "followups.list", "calendar.timeline"].includes(path);
}

/**
 * Mantiene el criterio estándar de TanStack: una consulta pendiente conserva
 * una promesa interna que IndexedDB no puede clonar. Solo se persisten datos
 * operativos que ya terminaron correctamente.
 */
export function shouldDehydrateOperationalQuery(query: {
  queryKey: readonly unknown[];
  state: { status: string };
}) {
  return query.state.status === "success" && shouldPersistOperationalQuery(query.queryKey);
}
