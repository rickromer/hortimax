import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("acceso táctil a ubicación desde Clientes", () => {
  it("abre opciones de ruta al tocar la miniatura y conserva el enlace al mapa principal", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/SiteDetail.tsx"), "utf8");
    expect(source).toContain("Tocá para ir a este punto");
    expect(source).toContain('className="absolute inset-0 z-10 cursor-pointer bg-transparent');
    expect(source).toContain("setLocationActionsOpen(true)");
    expect(source).toContain("Ver en mapa principal");
    expect(source).toContain("<PointLocationActions");
  });
});
