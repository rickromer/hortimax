import { describe, expect, it } from "vitest";
import { requestOrigin, safeReturnPath } from "./googleOAuthRoutes";
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

  it("prioriza el dominio público reenviado sobre el host interno de Cloud Run", () => {
    const origin = requestOrigin({
      protocol: "https",
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "mapaclientes-cqpci7xz.manus.space",
      },
      get: () => "u77ohgiy4f-q3r46t6abq-ue.a.run.app",
    } as any);

    expect(origin).toBe("https://mapaclientes-cqpci7xz.manus.space");
  });
});
