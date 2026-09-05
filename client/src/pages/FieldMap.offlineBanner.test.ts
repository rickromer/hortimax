import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("experiencia de mapa sin señal", () => {
  it("no tapa el lienzo del mapa con el aviso superior de sin señal", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/FieldMap.tsx"), "utf8");

    expect(source).not.toContain("Sin señal: Google Maps requiere Internet");
    expect(source).not.toContain("border-amber-300");
  });
});
