import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("transporte nativo del APK", () => {
  it("usa HTTP nativo solo para la API Android y entrega un token móvil sin Origin de WebView", () => {
    const root = process.cwd();
    const transport = readFileSync(resolve(root, "client/src/lib/nativeHttp.ts"), "utf8");
    const main = readFileSync(resolve(root, "client/src/main.tsx"), "utf8");
    const auth = readFileSync(resolve(root, "server/routers/auth.ts"), "utf8");
    const login = readFileSync(resolve(root, "client/src/pages/Login.tsx"), "utf8");

    expect(transport).toContain("CapacitorHttp.request");
    expect(transport).toContain('headers["X-Hortimax-Client"] = "android"');
    expect(transport).toContain("data = JSON.parse(body)");
    expect(main).toContain("httpLink({ url:");
    expect(main).toContain("const apiFetch = (input: RequestInfo | URL");
    expect(auth).toContain("(!origin || origin === \"http://localhost\"");
    expect(login).toContain("void completeOnlineLogin(response)");
  });
});
