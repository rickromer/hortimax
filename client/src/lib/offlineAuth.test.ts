/* @vitest-environment jsdom */
import { webcrypto } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOfflineSession,
  getOfflineSession,
  hasOfflineCredential,
  rememberOfflineCredential,
  setOfflineSession,
  verifyOfflineCredential,
} from "./offlineAuth";

const user = {
  id: 17,
  username: "nelson",
  name: "Nelson Galarza",
  phone: null,
  zone: null,
  role: "manager" as const,
  active: true,
};

describe("offlineAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto });
  });

  it("recuerda un verificador derivado y no guarda la contraseña", async () => {
    await rememberOfflineCredential(user, "ClaveSegura123");
    expect(hasOfflineCredential("NELSON")).toBe(true);
    expect(localStorage.getItem("hortimax-offline-credential-v1")).not.toContain("ClaveSegura123");
    await expect(verifyOfflineCredential("nelson", "ClaveSegura123")).resolves.toMatchObject({ id: 17, role: "manager" });
    await expect(verifyOfflineCredential("nelson", "otra-clave")).resolves.toBeNull();
  });

  it("mantiene una sesión offline hasta que el usuario cierre sesión", () => {
    setOfflineSession(user);
    expect(getOfflineSession()).toMatchObject({ username: "nelson", name: "Nelson Galarza" });
    clearOfflineSession();
    expect(getOfflineSession()).toBeNull();
    expect(hasOfflineCredential("nelson")).toBe(false);
  });
});
