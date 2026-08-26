import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./googleOAuthRoutes";
import { isProducerClient } from "./routers/sheets";

describe("reglas de planillas de Productores", () => {
  it("habilita la integración únicamente para el tipo Productor", () => {
    expect(isProducerClient("Productor")).toBe(true);
    expect(isProducerClient(" productor ")).toBe(true);
    expect(isProducerClient("Revendedor")).toBe(false);
    expect(isProducerClient(null)).toBe(false);
  });

  it("acepta retornos internos y bloquea redirecciones externas en OAuth", () => {
    expect(safeReturnPath("/sitios/42")).toBe("/sitios/42");
    expect(safeReturnPath("https://malicioso.example")).toBe("/admin/configuracion");
    expect(safeReturnPath("//malicioso.example")).toBe("/admin/configuracion");
    expect(safeReturnPath("\\malicioso.example")).toBe("/admin/configuracion");
  });
});
