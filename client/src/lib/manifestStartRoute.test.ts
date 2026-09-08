import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("inicio de HORTIMAX instalada", () => {
  it("abre la raíz del portal y no una ruta protegida que el borde puede rechazar", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "client/public/manifest.webmanifest"), "utf8")
    ) as { start_url?: string; scope?: string };

    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
  });
});
