import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("recuperación de caché web móvil", () => {
  it("publica una nueva caché y no intercepta las solicitudes de API", () => {
    const source = readFileSync(resolve(process.cwd(), "client/public/sw.js"), "utf8");

    expect(source).toContain('const CACHE_NAME = "hortimax-shell-v3"');
    expect(source).toContain('if (url.pathname.startsWith("/api/")) return');
    expect(source).toContain('caches.match("/acceso")');
  });
});
