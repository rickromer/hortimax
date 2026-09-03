export const OFFLINE_MAP_URL = "/manus-storage/paraguay-shortbread-1.0_57af2ed3.pmtiles";
export const OFFLINE_MAP_FILE_NAME = "hortimax-paraguay.pmtiles";
export const OFFLINE_MAP_EXPECTED_BYTES = 174_661_701;

export type OfflineMapStatus = {
  available: boolean;
  bytes: number;
  updatedAt: number | null;
};

const META_KEY = "hortimax-offline-map-meta-v1";

function getStorageRoot() {
  if (!("storage" in navigator) || typeof navigator.storage.getDirectory !== "function") {
    throw new Error("Este navegador no admite almacenamiento local para el mapa completo.");
  }
  return navigator.storage.getDirectory();
}

function readMeta(): OfflineMapStatus {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return { available: false, bytes: 0, updatedAt: null };
    const parsed = JSON.parse(raw) as Partial<OfflineMapStatus>;
    return {
      available: parsed.available === true,
      bytes: typeof parsed.bytes === "number" ? parsed.bytes : 0,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : null,
    };
  } catch {
    return { available: false, bytes: 0, updatedAt: null };
  }
}

function writeMeta(status: OfflineMapStatus) {
  window.localStorage.setItem(META_KEY, JSON.stringify(status));
}

export function formatMapBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

export function isCompleteOfflineMap(bytes: number) {
  return bytes >= OFFLINE_MAP_EXPECTED_BYTES * 0.9;
}

export async function getOfflineMapStatus(): Promise<OfflineMapStatus> {
  if (typeof window === "undefined") return { available: false, bytes: 0, updatedAt: null };
  const current = readMeta();
  if (!current.available) return current;
  try {
    const root = await getStorageRoot();
    const handle = await root.getFileHandle(OFFLINE_MAP_FILE_NAME);
    const file = await handle.getFile();
    if (!isCompleteOfflineMap(file.size)) throw new Error("Archivo incompleto");
    return { ...current, bytes: file.size };
  } catch {
    const unavailable = { available: false, bytes: 0, updatedAt: null };
    writeMeta(unavailable);
    return unavailable;
  }
}

export async function getOfflineMapFile(): Promise<File | null> {
  const status = await getOfflineMapStatus();
  if (!status.available) return null;
  const root = await getStorageRoot();
  const handle = await root.getFileHandle(OFFLINE_MAP_FILE_NAME);
  return handle.getFile();
}

export async function downloadOfflineMap(onProgress?: (received: number, total: number) => void) {
  const response = await fetch(OFFLINE_MAP_URL, { cache: "no-store" });
  if (!response.ok || !response.body) throw new Error("No se pudo descargar el mapa offline de Paraguay.");
  const contentLength = Number(response.headers.get("content-length")) || OFFLINE_MAP_EXPECTED_BYTES;
  const root = await getStorageRoot();
  const handle = await root.getFileHandle(OFFLINE_MAP_FILE_NAME, { create: true });
  const writable = await handle.createWritable();
  const reader = response.body.getReader();
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      await writable.write(value);
      received += value.byteLength;
      onProgress?.(received, contentLength);
    }
    await writable.close();
  } catch (error) {
    await writable.abort();
    throw error;
  }

  if (!isCompleteOfflineMap(received)) {
    throw new Error("La descarga del mapa quedó incompleta. Probá nuevamente con Wi‑Fi.");
  }
  if (navigator.storage.persist) await navigator.storage.persist();
  const status = { available: true, bytes: received, updatedAt: Date.now() };
  writeMeta(status);
  return getOfflineMapFile();
}

export async function removeOfflineMap() {
  const root = await getStorageRoot();
  await root.removeEntry(OFFLINE_MAP_FILE_NAME).catch(() => undefined);
  const status = { available: false, bytes: 0, updatedAt: null };
  writeMeta(status);
  return status;
}
