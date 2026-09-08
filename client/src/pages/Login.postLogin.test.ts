import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("finalización de login", () => {
  it("no espera la persistencia de credencial offline para entrar al mapa", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Login.tsx"), "utf8");

    expect(source).toContain('window.location.replace("/acceso")');
    expect(source).not.toContain('window.location.replace("/mapa")');
    expect(source).toContain("void rememberOfflineCredential(user, password).catch");
    expect(source).not.toContain("await rememberOfflineCredential(user, password)");
    expect(source).toContain("await prepareOfflineOperationalDataForUser(user.id)");
  });
});
