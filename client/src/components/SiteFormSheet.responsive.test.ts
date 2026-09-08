import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/components/SiteFormSheet.tsx"), "utf8");

describe("SiteFormSheet responsive layout", () => {
  it("apila los pares de campos en pantallas móviles", () => {
    expect(source).toContain('grid grid-cols-1 sm:grid-cols-2 gap-3');
  });

  it("usa toda la altura disponible y desplazamiento interno en Android", () => {
    expect(source).toContain('!flex h-[calc(100dvh-1rem)]');
    expect(source).toContain('overflow-y-auto overscroll-contain');
    expect(source).toContain('w-[calc(100vw-1rem)]');
  });

  it("compacta acciones de ubicación y pie dentro del ancho del diálogo", () => {
    expect(source).toContain('flex-col gap-2 sm:flex-row');
    expect(source).toContain('min-[420px]:grid-cols-[1fr_1fr_auto]');
    expect(source).toContain('grid grid-cols-2 gap-2');
  });
});
