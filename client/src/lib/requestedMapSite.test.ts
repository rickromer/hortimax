import { describe, expect, it } from "vitest";
import { parseRequestedMapSiteId } from "./requestedMapSite";

describe("cliente solicitado para el mapa principal", () => {
  it("obtiene el siteId desde la consulta de navegación", () => {
    expect(parseRequestedMapSiteId("?siteId=42")).toBe(42);
    expect(parseRequestedMapSiteId("siteId=9&origen=ficha")).toBe(9);
  });

  it("descarta parámetros ausentes o inválidos", () => {
    expect(parseRequestedMapSiteId("")).toBeNull();
    expect(parseRequestedMapSiteId("?siteId=0")).toBeNull();
    expect(parseRequestedMapSiteId("?siteId=abc")).toBeNull();
  });
});
