import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/indexedDbPersister", () => ({
  createIndexedDbPersister: () => ({ removeClient: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@/lib/offlineQueue", () => ({ clearOfflineOperations: vi.fn().mockResolvedValue(undefined) }));

import { clearOfflineOperationalData, prepareOfflineOperationalDataForUser } from "./offlineOperationalData";

describe("aislamiento de datos offline", () => {
  it("no realiza ninguna limpieza durante renderizado de servidor", async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error Simula ejecución sin navegador.
    delete globalThis.window;
    await expect(clearOfflineOperationalData()).resolves.toBeUndefined();
    globalThis.window = originalWindow;
  });

  it("preserva el propietario registrado si el mismo usuario vuelve a ingresar", async () => {
    const values = new Map<string, string>();
    const originalWindow = globalThis.window;
    const originalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
        key: (index: number) => [...values.keys()][index] ?? null,
        get length() { return values.size; },
      },
    });
    localStorage.setItem("hortimax-offline-data-owner-v1", "12");
    await prepareOfflineOperationalDataForUser(12);
    expect(localStorage.getItem("hortimax-offline-data-owner-v1")).toBe("12");
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalStorage });
  });
});
