import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("arranque de autenticación web", () => {
  it("no deja el guard en carga si la consulta queda pausada o supera el límite", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/_core/hooks/useAuth.ts"), "utf8");

    expect(source).toContain("export const AUTH_BOOT_TIMEOUT_MS = 8_000");
    expect(source).toContain("meQuery.fetchStatus !== \"paused\"");
    expect(source).toContain("!bootstrapTimedOut");
    expect(source).toContain("window.setTimeout(() => setBootstrapTimedOut(true), AUTH_BOOT_TIMEOUT_MS)");
  });
});
