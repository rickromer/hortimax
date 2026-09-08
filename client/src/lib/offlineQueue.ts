export type OfflineOperationKind = "site.create" | "site.update" | "site.checkin" | "note.create" | "followup.create";

export type OfflineOperation = {
  id: string;
  kind: OfflineOperationKind;
  input: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

const DB_NAME = "hortimax-offline";
const STORE_NAME = "operations";
const DB_VERSION = 1;
const CHANGE_EVENT = "hortimax-offline-change";

function browserAvailable() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir el almacenamiento offline"));
  });
}

async function withStore<T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest | void) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = callback(transaction.objectStore(STORE_NAME)) as IDBRequest | void;
    transaction.oncomplete = () => {
      db.close();
      if (request && "result" in request) resolve((request as IDBRequest).result as T);
      else resolve(undefined as T);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("No se pudo actualizar la cola offline"));
    };
  });
}

function notifyChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function createClientRequestId() {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `offline_${random.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/** Detecta cortes de red sin confundir errores de validación, permisos o negocio con falta de señal. */
export function isNetworkFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return error instanceof TypeError || /failed to fetch|networkerror|network request failed|load failed|internet disconnected|offline/i.test(message);
}

export async function enqueueOfflineOperation(kind: OfflineOperationKind, input: Record<string, unknown>) {
  if (!browserAvailable()) throw new Error("El almacenamiento offline no está disponible en este dispositivo");
  const operation: OfflineOperation = { id: createClientRequestId(), kind, input: { ...input, clientRequestId: createClientRequestId() }, createdAt: Date.now(), attempts: 0 };
  await withStore("readwrite", store => store.add(operation));
  notifyChange();
  return operation;
}

export async function listOfflineOperations(): Promise<OfflineOperation[]> {
  if (!browserAvailable()) return [];
  const rows = await withStore<OfflineOperation[]>("readonly", store => store.getAll());
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeOfflineOperation(id: string) {
  if (!browserAvailable()) return;
  await withStore("readwrite", store => store.delete(id));
  notifyChange();
}

/** El cierre de sesión revoca también operaciones locales pendientes de ese usuario. */
export async function clearOfflineOperations() {
  if (!browserAvailable()) return;
  await withStore("readwrite", store => store.clear());
  notifyChange();
}

export async function updateOfflineOperation(operation: OfflineOperation) {
  if (!browserAvailable()) return;
  await withStore("readwrite", store => store.put(operation));
  notifyChange();
}

export function onOfflineQueueChange(listener: () => void) {
  if (!browserAvailable()) return () => undefined;
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export { CHANGE_EVENT };
