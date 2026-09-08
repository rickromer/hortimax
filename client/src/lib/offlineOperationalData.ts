import { createIndexedDbPersister } from "@/lib/indexedDbPersister";
import { clearOfflineOperations } from "@/lib/offlineQueue";

const PRELOAD_PREFIX = "hortimax-offline-preload-";
const OFFLINE_DATA_OWNER_KEY = "hortimax-offline-data-owner-v1";

/**
 * Borra únicamente la copia local operativa del usuario anterior. Nunca elimina
 * clientes, notas o visitas del servidor. Se ejecuta al cerrar sesión o antes
 * de autorizar una identidad distinta en el mismo teléfono.
 */
export async function clearOfflineOperationalData() {
  if (typeof window === "undefined") return;
  const tasks = [createIndexedDbPersister().removeClient(), clearOfflineOperations()];
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(PRELOAD_PREFIX)) localStorage.removeItem(key);
  }
  localStorage.removeItem(OFFLINE_DATA_OWNER_KEY);
  await Promise.allSettled(tasks);
}

/**
 * Evita mezclar carteras de personas distintas en un mismo teléfono, sin
 * descartar los registros pendientes del mismo usuario al volver a ingresar.
 */
export async function prepareOfflineOperationalDataForUser(userId: number) {
  if (typeof window === "undefined") return;
  const previousOwner = localStorage.getItem(OFFLINE_DATA_OWNER_KEY);
  if (previousOwner && previousOwner !== String(userId)) {
    await clearOfflineOperationalData();
  }
  localStorage.setItem(OFFLINE_DATA_OWNER_KEY, String(userId));
}
