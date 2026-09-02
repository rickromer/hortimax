import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createIndexedDbPersister, shouldPersistOperationalQuery } from "./indexedDbPersister";

describe("persistencia operativa offline", () => {
  it("reconoce las claves reales de tRPC y excluye administración y autenticación", () => {
    expect(shouldPersistOperationalQuery([["sites", "list"], { input: {} }])).toBe(true);
    expect(shouldPersistOperationalQuery([["sites", "detail"], { input: { id: 12 } }])).toBe(true);
    expect(shouldPersistOperationalQuery([["calendar", "timeline"], { input: undefined }])).toBe(true);
    expect(shouldPersistOperationalQuery([["admin", "activityTimeline"], { input: {} }])).toBe(false);
    expect(shouldPersistOperationalQuery([["auth", "me"], { input: undefined }])).toBe(false);
  });

  it("guarda, restaura y elimina la caché completa en IndexedDB", async () => {
    const persister = createIndexedDbPersister();
    const client = {
      timestamp: 1_788_000_000_000,
      buster: "hortimax-v2",
      clientState: { mutations: [], queries: [] },
    };
    await persister.persistClient(client);
    expect(await persister.restoreClient()).toEqual(client);
    await persister.removeClient();
    expect(await persister.restoreClient()).toBeUndefined();
  });
});
