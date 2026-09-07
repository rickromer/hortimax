import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("acceso táctil a ubicación desde Clientes", () => {
  it("abre el mapa principal enfocado al cliente al tocar la miniatura", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/SiteDetail.tsx"), "utf8");
    expect(source).toContain("Tocá para ir a este punto");
    expect(source).toContain('className="absolute inset-0 z-10 cursor-pointer bg-transparent');
    expect(source).toContain("requestMapFocus({");
    expect(source).toContain("onClick={goToSiteOnMap}");
    expect(source).toContain("Abrir este punto en el mapa principal");
    expect(source).not.toContain("setLocationActionsOpen");
    expect(source).toContain("Ver en mapa principal");
    expect(source).toContain("<PointLocationActions");
  });
});
