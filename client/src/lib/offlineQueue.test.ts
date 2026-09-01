/* @vitest-environment jsdom */
import { indexedDB } from "fake-indexeddb";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueueOfflineOperation,
  createClientRequestId,
  isOffline,
  listOfflineOperations,
  removeOfflineOperation,
  updateOfflineOperation,
} from "./offlineQueue";

function deleteQueueDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("hortimax-offline");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

describe("offlineQueue", () => {
  beforeEach(async () => {
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: indexedDB });
    await deleteQueueDatabase();
    vi.restoreAllMocks();
  });

  it("genera identificadores válidos y distintos para operaciones reintentables", () => {
    const first = createClientRequestId();
    const second = createClientRequestId();
    expect(first).toMatch(/^offline_[a-zA-Z0-9_-]+$/);
    expect(second).toMatch(/^offline_[a-zA-Z0-9_-]+$/);
    expect(first).not.toBe(second);
  });

  it("encola operaciones, conserva su orden y agrega una clave idempotente al payload", async () => {
    const first = await enqueueOfflineOperation("note.create", { siteId: 12, content: "Primera nota" });
    const second = await enqueueOfflineOperation("followup.create", { siteId: 12, description: "Próxima visita" });
    const operations = await listOfflineOperations();

    expect(operations.map(operation => operation.id)).toEqual([first.id, second.id]);
    expect(operations[0].input).toMatchObject({ siteId: 12, content: "Primera nota" });
    expect(operations[0].input.clientRequestId).toMatch(/^offline_[a-zA-Z0-9_-]+$/);
    expect(operations[0].attempts).toBe(0);
  });

  it("conserva el error y el contador de intentos hasta que el sincronizador la elimine", async () => {
    const operation = await enqueueOfflineOperation("site.create", { name: "Cliente sin señal" });
    await updateOfflineOperation({ ...operation, attempts: 1, lastError: "Sin conexión" });
    expect((await listOfflineOperations())[0]).toMatchObject({ attempts: 1, lastError: "Sin conexión" });

    await removeOfflineOperation(operation.id);
    expect(await listOfflineOperations()).toEqual([]);
  });

  it("no declara falta de señal cuando navigator está disponible y conectado", () => {
    act(() => {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    });
    expect(isOffline()).toBe(false);
  });
});
